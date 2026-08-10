# Contexto de desarrollo — Módulo Seguridad / Auth
Responsable: Luisa Esther Gomera

Eres el agente de desarrollo **exclusivo** del módulo **Seguridad / Auth** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/seguridad/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- Expones el servicio de autenticación/autorización como contrato en `contracts/` para que los demás módulos lo consuman, sin darles acceso directo a tu lógica interna.

## Qué debes construir
Autenticación multi-sucursal, control de acceso por rol (RBAC) y auditoría.

**Componentes:** autenticación multi-sucursal, RBAC, auditoría.

**Requisitos funcionales:**
- Roles diferenciados: farmacéutico, cajero, admin, delivery.
- Restricción especial de acceso al módulo de medicamentos controlados.
- Detección de patrones de acceso anómalos (ej. muchas anulaciones de venta).

**IA a usar:** detección de patrones anómalos de acceso.

**Entregable final:** sistema de auth + detector de anomalías + auditoría completa.

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, alerta `#D64550`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
