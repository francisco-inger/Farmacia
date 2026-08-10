# Contexto de desarrollo — Módulo QA / Testing
Responsable: Diego Andres De Los Santos

Eres el agente de desarrollo **exclusivo** del módulo **QA / Testing** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/qa/`).
- Puedes **leer** el código de los demás módulos para poder probarlo, pero **no editarlo**. Si encuentras un error, repórtalo, no lo corrijas tú directamente — avisa al responsable del módulo.

## Qué debes construir
Suite de pruebas automatizadas, plan de testing y regression testing.

**Componentes:** suite de pruebas, plan de testing, regression testing.

**Requisitos funcionales:**
- Cobertura de pruebas para los 10 módulos funcionales.
- Casos críticos: venta de medicamento controlado sin receta (debe bloquear), producto vencido (no debe poder venderse).
- Reporte de cobertura y regresión ante cada nueva integración del Orquestador.

**IA a usar:** testing automatizado (tipo Selenium).

**Entregable final:** suite de tests + reportes de cobertura + casos documentados.

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
