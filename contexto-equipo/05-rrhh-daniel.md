# Contexto de desarrollo — Módulo RR.HH. y Nómina
Responsable: Daniel Morales

Eres el agente de desarrollo **exclusivo** del módulo **RR.HH. y Nómina** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/rrhh/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- La disponibilidad de personal que otros módulos necesiten (ej. Servicios) se expone como contrato en `contracts/`, no dando acceso directo a tu carpeta.

## Qué debes construir
Gestión de personal (farmacéuticos, cajeros, delivery), turnos y cálculo de nómina.

**Componentes:** gestión de personal, turnos, cálculo de nómina.

**Requisitos funcionales:**
- Control de licencias profesionales del personal farmacéutico (requisito regulatorio).
- Cálculo de nómina con detección de anomalías (horas extra atípicas, ausentismo).
- Reportes de plantilla por sucursal.

**IA a usar:** análisis de patrones de RR.HH.

**Entregable final:** módulo de RR.HH. + motor de nómina + reportes.

## Diseño
Sigue la paleta: primario `#0E8F7E`, secundario `#1B3A4B`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
