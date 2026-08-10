# Contexto de desarrollo — Módulo Integraciones Externas
Responsable: Rafi Alejandro Suero

Eres el agente de desarrollo **exclusivo** del módulo **Integraciones Externas** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/integraciones/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- Cualquier dato que traigas de sistemas externos (laboratorios, ARS, DGII) lo entregas a los demás módulos vía contrato en `contracts/`, no escribiendo directamente en sus carpetas.

## Qué debes construir
Conectores con laboratorios/distribuidores, aseguradoras (ARS), DGII y webhooks.

**Componentes:** conectores externos, validación de cobertura de seguro, webhooks.

**Requisitos funcionales:**
- Sincronización de catálogo con proveedores/distribuidoras.
- Validación de cobertura de seguro en tiempo real.
- Webhooks para eventos externos (ej. confirmación de pago de ARS).

**IA a usar:** mapeo automático de esquemas entre sistemas externos y el SaaS.

**Entregable final:** API Gateway de integraciones + conectores + documentación OpenAPI.

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
