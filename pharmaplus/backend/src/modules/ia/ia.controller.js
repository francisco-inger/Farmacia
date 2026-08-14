const Groq = require('groq-sdk');
const { getDb } = require('../../db/database');

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  // FIX: antes se comparaba contra una key real hardcodeada (formato gsk_...),
  // lo cual bloqueaba Groq permanentemente si esa era (o coincidía con) la key real.
  // Ahora solo se rechazan placeholders obvios o keys demasiado cortas.
  const isMissingOrPlaceholder =
    !apiKey ||
    apiKey.trim().length < 20 ||
    apiKey.toLowerCase().includes('your_groq_api_key_here');

  if (!isMissingOrPlaceholder) {
    try {
      return new Groq({ apiKey });
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ─── DEFINE TOOL DEFINITIONS FOR GROQ FUNCTION CALLING ──────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_product',
      description: 'Añadir un nuevo producto o medicamento a la farmacia',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre exacto del producto' },
          sale_price: { type: 'number', description: 'Precio de venta al público' },
          cost_price: { type: 'number', description: 'Precio de costo' },
          stock: { type: 'number', description: 'Cantidad inicial en inventario' },
          code: { type: 'string', description: 'Código único' },
          min_stock: { type: 'number', description: 'Stock mínimo para alertas' }
        },
        required: ['name', 'sale_price', 'cost_price', 'stock']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_product',
      description: 'Editar o actualizar precio, stock o nombre de un producto',
      parameters: {
        type: 'object',
        properties: {
          product_identifier: { type: 'string', description: 'Nombre o ID exacto del producto' },
          name: { type: 'string' },
          sale_price: { type: 'number' },
          cost_price: { type: 'number' },
          stock: { type: 'number' },
          min_stock: { type: 'number' }
        },
        required: ['product_identifier']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_product',
      description: 'Eliminar o desactivar un producto de la base de datos',
      parameters: {
        type: 'object',
        properties: {
          product_identifier: { type: 'string', description: 'Nombre o ID del producto' }
        },
        required: ['product_identifier']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_client',
      description: 'Registrar un nuevo cliente en la farmacia',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del cliente' },
          cedula: { type: 'string', description: 'Cédula o RNC' },
          phone: { type: 'string', description: 'Teléfono' },
          email: { type: 'string', description: 'Email' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_client',
      description: 'Editar o actualizar información de un cliente',
      parameters: {
        type: 'object',
        properties: {
          client_identifier: { type: 'string', description: 'Nombre o ID del cliente' },
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          cedula: { type: 'string' }
        },
        required: ['client_identifier']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_client',
      description: 'Eliminar o desactivar un cliente de la base de datos',
      parameters: {
        type: 'object',
        properties: {
          client_identifier: { type: 'string', description: 'Nombre o ID del cliente a eliminar' }
        },
        required: ['client_identifier']
      }
    }
  }
];

// ─── EXECUTE SQLITE DB ACTIONS ──────────────────────────────────────────────
function executeTool(db, functionName, args, userId) {
  try {
    switch (functionName) {
      case 'add_product': {
        const { name, sale_price, cost_price, stock, code, min_stock = 20 } = args;
        const generatedCode = code || 'PRD-' + Math.floor(1000 + Math.random() * 9000);
        const stmt = db.prepare(`
          INSERT INTO products (name, code, category_id, cost_price, sale_price, stock, min_stock, is_active)
          VALUES (?, ?, 1, ?, ?, ?, ?, 1)
        `);
        const res = stmt.run(name, generatedCode, cost_price || (sale_price * 0.7), sale_price, stock, min_stock);
        return {
          success: true,
          action: 'add_product',
          message: `Confirmación de BD: Producto '${name}' (Código ${generatedCode}) registrado correctamente con ${stock} unidades a un precio de venta de RD$ ${sale_price.toFixed(2)}.`
        };
      }

      case 'update_product': {
        const { product_identifier, name, sale_price, cost_price, stock, min_stock } = args;
        const cleanId = String(product_identifier).trim();
        let prod = db.prepare(`SELECT * FROM products WHERE (id = ? OR name LIKE ? OR code LIKE ?) AND is_active = 1`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);

        if (!prod) {
          prod = db.prepare(`SELECT * FROM products WHERE id = ? OR name LIKE ? OR code LIKE ?`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);
        }

        if (!prod) return { success: false, message: `No se encontró ningún producto activo que coincida con '${product_identifier}'.` };

        const newName = name !== undefined ? name : prod.name;
        const newSale = sale_price !== undefined ? sale_price : prod.sale_price;
        const newCost = cost_price !== undefined ? cost_price : prod.cost_price;
        const newStock = stock !== undefined ? stock : prod.stock;
        const newMin = min_stock !== undefined ? min_stock : prod.min_stock;

        db.prepare(`
          UPDATE products SET name = ?, sale_price = ?, cost_price = ?, stock = ?, min_stock = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newName, newSale, newCost, newStock, newMin, prod.id);

        if (stock !== undefined && stock !== prod.stock) {
          db.prepare(`
            INSERT INTO inventory_movements (product_id, user_id, movement_type, quantity, previous_stock, new_stock, notes)
            VALUES (?, ?, 'ajuste', ?, ?, ?, 'Ajuste por Asistente IA')
          `).run(prod.id, userId || 1, Math.abs(stock - prod.stock), prod.stock, stock);
        }

        return {
          success: true,
          action: 'update_product',
          message: `Confirmación de BD: Producto '${newName}' (Código: ${prod.code}) actualizado en la base de datos. Stock: ${newStock} unidades | Precio: RD$ ${newSale.toFixed(2)}.`
        };
      }

      case 'delete_product': {
        const { product_identifier } = args;
        const cleanId = String(product_identifier).trim();
        let prod = db.prepare(`SELECT * FROM products WHERE id = ? OR name LIKE ? OR code LIKE ?`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);

        if (!prod) return { success: false, message: `No se encontró el producto '${product_identifier}'.` };

        db.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(prod.id);
        return {
          success: true,
          action: 'delete_product',
          message: `Confirmación de BD: El producto '${prod.name}' (Código: ${prod.code}) ha sido eliminado del catálogo activo.`
        };
      }

      case 'add_client': {
        const { name, cedula, phone, email } = args;
        const stmt = db.prepare(`INSERT INTO clients (name, cedula, phone, email, is_active) VALUES (?, ?, ?, ?, 1)`);
        const res = stmt.run(name, cedula || null, phone || null, email || null);
        return {
          success: true,
          action: 'add_client',
          message: `Confirmación de BD: Cliente '${name}' registrado exitosamente con ID ${res.lastInsertRowid} (Cédula: ${cedula || 'No especificada'}, Tel: ${phone || 'No especificado'}).`
        };
      }

      case 'update_client': {
        const { client_identifier, name, phone, email, cedula } = args;
        const cleanId = String(client_identifier).trim();
        let client = db.prepare(`SELECT * FROM clients WHERE id = ? OR name LIKE ? OR cedula LIKE ?`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);

        if (!client) return { success: false, message: `No se encontró ningún cliente registrado como '${client_identifier}'.` };

        db.prepare(`
          UPDATE clients SET name = ?, phone = ?, email = ?, cedula = ?, is_active = 1 WHERE id = ?
        `).run(
          name !== undefined ? name : client.name,
          phone !== undefined ? phone : client.phone,
          email !== undefined ? email : client.email,
          cedula !== undefined ? cedula : client.cedula,
          client.id
        );
        return {
          success: true,
          action: 'update_client',
          message: `Confirmación de BD: El cliente '${name || client.name}' (ID ${client.id}) ha sido actualizado con precisión.`
        };
      }

      case 'delete_client': {
        const { client_identifier } = args;
        const cleanId = String(client_identifier).trim();
        let client = db.prepare(`SELECT * FROM clients WHERE (id = ? OR name LIKE ? OR cedula LIKE ?) AND is_active = 1`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);

        if (!client) {
          client = db.prepare(`SELECT * FROM clients WHERE id = ? OR name LIKE ? OR cedula LIKE ?`).get(cleanId, `%${cleanId}%`, `%${cleanId}%`);
        }

        if (!client) return { success: false, message: `No se encontró ningún cliente activo con la información '${client_identifier}'.` };

        db.prepare(`UPDATE clients SET is_active = 0 WHERE id = ?`).run(client.id);
        return {
          success: true,
          action: 'delete_client',
          message: `Confirmación de BD: El cliente '${client.name}' (ID ${client.id}) ha sido eliminado de la base de datos activa.`
        };
      }

      default:
        return { success: false, message: `Acción completada.` };
    }
  } catch (err) {
    console.error(`Error ejecutando tool ${functionName}:`, err);
    return { success: false, error: err.message };
  }
}

// Clean up any accidental SQL blocks or raw function tags from output string
function cleanTechnicalText(text) {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/```sql[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/<function=[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/<function=[\s\S]*?>/gi, '');
  cleaned = cleaned.replace(/Ejecutando la herramienta[\s\S]*?\n/gi, '');
  cleaned = cleaned.replace(/Una vez que tenga esta información[\s\S]*?\n/gi, '');
  return cleaned.trim();
}

// ─── RESOLVER REFERENCIAS CONTEXTUALES ("quién las hizo", "y eso", etc.) ───
// El motor local (fallback sin Groq) es stateless: solo analiza el mensaje actual.
// Esta función detecta cuando un mensaje depende del tema del mensaje anterior
// (ej. "quién las hizo" después de "cuántas ventas hay") y fusiona ambos mensajes
// para que parseLocalIntent/generateLocalResponse tengan el contexto necesario.
const TOPIC_KEYWORDS_RE = /(venta|vendio|vendió|stock|inventario|cliente|caja|factura|receta|empleado|compra|auditor[ií]a|proveedor|categor[ií]a|lote|notificaci[oó]n|servicio|cat[aá]logo|producto)/i;

const REFERENTIAL_RE = /\b(qui[eé]n(es)?|eso|ello|lo mismo|los mismo|la misma|esa|ese|cuales|cu[aá]les|detalles|detalle|dame|mostrar|ver|listar)\b/i;

function resolveContextualMessage(message, history) {
  const lower = message.toLowerCase().trim();
  // si el mensaje ya trae su propio tema (ej: "ventas de ayer"), no lo toques
  if (TOPIC_KEYWORDS_RE.test(lower) && !/\b(cuales|cu[aá]les|detalles|detalle|qui[eé]n(es)?)\b/i.test(lower)) return message;
  // si no parece una referencia a algo anterior, tampoco
  if (!REFERENTIAL_RE.test(lower)) return message;

  if (!history || history.length === 0) return message;

  // busca hacia atrás el último mensaje de usuario que sí tenía un tema claro
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.role === 'user' && TOPIC_KEYWORDS_RE.test(h.content.toLowerCase())) {
      return `${h.content} ${message}`; // fusiona el tema anterior con la pregunta actual
    }
  }
  return message;
}


// ─── LOCAL INTENT PARSER & RESPONSE ENGINE ─────────────────────────────────
function parseLocalIntent(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Add Product Intent
  if (/añadir|anadir|crear|agregar|nuevo producto|insertar/i.test(lower) && /producto|medicamento|jarabe|pastilla|crema|articulo/i.test(lower)) {
    let name = text.replace(/.*?(añadir|anadir|crear|agregar|insertar)\s+(un\s+)?(nuevo\s+)?(producto|medicamento)?\s*(llamado|nombre)?/i, '').trim();
    name = name.split(/a\s+\d+|con\s+costo|precio|stock|costo/i)[0].trim() || 'Nuevo Producto';

    const priceMatch = text.match(/(?:precio|venta|a)\s*(?:de\s*)?(?:rd\$|\$)?\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:pesos|rd\$|\$)/i);
    const costMatch = text.match(/(?:costo|coste)\s*(?:de\s*)?(?:rd\$|\$)?\s*(\d+(?:\.\d+)?)/i);
    const stockMatch = text.match(/(?:stock|cantidad|unidades)\s*(?:de\s*)?(\d+)/i);

    const sale_price = priceMatch ? parseFloat(priceMatch[1]) : 100;
    const cost_price = costMatch ? parseFloat(costMatch[1]) : sale_price * 0.7;
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : 20;

    return {
      name: 'add_product',
      args: { name, sale_price, cost_price, stock }
    };
  }

  // Update Product Intent — extracción robusta del nombre del producto
  if (/editar|modificar|actualizar|cambiar/i.test(lower) && /producto|stock|precio|unidades|reposición|reposicion/i.test(lower)) {
    const stockMatch = text.match(/(?:stock|cantidad|a)\s*(?:de)?\s*(\d+)\s*(?:unidades)?/i);
    const priceMatch = text.match(/(?:precio|venta)\s*(?:a|de)?\s*(\d+(?:\.\d+)?)/i);

    let identifier = text
      .replace(/(?:editar|modificar|actualizar|cambiar)\s*(?:el\s+)?(?:producto\s+)?/i, '')
      .replace(/^(?:el\s+)?(?:stock|precio|cantidad)\s+(?:de(?:l)?\s+)?/i, '')
      .split(/\s+cambiando\b.*$/i)[0]
      .replace(/\s*(?:el\s+)?(?:stock|precio|cantidad)\s+(?:de\s+venta\s+)?(?:a|de)?\s*\d+.*$/i, '')
      .replace(/\s*(?:a|de|con|por|en)\s+\d+.*$/i, '')
      .trim();

    if (!identifier || identifier.length < 2) {
      const words = text.split(/\s+/);
      const productWords = words.filter(w => /^[A-ZÁÉÍÓÚÑ]/u.test(w) && !/^(Modificar|Editar|Cambiar|Actualizar|Stock|Precio|El|La|De|Del|A|Con|Por|En|Unidades|Reposición)$/i.test(w));
      identifier = productWords.join(' ') || '1';
    }

    return {
      name: 'update_product',
      args: {
        product_identifier: identifier,
        stock: stockMatch ? parseInt(stockMatch[1], 10) : undefined,
        sale_price: priceMatch ? parseFloat(priceMatch[1]) : undefined
      }
    };
  }

  // Delete Product Intent
  if (/eliminar|borrar|desactivar|quitar/i.test(lower) && /producto|medicamento/i.test(lower)) {
    const identifier = text.replace(/.*?(eliminar|borrar|desactivar|quitar)\s*(el\s+producto|producto)?/i, '').trim();
    return {
      name: 'delete_product',
      args: { product_identifier: identifier }
    };
  }

  // Add Client Intent
  if (/añadir|anadir|crear|agregar|nuevo cliente/i.test(lower) && /cliente|persona/i.test(lower)) {
    let name = text.replace(/.*?(añadir|anadir|crear|agregar)\s*(un\s+)?(nuevo\s+)?cliente\s*(llamado|nombre)?/i, '').trim();
    name = name.split(/con\s+cédula|cedula|teléfono|telefono|email/i)[0].trim() || 'Nuevo Cliente';
    const phoneMatch = text.match(/(?:teléfono|telefono|tel)\s*(\d[\d\s-]{7,})/i);
    const cedulaMatch = text.match(/(?:cédula|cedula|rnc)\s*(\d[\d\s-]{8,})/i);

    return {
      name: 'add_client',
      args: {
        name,
        phone: phoneMatch ? phoneMatch[1].trim() : null,
        cedula: cedulaMatch ? cedulaMatch[1].trim() : null
      }
    };
  }

  // Delete Client Intent
  if (/eliminar|borrar|desactivar|quitar/i.test(lower) && /cliente/i.test(lower)) {
    const identifier = text.replace(/.*?(eliminar|borrar|desactivar|quitar)\s*(el\s+cliente|cliente)?/i, '').trim();
    return {
      name: 'delete_client',
      args: { client_identifier: identifier }
    };
  }

  return null;
}

function generateLocalResponse(message, contextStr, db) {
  const lower = message.toLowerCase().trim();

  // ─── HELPER: resolve date filter from natural language ───
  function getDateFilter(text) {
    const l = text.toLowerCase();
    if (l.includes('ayer'))          return { clause: `DATE(created_at) = DATE('now', '-1 day')`, label: 'ayer' };
    if (l.includes('esta semana'))   return { clause: `created_at >= DATE('now', 'weekday 0', '-7 days')`, label: 'esta semana' };
    if (l.includes('semana'))        return { clause: `created_at >= DATE('now', 'weekday 0', '-7 days')`, label: 'esta semana' };
    if (l.includes('este mes'))      return { clause: `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`, label: 'este mes' };
    if (l.includes('mes'))           return { clause: `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`, label: 'este mes' };
    if (l.includes('hoy'))           return { clause: `DATE(created_at) = DATE('now')`, label: 'hoy' };
    return null;
  }

  // ─── GREETING / BIENVENIDA CÁLIDA ───
  if (/^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|saludos|ayuda|hi|hello|qu[eé] tal|c[oó]mo est[aá]s)/i.test(lower)) {
    return `¡Hola! 👋 Bienvenido/a a **PharmaPlus - Sistema Farmacéutico Inteligente**. 💊✨\n\nSoy tu asistente clínico y administrativo de farmacia. Puedo orientarte en cualquier consulta:\n\n💬 **Atención y Diálogo con Clientes:**\n• Consultas de medicamentos, síntomas (dolor de cabeza, fiebre, gripe, acidez, alergias) y posología.\n• Recomendaciones de botiquín, vacunas y servicios clínicos.\n\n📊 **Gestión Operativa de la Farmacia:**\n• **Inventario & Stock:** "¿Qué productos tienen stock bajo?", "Buscar Amoxicilina"\n• **Ventas & Cajas:** "¿Cuánto se vendió hoy?", "Ventas de ayer", "Estado de caja"\n• **Clientes & Pacientes:** "Buscar cliente Juan", "Registrar paciente"\n• **Compras & Facturación:** "Compras pendientes", "Secuencias NCF", "Auditoría"\n\n¿En qué te puedo colaborar en este momento? 😊`;
  }

  // ─── CONVERSATIONAL / DIÁLOGO GENERAL ───
  if (/^(gracias|muchas gracias|excelente|perfecto|genial|super|listo|entendido|ok|vale|muy bien)\b/i.test(lower)) {
    return `¡Siempre a tu orden! 😊 En **PharmaPlus** nos aseguramos de que tengas la mejor atención y control para tu farmacia. Si tienes otra pregunta sobre medicamentos, pacientes o ventas, aquí estoy. 🩺💊`;
  }
  if (/quién eres|quien eres|tu nombre|qué haces|que haces|qué puedes|que puedes|para qué sirves/i.test(lower)) {
    return `Soy el **Asistente Inteligente de PharmaPlus** 🏥✨.\n\nEstoy diseñado para:\n1. **Orientar a clientes y pacientes** sobre medicamentos, dosis recomendadas, cuidados de salud y servicios.\n2. **Ejecutar y consultar operaciones en tiempo real:** inventario, ventas, compras, caja chica, facturación DGII y altas de productos o clientes.\n\n¡Puedes preguntarme libremente cualquier duda!`;
  }

  // ─── CONSULTAS MÉDICAS / SÍNTOMAS / MEDICAMENTOS COMUNES ───
  if (/dolor de cabeza|migra[ñn]a|cefalea/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%paracetamol%' OR name LIKE '%ibuprofeno%' OR name LIKE '%aspirina%' OR name LIKE '%acetaminofen%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** (Stock: ${p.stock}) — RD$ ${p.sale_price.toFixed(2)}`).join('\n') : '• Paracetamol 500mg\n• Ibuprofeno 400mg';
    return `🩺 **Recomendación para Dolor de Cabeza / Cefalea:**\n\nPara el alivio de cefaleas leves a moderadas, comúnmente se recomiendan analgésicos como el **Paracetamol (Acetaminofén)** o antiinflamatorios como el **Ibuprofeno**.\n\n💊 **Disponibles en Farmacia:**\n${list}\n\n⚠️ *Nota:* Mantener buena hidratación, descansar en un ambiente oscuro y consultar al médico si el dolor persiste o es recurrente.`;
  }

  if (/gripe|resfriado|tos|congesti[oó]n|catarro|flema|garganta/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%antigripal%' OR name LIKE '%vitamina c%' OR name LIKE '%loratadina%' OR name LIKE '%jarabe%') AND is_active = 1 LIMIT 5`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** (Stock: ${p.stock}) — RD$ ${p.sale_price.toFixed(2)}`).join('\n') : '• Antigripal Compuesto\n• Vitamina C 500mg';
    return `🩺 **Recomendación para Gripe y Resfriado Común:**\n\nSe recomienda reposo, abundante líquido y tratamientos sintomáticos como descongestionantes, antihistamínicos (Loratadina/Cetirizina) y analgésicos para el malestar general.\n\n💊 **Opciones en Farmacia:**\n${list}\n\n🥤 *Consejo:* Añade Vitamina C y miel con limón tibio. Si hay dificultad para respirar o fiebre alta por más de 3 días, acude al médico.`;
  }

  if (/fiebre|temperatura alta/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%paracetamol%' OR name LIKE '%ibuprofeno%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Paracetamol 500mg';
    return `🌡️ **Control de Fiebre:**\n\nLos antipiréticos de primera línea son el **Paracetamol** o el **Ibuprofeno**. Se aconseja utilizar compresas tibias y monitorear la temperatura cada 4-6 horas.\n\n💊 **Medicamentos en inventario:**\n${list}\n\n🚨 *Importante:* En niños y bebés, dosificar estrictamente según el peso corporal bajo prescripción pediátrica.`;
  }

  if (/est[oó]mago|acidez|reflujo|gastritis|indigesti[oó]n|ardor|agruras/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%omeprazol%' OR name LIKE '%antiacido%' OR name LIKE '%aluminio%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Omeprazol 20mg\n• Antiácido Masticable';
    return `🩺 **Alivio de Acidez y Malestar Estomacal:**\n\nPara el ardor o reflujo se utilizan protectores gástricos (como **Omeprazol**) o antiácidos de acción rápida (Hidróxido de Aluminio y Magnesio).\n\n💊 **Productos en Farmacia:**\n${list}\n\n💡 *Recomendación:* Evitar alimentos irritantes, grasas, café y no acostarse inmediatamente después de comer.`;
  }

  if (/alergia|picaz[oó]n|ronchas|estornudo|rinitis/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%loratadina%' OR name LIKE '%cetirizina%' OR name LIKE '%desloratadina%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Loratadina 10mg';
    return `🌿 **Alivio de Alergias y Rinitis:**\n\nLos antihistamínicos no sedantes como la **Loratadina** o **Cetirizina** ayudan a controlar estornudos, picazón, ojos llorosos y ronchas.\n\n💊 **Disponibles en Farmacia:**\n${list}`;
  }

  if (/infecci[oó]n|antibi[oó]tico|amoxicilina|azitromicina/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%amoxicilina%' OR name LIKE '%azitromicina%' OR name LIKE '%ciprofloxacina%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Amoxicilina 500mg';
    return `💊 **Antibióticos e Infecciones:**\n\nDisponemos de antibióticos para prescripciones médicas autorizadas:\n${list}\n\n⚠️ **Aviso Clínico:** La dispensación de antibióticos requiere receta médica para prevenir resistencia bacteriana. Tome siempre el tratamiento completo prescrito por su médico.`;
  }

  if (/presi[oó]n|hipertensi[oó]n|tensi[oó]n arterial/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%losartan%' OR name LIKE '%enalapril%' OR name LIKE '%amlodipina%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Losartán 50mg\n• Enalapril 20mg';
    return `❤️ **Control de Presión Arterial:**\n\nDisponemos de medicamentos antihipertensivos y también realizamos la **toma de presión arterial** en el área de Servicios Clínicos de la farmacia.\n\n💊 **Opciones en catálogo:**\n${list}`;
  }

  if (/diabetes|glucosa|az[uú]car|insulina|metformina/i.test(lower)) {
    const prods = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE (name LIKE '%metformina%' OR name LIKE '%glibenclamida%' OR name LIKE '%insulina%') AND is_active = 1`).all();
    const list = prods.length > 0 ? prods.map(p => `• **${p.name}** — RD$ ${p.sale_price.toFixed(2)} (Stock: ${p.stock})`).join('\n') : '• Metformina 850mg';
    return `🩸 **Cuidado de la Diabetes & Glucosa:**\n\nEn **PharmaPlus** contamos con hipoglucemiantes orales, tiras reactivas y servicio de **Prueba Rápida de Glucosa** en sangre.\n\n💊 **Productos en Farmacia:**\n${list}`;
  }

  if (/horario|abierto|atenci[oó]n|d[oó]nde est[aá]n|ubicaci[oó]n|tel[eé]fono|contacto/i.test(lower)) {
    return `🏥 **Información de PharmaPlus:**\n• ⏰ **Horario:** Lunes a Domingo de 7:00 a.m. a 10:00 p.m. (Servicio de guardia 24h disponible).\n• 📍 **Ubicación:** Sucursal Principal, Av. 27 de Febrero esq. Winston Churchill.\n• 📞 **Teléfono / WhatsApp:** (809) 555-0199\n• 🚚 **Servicio a Domicilio:** Entregas rápidas en toda la zona metropolitana.`;
  }

  if (/domicilio|delivery|env[ií]o|entrega/i.test(lower)) {
    return `🛵 **Servicio de Entrega a Domicilio PharmaPlus:**\n\n¡Llevamos tus medicamentos y productos de cuidado personal directamente a tu puerta!\n• ⏱️ **Tiempo estimado:** 30 a 45 minutos.\n• 💳 **Formas de pago:** Efectivo, Tarjeta al entregar o Transferencia bancaria.\n• 📞 **Solicitudes:** Al teléfono (809) 555-0199 o en el módulo POS.`;
  }

  // ─── QUIÉN HIZO LAS VENTAS (desglose por cajero) ───
  if (/qui[eé]n/i.test(lower) && /venta|vendi/i.test(lower)) {
    const dateFilter = getDateFilter(lower) || { clause: `DATE(created_at) = DATE('now')`, label: 'hoy' };
    const byCashier = db.prepare(`
      SELECT u.name as user_name, COALESCE(SUM(s.total),0) as total, COUNT(*) as count
      FROM sales s LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'completada' AND ${dateFilter.clause}
      GROUP BY s.user_id
      ORDER BY total DESC
    `).all();
    if (byCashier.length === 0) return `📊 No hay ventas registradas ${dateFilter.label}.`;
    const list = byCashier.map(c => `• **${c.user_name || 'N/A'}** — RD$ ${c.total.toFixed(2)} (${c.count} ventas)`).join('\n');
    return `📊 **Ventas ${dateFilter.label} por cajero:**\n${list}`;
  }

  // ─── AUDITORÍA ───
  if (/auditor[ií]a|audit|registro de actividad|log de actividad|acciones recientes/i.test(lower)) {
    const logs = db.prepare(`SELECT user_name, action, module, description, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10`).all();
    if (logs.length === 0) return `📋 No hay registros de auditoría aún.`;
    const list = logs.map(l => {
      const date = l.created_at ? l.created_at.substring(0, 16).replace('T', ' ') : '';
      return `• [${date}] **${l.user_name || 'Sistema'}** — ${l.action} en ${l.module}${l.description ? ': ' + l.description : ''}`;
    }).join('\n');
    return `📋 **Últimos registros de auditoría:**\n${list}`;
  }

  // ─── CAJAS / CASH REGISTERS ───
  if (/caja|arqueo|cierre de caja|movimiento.*efectivo|cash/i.test(lower)) {
    const registers = db.prepare(`SELECT cr.id, cr.name, cr.status, cr.initial_amount, cr.expected_amount, u.name as user_name, cr.opened_at FROM cash_registers cr LEFT JOIN users u ON cr.user_id = u.id ORDER BY cr.opened_at DESC LIMIT 5`).all();
    if (registers.length === 0) return `💰 No hay cajas registradas en el sistema.`;
    const list = registers.map(r => {
      const estado = r.status === 'abierta' ? '🟢 Abierta' : '🔴 Cerrada';
      return `• **${r.name}** — ${estado} — Cajero: ${r.user_name || 'N/A'} — Monto inicial: RD$ ${(r.initial_amount || 0).toFixed(2)}`;
    }).join('\n');

    if (/movimiento|transacci[oó]n/i.test(lower)) {
      const movements = db.prepare(`SELECT cm.movement_type, cm.amount, cm.description, cm.created_at FROM cash_movements cm ORDER BY cm.created_at DESC LIMIT 8`).all();
      if (movements.length > 0) {
        const mvList = movements.map(m => {
          const date = m.created_at ? m.created_at.substring(11, 16) : '';
          return `• ${m.movement_type} — RD$ ${m.amount.toFixed(2)}${m.description ? ' — ' + m.description : ''} (${date})`;
        }).join('\n');
        return `💰 **Cajas:**\n${list}\n\n📝 **Últimos movimientos:**\n${mvList}`;
      }
    }
    return `💰 **Estado de Cajas:**\n${list}`;
  }

  // ─── COMPRAS / PURCHASES ───
  if (/compra|orden de compra|pedido|reabastecimiento|purchase/i.test(lower)) {
    const purchases = db.prepare(`SELECT p.purchase_number, p.total, p.status, p.order_date, s.company_name FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.created_at DESC LIMIT 5`).all();
    if (purchases.length === 0) return `📦 No hay órdenes de compra registradas.`;
    const list = purchases.map(p => {
      const statusEmoji = p.status === 'recibida' ? '✅' : p.status === 'pendiente' ? '⏳' : p.status === 'cancelada' ? '❌' : '📝';
      return `• ${statusEmoji} **${p.purchase_number || 'Sin #'}** — ${p.company_name || 'Proveedor N/A'} — RD$ ${(p.total || 0).toFixed(2)} — ${p.status}`;
    }).join('\n');
    return `📦 **Órdenes de Compra Recientes:**\n${list}`;
  }

  // ─── RRHH / EMPLEADOS ───
  if (/empleado|personal|trabajador|rrhh|recursos humanos/i.test(lower)) {
    const employees = db.prepare(`SELECT first_name, last_name, position, department, status, salary FROM employees ORDER BY first_name ASC LIMIT 8`).all();
    if (employees.length === 0) return `👥 No hay empleados registrados en la nómina.`;
    const list = employees.map(e => `• **${e.first_name} ${e.last_name}** — ${e.position} (${e.department}) — ${e.status}`).join('\n');
    return `👥 **Personal de la Farmacia (${employees.length}):**\n${list}`;
  }

  // ─── RECETAS / PRESCRIPCIONES ───
  if (/receta|prescripci[oó]n|m[eé]dico/i.test(lower)) {
    const rx = db.prepare(`SELECT rx_number, doctor_name, client_name, diagnosis, status, created_at FROM prescriptions ORDER BY created_at DESC LIMIT 5`).all();
    if (rx.length === 0) return `📋 No hay recetas médicas registradas recientemente.`;
    const list = rx.map(r => `• **${r.rx_number}** — Dr. ${r.doctor_name || 'N/A'} — Paciente: ${r.client_name || 'N/A'} — ${r.diagnosis || 'Consulta'} (${r.status})`).join('\n');
    return `📋 **Recetas Médicas Registradas:**\n${list}`;
  }

  // ─── FACTURAS / FISCAL ───
  if (/factura|comprobante|ncf|fiscal|dgii/i.test(lower)) {
    const invoices = db.prepare(`SELECT invoice_number, ncf, client_name, total, status, issued_at FROM invoices ORDER BY id DESC LIMIT 5`).all();
    if (invoices.length === 0) {
      const ncfs = db.prepare(`SELECT ncf_type_name, prefix, current_sequence, max_sequence, expiry_date FROM ncf_sequences WHERE is_active = 1 LIMIT 5`).all();
      if (ncfs.length > 0) {
        const list = ncfs.map(n => `• **${n.ncf_type_name}** (${n.prefix}) — Secuencia: ${n.current_sequence}/${n.max_sequence} — Vence: ${n.expiry_date || 'N/A'}`).join('\n');
        return `🧾 **Secuencias NCF activas:**\n${list}`;
      }
      return `🧾 No hay facturas registradas aún.`;
    }
    const list = invoices.map(i => {
      const date = i.issued_at ? i.issued_at.substring(0, 10) : '';
      return `• **${i.invoice_number || 'Sin #'}** — ${i.client_name || 'Cliente general'} — RD$ ${(i.total || 0).toFixed(2)} — ${i.status} (${date})`;
    }).join('\n');
    return `🧾 **Facturas Recientes:**\n${list}`;
  }

  // ─── SERVICIOS ───
  if (/servicio|nebulizaci[oó]n|inyecci[oó]n|presi[oó]n|glucosa|consulta/i.test(lower)) {
    const services = db.prepare(`SELECT name, price, duration_minutes, is_active FROM services ORDER BY name ASC`).all();
    if (services.length === 0) return `🩺 No hay servicios registrados.`;
    const list = services.map(s => {
      const status = s.is_active ? '🟢' : '🔴';
      return `• ${status} **${s.name}** — RD$ ${(s.price || 0).toFixed(2)} — ${s.duration_minutes} min`;
    }).join('\n');
    return `🩺 **Servicios Clínicos Disponibles en Farmacia:**\n${list}`;
  }

  // ─── NOTIFICACIONES ───
  if (/notificaci[oó]n|alerta|aviso|pendiente/i.test(lower)) {
    const notifs = db.prepare(`SELECT title, message, priority, type, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 8`).all();
    if (notifs.length === 0) return `🔔 No hay notificaciones pendientes. ¡Todo en orden!`;
    const unread = notifs.filter(n => !n.is_read).length;
    const list = notifs.map(n => {
      const icon = n.priority === 'CRITICAL' ? '🔴' : n.priority === 'HIGH' ? '🟠' : '🔵';
      const readMark = n.is_read ? '' : ' **(nueva)**';
      return `• ${icon} ${n.title}${readMark}`;
    }).join('\n');
    return `🔔 **Notificaciones (${unread} sin leer):**\n${list}`;
  }

  // ─── CONFIGURACIÓN ───
  if (/configuraci[oó]n|ajustes|setting|preferencia|nombre.*farmacia|rnc|itbis/i.test(lower)) {
    const settings = db.prepare(`SELECT key, value, description FROM system_settings ORDER BY key ASC`).all();
    if (settings.length === 0) return `⚙️ No hay configuraciones guardadas.`;
    const list = settings.map(s => `• **${s.description || s.key}:** ${s.value}`).join('\n');
    return `⚙️ **Configuración del Sistema:**\n${list}`;
  }

  // ─── CATEGORÍAS ───
  if (/categor[ií]a|clasificaci[oó]n|tipo de producto/i.test(lower)) {
    const cats = db.prepare(`SELECT name, color FROM categories WHERE is_active = 1 ORDER BY name ASC`).all();
    if (cats.length === 0) return `🏷️ No hay categorías registradas.`;
    const list = cats.map(c => `• **${c.name}**`).join('\n');
    return `🏷️ **Categorías de Productos (${cats.length}):**\n${list}`;
  }

  // ─── LOTES / VENCIMIENTOS ───
  if (/lote|vencimiento|expir|caducidad|batch/i.test(lower)) {
    const batches = db.prepare(`SELECT pb.batch_number, pb.expiry_date, pb.quantity, p.name as product_name FROM product_batches pb LEFT JOIN products p ON pb.product_id = p.id ORDER BY pb.expiry_date ASC LIMIT 10`).all();
    if (batches.length === 0) return `📅 No hay lotes registrados.`;
    const list = batches.map(b => {
      const expiry = b.expiry_date || 'Sin fecha';
      const isExpired = b.expiry_date && new Date(b.expiry_date) < new Date();
      const icon = isExpired ? '🔴' : '🟢';
      return `• ${icon} **${b.product_name}** — Lote: ${b.batch_number} — Vence: ${expiry} — ${b.quantity} unid.`;
    }).join('\n');
    return `📅 **Lotes y Vencimientos de Medicamentos:**\n${list}`;
  }

  // ─── SALES: per-user or per-time-period (general) ───
  if (/venta|vendio|vendió|genero|generó|genera|generado|dinero|facturado|facturo|facturó|ingreso|cobro|cobrado|recaud/i.test(lower)) {
    const dateFilter = getDateFilter(lower) || { clause: `DATE(created_at) = DATE('now')`, label: 'hoy' };

    if (/\b(cuales|cu[aá]les|detalles|detalle|listar|lista|desglose)\b/i.test(lower)) {
      const detailedSales = db.prepare(`
        SELECT s.sale_number, s.total, s.created_at, u.name as cashier_name 
        FROM sales s LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = 'completada' AND ${dateFilter.clause}
        ORDER BY s.created_at DESC
      `).all();

      if (detailedSales.length === 0) return `📊 No hay detalles de ventas registrados ${dateFilter.label}.`;
      const list = detailedSales.map(s => {
        const time = s.created_at ? s.created_at.substring(11, 16) : '';
        return `• **${s.sale_number || 'N/A'}** — RD$ ${s.total.toFixed(2)} — Cajero: ${s.cashier_name || 'N/A'} (${time})`;
      }).join('\n');
      return `📊 **Detalle de ventas ${dateFilter.label} (${detailedSales.length} transacciones):**\n${list}`;
    }

    const users = db.prepare(`SELECT id, name FROM users`).all();
    let userMatched = null;
    for (const u of users) {
      const nameParts = u.name.toLowerCase().split(/\s+/);
      const isMatch = nameParts.some(part => part.length > 2 && lower.includes(part)) || lower.includes(u.name.toLowerCase());
      if (isMatch) { userMatched = u; break; }
    }

    if (userMatched) {
      const salesStats = db.prepare(`SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales WHERE user_id = ? AND status = 'completada' AND ${dateFilter.clause}`).get(userMatched.id);
      return `📊 **${userMatched.name}** ha generado **RD$ ${salesStats.total.toFixed(2)}** ${dateFilter.label} (${salesStats.count} ventas).`;
    }

    const sales = db.prepare(`SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales WHERE status = 'completada' AND ${dateFilter.clause}`).get();
    return `📊 **Ventas ${dateFilter.label}:** RD$ ${sales.total.toFixed(2)} (${sales.count} transacciones).`;
  }

  // ─── STOCK / INVENTARIO ───
  if (/stock|inventario|agotado|bajo|faltante/i.test(lower)) {
    if (lower.trim() === 'inventario' || lower.trim() === 'stock') {
      const totalCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`).get()?.count || 0;
      const lowStockCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND is_active = 1`).get()?.count || 0;
      return `📦 **Resumen del Inventario Farmacéutico:**\n• Medicamentos/Productos activos: **${totalCount}**\n• Alertas de stock bajo: **${lowStockCount}**\n\n*(Escribe "catálogo" para ver todos o "stock bajo" para ver las alertas críticas).*`;
    }

    const lowStockProds = db.prepare(`SELECT name, code, stock, min_stock FROM products WHERE stock <= min_stock AND is_active = 1 ORDER BY stock ASC`).all();
    if (lowStockProds.length === 0) return `✅ Todo el inventario farmacéutico está en niveles óptimos de abastecimiento.`;
    const list = lowStockProds.map(p => `• **${p.name}** (${p.code}): **${p.stock}** unid. (mínimo: ${p.min_stock})`).join('\n');
    return `⚠️ **Medicamentos con Stock Bajo (${lowStockProds.length}):**\n${list}`;
  }


  // ─── CLIENTES / PACIENTES ───
  if (/cliente|paciente|directorio/i.test(lower)) {
    const clients = db.prepare(`SELECT name, cedula, phone FROM clients WHERE is_active = 1 ORDER BY id DESC LIMIT 5`).all();
    if (clients.length === 0) return `👥 No hay clientes registrados.`;
    const list = clients.map(c => `• **${c.name}** — Cédula/RNC: ${c.cedula || 'N/A'} — Tel: ${c.phone || 'N/A'}`).join('\n');
    return `👥 **Pacientes / Clientes Recientes:**\n${list}`;
  }

  // ─── PROVEEDORES / DISTRIBUIDORAS ───
  if (/proveedor|suplidor|distribuidora|laboratorio/i.test(lower)) {
    const suppliers = db.prepare(`SELECT company_name, contact_name, phone FROM suppliers LIMIT 5`).all();
    if (suppliers.length > 0) {
      const list = suppliers.map(s => `• **${s.company_name}** — Contacto: ${s.contact_name || 'N/A'} — Tel: ${s.phone || 'N/A'}`).join('\n');
      return `🏢 **Distribuidores y Proveedores Farmacéuticos:**\n${list}`;
    }
    return `🏢 No hay proveedores registrados.`;
  }

  // ─── CATÁLOGO DE PRODUCTOS ───
  if (/cat[aá]logo|lista de productos|todos los productos|medicamentos/i.test(lower)) {
    const products = db.prepare(`SELECT name, code, stock, sale_price FROM products WHERE is_active = 1 ORDER BY name ASC`).all();
    const list = products.map(p => `• **${p.name}** (${p.code}) — Stock: **${p.stock}** — RD$ ${p.sale_price.toFixed(2)}`).join('\n');
    return `📦 **Catálogo de Farmacia (${products.length} productos):**\n${list}`;
  }

  // ─── USUARIOS / ROLES ───
  if (/usuario|rol|acceso|permiso/i.test(lower)) {
    const users = db.prepare(`SELECT u.name, u.email, u.is_active, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.name ASC`).all();
    if (users.length === 0) return `👤 No hay usuarios registrados.`;
    const list = users.map(u => {
      const status = u.is_active ? '🟢' : '🔴';
      return `• ${status} **${u.name}** — ${u.role_name || 'Sin rol'} — ${u.email}`;
    }).join('\n');
    return `👤 **Usuarios y Roles del Sistema (${users.length}):**\n${list}`;
  }

  // ─── BÚSQUEDA FUZZY DE PRODUCTO ───
  const cleanMsg = message.trim();
  if (cleanMsg.length > 2) {
    const matchedProducts = db.prepare(`
      SELECT name, code, stock, sale_price 
      FROM products 
      WHERE is_active = 1 AND (name LIKE ? OR code LIKE ?)
      LIMIT 5
    `).all(`%${cleanMsg}%`, `%${cleanMsg}%`);
    if (matchedProducts.length > 0) {
      const list = matchedProducts.map(p => `• **${p.name}** (${p.code}) — Stock: **${p.stock}** — RD$ ${p.sale_price.toFixed(2)}`).join('\n');
      return `🔍 **Encontré estos medicamentos en PharmaPlus:**\n${list}`;
    }
  }

  // ─── RESPUESTA INTELIGENTE / DIÁLOGO DIRECTO CON EL CLIENTE ───
  return `Comprendo tu inquietud sobre **"${message}"**. 😊\n\nComo tu asistente farmacéutico en **PharmaPlus**, puedo orientarte tanto en salud como en la gestión de la farmacia:\n\n🩺 **Atención a Clientes y Pacientes:**\n• Alivio de síntomas comunes (dolor de cabeza, gripe, fiebre, acidez, alergias).\n• Consulta de dosis recomendadas, medicamentos y servicios clínicos.\n\n📊 **Consultas Rápidas del Sistema:**\n• **Ventas:** *"¿Cuánto se vendió hoy?"* o *"Ventas de ayer"*\n• **Inventario:** *"¿Cuáles productos tienen stock bajo?"* o *"Catálogo"*\n• **Cajas:** *"Estado de cajas"* o *"Movimientos"*\n• **Compras & Facturas:** *"Compras pendientes"* o *"Facturas recientes"*\n\n¿Deseas consultar algún producto o área en particular?`;
}

// ─── CONVERSATIONS API ───────────────────────────────────────────────────────
async function getConversations(req, res) {
  const db = getDb();
  const conversations = db.prepare(`SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC`).all(req.user.id);
  return res.json({ success: true, data: conversations });
}

async function getMessages(req, res) {
  const db = getDb();
  const conv = db.prepare(`SELECT user_id FROM ai_conversations WHERE id = ?`).get(req.params.id);
  if (!conv || conv.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  const messages = db.prepare(`SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`).all(req.params.id);
  return res.json({ success: true, data: messages });
}

async function createConversation(req, res) {
  const db = getDb();
  const result = db.prepare(`INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)`).run(req.user.id, 'Nueva conversación');
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM ai_conversations WHERE id = ?`).get(result.lastInsertRowid) });
}

// HIGH-PRECISION CONTEXT WITH EXACT FACT INJECTION FROM SQLITE
function getPharmacyContext(db) {
  try {
    const todaySales = db.prepare(`SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales WHERE DATE(created_at) = DATE('now') AND status = 'completada'`).get() || { total: 0, count: 0 };
    const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`).get()?.count || 0;
    const lowStockCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND stock > 0 AND is_active = 1`).get()?.count || 0;
    const outOfStockCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock = 0 AND is_active = 1`).get()?.count || 0;
    const totalClients = db.prepare(`SELECT COUNT(*) as count FROM clients WHERE is_active = 1`).get()?.count || 0;

    const productsList = db.prepare(`
      SELECT p.id, p.name, p.code, p.stock, p.min_stock, p.cost_price, p.sale_price, c.name as category 
      FROM products p LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1 ORDER BY p.name ASC LIMIT 100
    `).all() || [];

    const productsStr = productsList.map(p =>
      `• ${p.name} | Código: ${p.code} | Stock: ${p.stock} (Mín: ${p.min_stock}) | Precio Venta: RD$ ${p.sale_price.toFixed(2)} | Costo: RD$ ${p.cost_price.toFixed(2)}`
    ).join('\n');

    const lowStockProds = db.prepare(`SELECT name, code, stock, min_stock, sale_price FROM products WHERE stock <= min_stock AND is_active = 1 ORDER BY stock ASC`).all() || [];
    const lowStockStr = lowStockProds.map(p => `⚠️ ${p.name} (Código: ${p.code}): ${p.stock} unidades disponibles (Mínimo: ${p.min_stock}) | RD$ ${p.sale_price.toFixed(2)}`).join('\n');

    const clientsList = db.prepare(`SELECT id, name, cedula, phone, email FROM clients WHERE is_active = 1 ORDER BY id ASC LIMIT 50`).all() || [];
    const clientsStr = clientsList.map((c, i) => `${i+1}. ${c.name} | Cédula: ${c.cedula || 'No registrada'} | Teléfono: ${c.phone || 'No registrado'} | ID: ${c.id}`).join('\n');

    return `
=====================================================
REGISTROS EXACTOS EN BASE DE DATOS SQLITE DE PHARMAPLUS
=====================================================
- Ventas de hoy: RD$ ${todaySales.total.toFixed(2)} (${todaySales.count} transacciones completadas)
- Productos activos registrados: ${totalProducts}
- Clientes activos registrados: ${totalClients}
- Productos con stock bajo: ${lowStockCount}
- Productos agotados: ${outOfStockCount}

--- LISTA DE PRODUCTOS CON STOCK BAJO O AGOTADO ---
${lowStockStr || 'Ninguno por el momento. Todo el inventario está en niveles adecuados.'}

--- CATÁLOGO COMPLETO DE PRODUCTOS (DATOS EXACTOS) ---
${productsStr || 'Sin productos registrados.'}

--- DIRECTORIO COMPLETO DE CLIENTES (DATOS EXACTOS) ---
${clientsStr || 'Sin clientes registrados.'}
=====================================================
`;
  } catch (err) {
    return 'Resumen general de PharmaPlus activo.';
  }
}

// Detect CRUD DB Modification intents
function isDbModificationIntent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const crudKeywords = [
    'añadir', 'anadir', 'crear', 'agregar', 'insertar', 'nuevo producto', 'nuevo cliente',
    'editar', 'modificar', 'cambiar', 'actualizar', 'remplaza', 'reemplaza', 'reemplazar',
    'eliminar', 'elimina', 'borrar', 'borra', 'desactivar', 'quitar'
  ];
  return crudKeywords.some(k => lower.includes(k));
}

// ─── MAIN CHAT CONTROLLER ───────────────────────────────────────────────────
async function chat(req, res) {
  const { conversation_id, message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'El mensaje es requerido' });

  const db = getDb();
  let convId = conversation_id;

  if (!convId) {
    const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    const result = db.prepare(`INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)`).run(req.user.id, title);
    convId = result.lastInsertRowid;
  }

  // Save user message to DB
  db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)`).run(convId, message);
  db.prepare(`UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(convId);

  const groq = getGroqClient();

  // FIX: estas variables se declaran aquí, ANTES del try/catch, para que sigan
  // disponibles dentro del catch si Groq falla (antes daban ReferenceError).
  const isModification = isDbModificationIntent(message);
  let aiContent = '';
  let toolResultsSummary = [];

  // Historial reciente (ordenado por id, monotónico — created_at solo tiene
  // resolución de 1s en SQLite y puede desordenar mensajes cercanos).
  // Se calcula UNA vez aquí y se reutiliza tanto para Groq como para el
  // motor local, así el fallback también puede resolver referencias
  // contextuales ("quién las hizo" -> se fusiona con el mensaje anterior).
  const recentHistory = db.prepare(`
    SELECT role, content FROM ai_messages
    WHERE conversation_id = ?
    ORDER BY id DESC
    LIMIT 6
  `).all(convId).reverse();

  // El historial recién obtenido incluye el mensaje del usuario que acabamos
  // de guardar; lo excluimos para resolver contexto contra turnos anteriores.
  const historyBeforeCurrent = recentHistory.slice(0, -1);
  const resolvedMessage = resolveContextualMessage(message, historyBeforeCurrent);

  // IF GROQ API KEY IS NOT SET OR PLACEHOLDER -> USE LOCAL SQLITE ASSISTANT
  if (!groq) {
    if (isModification) {
      const parsedTool = parseLocalIntent(message);
      if (parsedTool) {
        const result = executeTool(db, parsedTool.name, parsedTool.args, req.user.id);
        toolResultsSummary.push({ tool: parsedTool.name, result });
        aiContent = result.message || 'Acción procesada.';
      }
    }

    if (!aiContent) {
      aiContent = generateLocalResponse(resolvedMessage, null, db);
    }

    // Save assistant message to DB
    const result = db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)`).run(convId, aiContent);
    const savedMessage = db.prepare(`SELECT * FROM ai_messages WHERE id = ?`).get(result.lastInsertRowid);

    return res.json({
      success: true,
      data: {
        conversation_id: convId,
        message: savedMessage,
        executed_actions: toolResultsSummary
      }
    });
  }

  // IF GROQ API KEY IS PRESENT -> RUN GROQ LLM WITH FALLBACK SAFETY
  try {
    const contextStr = getPharmacyContext(db);
    const systemPrompt = `
Eres "Asistente IA Pharma", la Inteligencia Artificial oficial de PharmaPlus.
Tu objetivo principal es responder con PRECISIÓN ABSOLUTA, FACTUALIDAD Y EXACTITUD basadas 100% en la base de datos de SQLite.

REGLAS DE PRECISIÓN ABSOLUTA:
1. Usa ÚNICAMENTE los nombres, códigos, precios (RD$), cantidades de stock, cédulas y teléfonos reales que aparecen en los datos de la base de datos de abajo.
2. Si te preguntan por un producto, incluye siempre de forma concisa: Nombre, Código, Stock y Precio de Venta (RD$).
3. Si te preguntan por un cliente, incluye siempre: Nombre, Cédula y Teléfono.
4. Si el usuario te pide añadir, editar o eliminar registros, invoca la herramienta correspondiente y confirma de forma ultra concisa (una frase).
5. NUNCA inventes o alucines datos. Si algo no está en el catálogo, indica claramente que no se encuentra registrado.
6. Habla en un tono natural, profesional y conciso en español.
7. Usa el historial de la conversación para resolver referencias como "quién", "eso", "lo mismo" al tema del mensaje anterior.
8. Usuario actual: ${req.user.name} (Rol: ${req.user.role_name || 'Admin'}).
9. RESPUESTAS ULTRA CORTAS Y PRECISAS: Sé directo, evita introducciones largas, explicaciones innecesarias o textos redundantes. Ve directo al grano.

REGISTROS EN TIEMPO REAL:
${contextStr}
`;

    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    if (isModification) {
      try {
        let completion = await groq.chat.completions.create({
          messages: messagesToSend,
          model: 'llama-3.3-70b-versatile',
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.1,
          max_tokens: 1024,
        });

        let responseMessage = completion.choices[0]?.message;

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          messagesToSend.push(responseMessage);

          for (const toolCall of responseMessage.tool_calls) {
            const funcName = toolCall.function.name;
            let funcArgs = {};
            try {
              funcArgs = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              funcArgs = {};
            }

            const result = executeTool(db, funcName, funcArgs, req.user.id);
            toolResultsSummary.push({ tool: funcName, result });

            messagesToSend.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: funcName,
              content: JSON.stringify(result)
            });
          }

          const updatedContext = getPharmacyContext(db);
          messagesToSend.push({
            role: 'system',
            content: `ESTADO ACTUALIZADO DE LA BASE DE DATOS DESPUÉS DE LA ACCIÓN:\n${updatedContext}\n\nResponde confirmando la acción de forma ultra precisa y concisa.`
          });

          const secondCompletion = await groq.chat.completions.create({
            messages: messagesToSend,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 1024,
          });

          aiContent = secondCompletion.choices[0]?.message?.content || toolResultsSummary[0]?.result?.message || 'Acción completada con precisión.';
        } else {
          aiContent = responseMessage?.content || 'Acción procesada.';
        }
      } catch (toolErr) {
        console.warn('Groq tool execution fallback:', toolErr.message);

        const fallbackCompletion = await groq.chat.completions.create({
          messages: messagesToSend,
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
          max_tokens: 1024,
        });
        aiContent = fallbackCompletion.choices[0]?.message?.content || 'Entendido. ¿Deseas realizar alguna otra consulta?';
      }
    } else {
      const chatCompletion = await groq.chat.completions.create({
        messages: messagesToSend,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1024,
      });

      aiContent = chatCompletion.choices[0]?.message?.content || '¡Hola! ¿En qué puedo ayudarte hoy?';
    }

    aiContent = cleanTechnicalText(aiContent);

    // Save assistant message to DB
    const result = db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)`).run(convId, aiContent);
    const savedMessage = db.prepare(`SELECT * FROM ai_messages WHERE id = ?`).get(result.lastInsertRowid);

    return res.json({
      success: true,
      data: {
        conversation_id: convId,
        message: savedMessage,
        executed_actions: toolResultsSummary
      }
    });

  } catch (error) {
    console.error('Groq AI Call Error (Falling back to local SQL assistant):', error.message);

    // FIX: isModification/aiContent/toolResultsSummary ahora están declarados
    // fuera del try, así que este bloque ya no explota con ReferenceError.
    if (isModification) {
      const parsedTool = parseLocalIntent(message);
      if (parsedTool) {
        const result = executeTool(db, parsedTool.name, parsedTool.args, req.user.id);
        toolResultsSummary.push({ tool: parsedTool.name, result });
        aiContent = result.message || 'Acción procesada.';
      }
    }

    if (!aiContent) {
      aiContent = generateLocalResponse(resolvedMessage, null, db);
    }

    const fallbackResult = db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)`).run(convId, aiContent);
    const savedMsg = db.prepare(`SELECT * FROM ai_messages WHERE id = ?`).get(fallbackResult.lastInsertRowid);

    return res.json({
      success: true,
      data: {
        conversation_id: convId,
        message: savedMsg,
        executed_actions: toolResultsSummary
      }
    });
  }
}

module.exports = { getConversations, getMessages, createConversation, chat };