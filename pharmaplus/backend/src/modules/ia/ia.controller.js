const Groq = require('groq-sdk');
const { getDb } = require('../../db/database');

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey !== 'your_groq_api_key_here') {
    return new Groq({ apiKey });
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
            INSERT INTO inventory_movements (product_id, user_id, movement_type, quantity, previous_stock, new_stock, reason)
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

  const groq = getGroqClient();
  if (!groq) {
    return res.status(500).json({ 
      success: false, 
      message: 'La API Key de Groq no está configurada correctamente en .env' 
    });
  }

  const db = getDb();
  let convId = conversation_id;

  if (!convId) {
    const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    const result = db.prepare(`INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)`).run(req.user.id, title);
    convId = result.lastInsertRowid;
  }

  try {
    // Save user message to DB
    db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)`).run(convId, message);
    db.prepare(`UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(convId);

    const contextStr = getPharmacyContext(db);
    const systemPrompt = `
Eres "Asistente IA Pharma", la Inteligencia Artificial oficial de PharmaPlus.
Tu objetivo principal es responder con PRECISIÓN ABSOLUTA, FACTUALIDAD Y EXACTITUD basadas 100% en la base de datos de SQLite.

REGLAS DE PRECISIÓN ABSOLUTA:
1. Usa ÚNICAMENTE los nombres, códigos, precios (RD$), cantidades de stock, cédulas y teléfonos reales que aparecen en los datos de la base de datos de abajo.
2. Si te preguntan por un producto, incluye siempre: Nombre, Código, Stock exacto y Precio de Venta (RD$).
3. Si te preguntan por un cliente, incluye siempre: Nombre, Cédula y Teléfono.
4. Si el usuario te pide añadir, editar o eliminar registros, invoca la herramienta correspondiente y confirma de forma concisa.
5. NUNCA inventes o alucines datos. Si algo no está en el catálogo, indica claramente que no se encuentra registrado.
6. Habla en un tono natural, elegante, cálido y profesional en español.
7. Usuario actual: ${req.user.name} (Rol: ${req.user.role_name || 'Admin'}).

REGISTROS EN TIEMPO REAL:
${contextStr}
`;

    // Fetch last 6 clean text messages
    const history = db.prepare(`SELECT role, content FROM (SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6) ORDER BY created_at ASC`).all(convId);

    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    const isModification = isDbModificationIntent(message);
    let aiContent = '';
    let toolResultsSummary = [];

    if (isModification) {
      try {
        let completion = await groq.chat.completions.create({
          messages: messagesToSend,
          model: 'llama-3.3-70b-versatile',
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.1, // LOW TEMPERATURE FOR HIGHEST PRECISION
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
            temperature: 0.1, // LOW TEMPERATURE FOR HIGHEST PRECISION
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
          temperature: 0.1, // LOW TEMPERATURE FOR HIGHEST PRECISION
          max_tokens: 1024,
        });
        aiContent = fallbackCompletion.choices[0]?.message?.content || 'Entendido. ¿Deseas realizar alguna otra consulta?';
      }
    } else {
      // Standard chat completion with temperature 0.1 for high factual precision
      const chatCompletion = await groq.chat.completions.create({
        messages: messagesToSend,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1, // LOW TEMPERATURE FOR HIGHEST PRECISION
        max_tokens: 1024,
      });

      aiContent = chatCompletion.choices[0]?.message?.content || '¡Hola! ¿En qué puedo ayudarte hoy?';
    }

    // Clean any accidental SQL or technical traces from output
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
    console.error('Groq AI Main Error:', error);
    try {
      const contextStr = getPharmacyContext(db);
      const fallbackText = `¡Hola! Aquí tienes los datos en tiempo real de **PharmaPlus**:\n\n${contextStr}\n\n¿En qué puedo ayudarte?`;
      
      db.prepare(`INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)`).run(convId, fallbackText);
      const savedMsg = db.prepare(`SELECT * FROM ai_messages WHERE id = (SELECT max(id) FROM ai_messages)`).get();

      return res.json({
        success: true,
        data: {
          conversation_id: convId,
          message: savedMsg
        }
      });
    } catch (dbErr) {
      return res.status(500).json({ success: false, message: 'Error procesando respuesta.' });
    }
  }
}

module.exports = { getConversations, getMessages, createConversation, chat };
