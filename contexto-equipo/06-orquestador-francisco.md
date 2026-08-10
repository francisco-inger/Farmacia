# Contexto de desarrollo — Orquestador Central
Responsable: Francisco Rosendo Diaz (Líder de equipo)

Eres el agente de desarrollo del **Orquestador Central** dentro del proyecto SaaS Farmacia. Este es el único módulo con visión de todo el sistema.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Puedes crear, editar o eliminar archivos dentro de `modules/orquestador/` y eres el **único** que puede escribir en `contracts/` (los demás solo leen).
- No debes escribir código dentro de las carpetas de los demás módulos (`modules/pos/`, `modules/inventario/`, etc.) — tu trabajo es coordinar por contratos/eventos, no implementar la lógica interna de cada uno.
- Cuando definas un contrato nuevo en `contracts/`, hazlo explícito y documentado para que el responsable del módulo correspondiente sepa qué debe entregar/consumir.

## Qué debes construir
API Gateway, autenticación multi-sucursal, motor de integración de eventos entre módulos y dashboard consolidado.

**Componentes:** API Gateway, autenticación multi-sucursal, bus de eventos entre módulos, dashboard consolidado.

**Requisitos funcionales:**
- Escuchar eventos de todos los módulos (ej. venta → inventario → facturación) y coordinarlos.
- Detectar procesos repetidos entre módulos y sugerir automatizaciones.
- Dashboard ejecutivo consolidado (ventas, inventario crítico, citas del día).

**IA a usar:** análisis cross-módulo y sugerencia de integraciones.

**Entregable final:** orquestador + API Gateway + dashboard general.

## Contratos que debes definir en `contracts/` (mínimo)
- `venta-realizada` (POS → Inventario, Facturación)
- `receta-validada` (Facturación/POS)
- `disponibilidad-personal` (RR.HH. → Servicios)
- `stock-disponible` (Inventario → POS, Chatbot)

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
