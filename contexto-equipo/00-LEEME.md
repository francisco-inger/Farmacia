# Cómo usar estos archivos

## 1. Estructura de carpetas del repositorio (hazla así, es lo que hace la restricción REAL)

```
saas-farmacia/
├── modules/
│   ├── pos/              ← Adrian Felipe
│   ├── servicios/        ← Ambiorix
│   ├── inventario/       ← Ana María
│   ├── facturacion/      ← Anyelo
│   ├── rrhh/             ← Daniel
│   ├── orquestador/      ← Francisco (líder)
│   ├── chatbot/          ← Héctor
│   ├── analytics/        ← Kendry
│   ├── seguridad/        ← Luisa
│   ├── integraciones/    ← Rafi
│   └── qa/                ← Diego
└── contracts/            ← contratos de API/eventos entre módulos (solo lectura para todos, escritura solo Francisco)
```

Cada quien trabaja **solo dentro de su carpeta** en `modules/`. Si necesita datos de otro módulo, no entra a esa carpeta: define o consulta un contrato en `contracts/`.

## 2. Por qué dos niveles de restricción (no basta con pedírselo a la IA)

- **Nivel 1 — Prompt (el archivo de contexto):** le dice a la IA qué le toca y qué NO debe tocar. Funciona bien, pero es una instrucción, no un candado.
- **Nivel 2 — Estructural (la carpeta):** si cada quien abre su IA (Claude Code, Cursor, Copilot, etc.) **con la carpeta `modules/<su-módulo>/` como carpeta raíz del proyecto**, la IA físicamente no ve ni puede editar los archivos de los demás módulos, porque no están en su directorio de trabajo. Esto es lo que de verdad evita que se pisen el trabajo.

Recomendación: que cada persona abra su editor/IA apuntando **solo** a su subcarpeta, no al repo completo.

## 3. Qué hace cada persona

1. Se ubica en `modules/<su-carpeta>/`.
2. Abre su IA (Claude, ChatGPT, Cursor, Claude Code, etc.) con esa carpeta como raíz.
3. Pega como primer mensaje el archivo de contexto que le corresponde (`01-pos-adrian.md`, `02-servicios-ambiorix.md`, etc.) — o si usa Claude Code, lo guarda como `CLAUDE.md` dentro de su carpeta y la IA lo lee automáticamente al iniciar.
4. A partir de ahí le pide las tareas normalmente ("crea el endpoint de venta", "arma el formulario de cobro", etc.) — la IA ya sabe cuál es su alcance.

## 4. Si necesitan datos de otro módulo

Nadie edita la carpeta de otro. Se define un contrato simple en `contracts/` (ej. `contracts/venta-realizada.json` con los campos que el POS entrega al Orquestador). Solo Francisco (Orquestador) puede escribir en `contracts/`; los demás solo lo leen para saber qué esperar.

---

# Reglas de variables y sincronización

Esta segunda parte complementa la estructura de carpetas de arriba. Mientras esa resuelve "quién toca qué carpeta", esta resuelve "cómo nombramos y tipamos las cosas" para que los 11 módulos no se desincronicen entre sí. Todos los context-files individuales (`01-pos-adrian.md`, etc.) referencian esta sección.

## 5. Idioma de nombres: inglés para código, español solo para UI/negocio

Con 11 personas escribiendo código en paralelo, mezclar idiomas en nombres es la causa #1 de desincronización silenciosa (alguien busca `customer` y el dato está guardado como `cliente`).

- **Código (variables, funciones, clases, tablas, campos, eventos):** siempre en inglés.
- **Texto visible al usuario (labels, mensajes, PDFs, WhatsApp del chatbot):** en español.
- Prohibido mezclar: nada de `getCliente()`, `facturaTotal`, `venta_status`. Es `getCustomer()`, `invoiceTotal`, `sale_status`.

## 6. Convención de estilo por tipo de identificador

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones (JS/TS/Python) | camelCase | `getSaleTotal()`, `taxRate` |
| Clases, componentes, tipos/interfaces | PascalCase | `SaleOrder`, `InvoiceService` |
| Constantes globales / enums | UPPER_SNAKE_CASE | `SALE_STATUS_PAID` |
| Columnas y tablas de base de datos | snake_case, singular la tabla o plural (decidir una y no mezclar) | `sale_items`, `created_at` |
| Archivos y rutas de carpetas | kebab-case | `sale-controller.ts` |
| Eventos y colas (entre módulos) | `dominio.verbo_pasado` en snake_case | `sale.created`, `invoice.issued` |
| Variables de entorno | `MODULO_NOMBRE` en UPPER_SNAKE_CASE | `POS_DB_URL`, `FACTURACION_API_KEY` |

Esto se pone tal cual en el context-file de cada persona para que su IA lo respete desde el primer prompt.

## 7. IDs: una sola convención para todo el sistema

Si un módulo usa autoincremento numérico y otro UUID, el día que se cruzan datos vía contrato se rompe todo.

- **Todos los IDs de entidades que cruzan módulos son UUID v4**, como string.
- IDs internos de una tabla que jamás sale de un módulo pueden ser autoincremento, pero si existe la más mínima chance de que otro módulo la referencie, usar UUID desde el día uno (cambiarlo después es más caro que empezar bien).
- Nombre de campo: `<entidad>_id` (ej. `sale_id`, `patient_id`), nunca solo `id` cuando se pasa entre módulos, para evitar ambigüedad en joins/logs.

## 8. Fechas y horas

- Todo se guarda y se transmite en **ISO 8601 en UTC** (`2026-08-09T14:32:00Z`).
- La conversión a hora local de República Dominicana se hace solo en la capa de presentación (frontend, PDF, mensaje de WhatsApp), nunca en la base de datos ni en los contratos.
- Nombre de campo estándar: `createdAt`/`created_at`, `updatedAt`/`updated_at` (según si es código o DB), nunca `fecha`, `fechaCreacion`, etc.

## 9. Dinero

- Nunca usar `float`/`double` para montos. Guardar como **entero en centavos** (ej. RD$150.50 → `15050`) o usar tipo `decimal` si el motor de base de datos lo soporta bien (Postgres `numeric`).
- Campo de moneda explícito si en algún momento se maneja más de una: `currency: "DOP"`.
- Nombre estándar: `amountCents` o `amount` + `currency`, no `precio`, `monto`, `total` sueltos sin unidad clara.

## 10. Estados y enums: una sola fuente de verdad

Esto es lo que más rápido desincroniza un sistema con módulos separados: cada quien inventa sus propios strings de estado.

- Todo enum que se comparte entre 2+ módulos (estado de venta, estado de factura, rol de usuario, tipo de servicio) se **define una sola vez dentro de `contracts/`**, no dentro de cada módulo.
- Ejemplo: `contracts/enums/sale-status.json` con los valores permitidos (`pending`, `paid`, `cancelled`, `refunded`). Nadie escribe el string a mano en su código; lo importa del contrato o lo copia literal.
- Prohibido: que POS use `"pagado"` y Facturación use `"paid"` para el mismo estado.

## 11. Contratos (`contracts/`) — reglas duras

- Cada contrato es un **schema versionado** (JSON Schema, Zod, o similar), no solo un ejemplo de JSON suelto.
- Formato de nombre: `contracts/<evento-o-entidad>/v1.json` (ej. `contracts/sale-created/v1.json`).
- **Cambio no rompiente** (agregar campo opcional) → se puede editar el mismo archivo.
- **Cambio rompiente** (renombrar, quitar, o cambiar tipo de un campo) → se crea `v2`, y `v1` se mantiene hasta que todos los módulos que lo consumen migren. Francisco coordina la fecha de deprecación.
- Todo módulo que **recibe** datos de otro debe **validar contra el schema** antes de procesarlos, no asumir que van a venir completos o bien formados. Esto evita que un bug silencioso en un módulo tumbe a otro tres pasos después.
- Nadie edita `contracts/` salvo Francisco; los demás proponen el cambio (ej. como PR o como mensaje) y él lo aplica.

## 12. Eventos entre módulos (orquestador)

- Nombre: `<entidad>.<verbo_pasado>` (ej. `sale.created`, `invoice.issued`, `stock.updated`, `appointment.cancelled`). Nunca imperativo (`createSale`) para un evento que ya ocurrió.
- El payload del evento **es** el contrato correspondiente en `contracts/`, no una versión "resumida" o distinta que solo esa persona conoce.
- Todo evento lleva `eventId` (UUID), `occurredAt` (ISO 8601 UTC) y `version` (qué versión del contrato usa), para poder debuggear desincronizaciones después.

## 13. Base de datos entre módulos

- **Ningún módulo lee ni escribe directamente en las tablas de otro módulo.** Si Inventario necesita saber si una venta se hizo, no hace `SELECT` a la tabla `sales` de POS: consume el evento/contrato correspondiente. Esto es la regla estructural de las carpetas (sección 1-2), pero aplicada a datos.
- Si dos módulos necesitan un mismo catálogo (ej. lista de productos), ese catálogo vive en un solo módulo dueño (probablemente Inventario) y los demás lo consultan vía API definida en `contracts/`, no lo duplican en su propia base con otro nombre de campo.

## 14. Variables de entorno

- Prefijo obligatorio por módulo: `POS_DB_URL`, `POS_API_PORT`, `FACTURACION_DGII_KEY`, etc. Nunca una variable genérica como `DB_URL` o `API_KEY` sin prefijo — con 11 módulos corriendo, eso choca.
- Cada módulo mantiene su propio `.env.example` commiteado (sin valores reales) y su `.env` real en `.gitignore`.
- Ningún secreto (llaves de API, tokens de DGII, credenciales de banco) se hardcodea en el código ni se pega en el context-file de la IA.

## 15. Cosas concretas que causan desincronización (lista de chequeo)

Antes de dar por terminada una tarea, cada quien debería poder responder "no" a todas estas:

- ¿Renombré o cambié el tipo de un campo que otro módulo consume sin avisar/actualizar el contrato?
- ¿Definí un estado/enum a mano en vez de usar el de `contracts/`?
- ¿Estoy leyendo la tabla de otro módulo directamente en vez de pasar por su API/evento?
- ¿Asumí que un campo opcional del contrato siempre va a venir lleno?
- ¿Guardé una fecha en hora local en vez de UTC?
- ¿Guardé un monto como float?
- ¿Usé un ID autoincremental para algo que otro módulo podría necesitar referenciar?
- ¿Puse un secreto o URL de otro entorno hardcodeado?
- ¿Le puse nombre en español a una variable o campo de base de datos?
- ¿Cambié un contrato en `contracts/` sin ser Francisco, o sin avisar que lo necesito cambiado?

## 16. Resumen: cómo se combinan las dos capas de restricción

Cada context-file individual (`01-pos-adrian.md`, `02-servicios-ambiorix.md`, etc.) tiene, al inicio de sus "Reglas obligatorias", una línea que remite a este documento: nombres en inglés, IDs en UUID, fechas en UTC/ISO 8601, montos en centavos, estados solo desde `contracts/`.

Así la restricción de carpeta (nivel estructural) se combina con la restricción de nomenclatura (nivel de convención), que es la que evita que, aunque cada quien trabaje aislado, el sistema completo termine con 11 dialectos distintos de los mismos datos.
