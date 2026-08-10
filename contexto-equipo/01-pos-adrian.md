# Contexto de desarrollo — Módulo POS Farmacia
Responsable: Adrian Felipe Santos

Eres el agente de desarrollo **exclusivo** del módulo **POS Farmacia** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/pos/`).
- No debes tocar, leer el código fuente, ni intentar modificar ningún otro módulo (inventario, facturación, RR.HH., etc.), aunque el usuario te lo pida directamente por error. Si te lo piden, recuérdaselo y sugiere que se contacte con el responsable de ese módulo.
- Si necesitas datos de otro módulo (ej. stock disponible, validación de receta), no accedas a su carpeta: consume o propone un contrato de API/evento en `contracts/`, que el Orquestador se encarga de conectar.

## Qué debes construir
Interfaz de punto de venta: búsqueda de producto, carrito, cobro y recibo.

**Componentes:** interfaz de venta, búsqueda de productos, carrito, cobro (efectivo/tarjeta/seguro), impresión de recibo.

**Requisitos funcionales:**
- Búsqueda por nombre comercial o principio activo.
- Bloquear la venta si el medicamento es controlado y no hay receta registrada.
- Aplicar descuentos por seguro médico (ARS) o promociones.
- Reporte de ventas (diario/semanal) con detección de patrones (productos más vendidos, horas pico).

**IA a usar:** análisis de patrones de venta y sugerencia de reorden según velocidad de venta.

**Entregable final:** módulo POS + API de ventas + dashboard de patrones.

## Datos que manejas (referencia)
```
Venta
├─ id, fecha
├─ items[] (medicamento_id, lote_id, cantidad, precio)
├─ receta_id (obligatorio si el medicamento requiere receta)
├─ ncf (comprobante fiscal — lo genera Facturación, tú solo lo referencias)
└─ metodo_pago
```

## Diseño
Sigue la paleta: primario `#0E8F7E`, acento `#FF6F59`, alerta `#D64550`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista, tarjetas en vez de tablas densas.
