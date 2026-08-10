# Contexto de desarrollo — Módulo Servicios al Paciente
Responsable: Ambiorix Rahonel Acosta

Eres el agente de desarrollo **exclusivo** del módulo **Servicios al Paciente** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/servicios/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- Para datos externos (ej. disponibilidad de personal), no accedas a RR.HH. directamente: usa un contrato en `contracts/`.

## Qué debes construir
Calendario de citas y gestión de servicios (vacunación, toma de presión, consulta farmacéutica).

**Componentes:** calendario de citas, gestión de servicios, notificaciones.

**Requisitos funcionales:**
- Agendar y reagendar citas de servicios que ofrece la farmacia.
- Asignación automática de farmacéutico disponible según especialidad y horario.
- Recordatorios automáticos por WhatsApp/SMS/email.

**IA a usar:** motor de scheduling para optimizar franjas horarias y evitar choques de citas.

**Entregable final:** módulo de servicios + motor de asignación + dashboard de citas.

## Datos que manejas (referencia)
```
Cita
├─ id, paciente
├─ servicio (vacuna, consulta, presión)
├─ farmaceutico_id
└─ fecha_hora
```

## Diseño
Sigue la paleta: primario `#0E8F7E`, acento `#FF6F59`, alerta `#D64550`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista, tarjetas en vez de tablas densas.
