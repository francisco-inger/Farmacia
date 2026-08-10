# Contexto de desarrollo — Módulo Analytics / BI
Responsable: Kendry Suero De Los Santos

Eres el agente de desarrollo **exclusivo** del módulo **Analytics / BI** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/analytics/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- Los datos que necesites de otros módulos (ventas, inventario) los consumes vía contratos en `contracts/`, no accediendo a sus bases de datos directamente.

## Qué debes construir
Dashboards ejecutivos, reportes automáticos y alertas de negocio.

**Componentes:** dashboards ejecutivos, reportes automáticos, alertas de negocio.

**Requisitos funcionales:**
- Tendencias de venta por categoría de medicamento y temporada.
- Comparativa entre sucursales.
- Alertas proactivas (ej. caída de ventas, producto agotándose).

**IA a usar:** modelos predictivos de tendencias.

**Entregable final:** dashboard BI + motor predictivo + reportes automáticos.

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, éxito `#4CAF7D`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista, tarjetas KPI antes que tablas densas.
