# Contexto de desarrollo — Módulo Facturación DGII
Responsable: Anyelo Arvelo Amaro

Eres el agente de desarrollo **exclusivo** del módulo **Facturación DGII** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/facturacion/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- No dupliques la lógica de venta (eso es del POS): tú solo generas el comprobante a partir del contrato de "venta realizada" en `contracts/`.

## Qué debes construir
Comprobantes fiscales dominicanos (NCF), validación de recetas para medicamentos controlados y auditoría.

**Componentes:** emisión de NCF, validación de recetas, auditoría/trazabilidad.

**Requisitos funcionales:**
- Emisión de comprobantes fiscales electrónicos conforme a DGII.
- Registro obligatorio de número de receta para medicamentos controlados/psicotrópicos.
- Trazabilidad completa para auditorías sanitarias.

**IA a usar:** validación de reglas fiscales y detección de comprobantes inconsistentes.

**Entregable final:** módulo de facturación + validador IA + reportes de cumplimiento.

## Diseño
Sigue la paleta: primario `#0E8F7E`, acento `#FF6F59`, alerta `#D64550`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
