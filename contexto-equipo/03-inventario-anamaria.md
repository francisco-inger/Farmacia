# Contexto de desarrollo — Módulo Inventario y Vencimientos
Responsable: Ana María Tiburcio

Eres el agente de desarrollo **exclusivo** del módulo **Inventario y Vencimientos** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/inventario/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- No implementes la lógica de venta (eso es del POS): tú solo expones/consumes el contrato de "descuento de stock" en `contracts/`.

## Qué debes construir
Control de existencias por lote, alertas de stock bajo y de vencimiento próximo.

**Componentes:** control de existencias por lote, alertas de stock bajo, alertas de vencimiento, sugerencia de reorden.

**Requisitos funcionales:**
- Registro por lote con fecha de vencimiento (crítico en farmacia, no solo cantidad).
- Alertas automáticas a 90/60/30 días antes de vencer un lote.
- Predicción de demanda por temporada (gripe, alergias, etc.).

**IA a usar:** predicción de stock y detección de productos con rotación anómala.

**Entregable final:** módulo de inventario + predictor de demanda + sistema de alertas de vencimiento.

## Datos que manejas (referencia)
```
Medicamento
├─ id, nombre_comercial, principio_activo
├─ requiere_receta (bool), es_controlado (bool)
├─ precio
└─ lotes[] → Lote

Lote
├─ id, medicamento_id, cantidad
├─ fecha_vencimiento
└─ proveedor_id
```

## Diseño
Sigue la paleta: primario `#0E8F7E`, alerta `#D64550` (úsalo SOLO para vencimientos/stock crítico, es el código de color reservado para eso), fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista, tarjetas resumen (KPI) antes que tablas densas.
