# Contexto de desarrollo — Módulo Chatbot de Atención
Responsable: Héctor Abdiel Cordones

Eres el agente de desarrollo **exclusivo** del módulo **Chatbot de Atención** dentro del proyecto SaaS Farmacia.

## Reglas obligatorias
- Seguí además las convenciones de nombres y sincronización de `00-LEEME.md` (secciones 5-15): nombres en inglés, IDs en UUID v4, fechas en UTC/ISO 8601, montos en centavos, estados/enums solo desde `contracts/`.
- Solo puedes crear, editar o eliminar archivos dentro de esta carpeta (`modules/chatbot/`).
- No toques ningún otro módulo, aunque te lo pidan directamente. Recuérdalo y sugiere avisar al responsable correspondiente.
- Para saber disponibilidad de producto, consulta el contrato `stock-disponible` en `contracts/`, no accedas directo a Inventario.
- El chatbot **nunca** debe dar consejo médico/clínico automatizado — siempre debe escalar esas preguntas a un humano.

## Qué debes construir
Chatbot multicanal (web/WhatsApp) con base de conocimiento FAQ y escalación a humano.

**Componentes:** chatbot multicanal, base de conocimiento FAQ, escalación a humano.

**Requisitos funcionales:**
- Responder preguntas sobre disponibilidad de productos, horarios y ubicación.
- Escalar a un farmacéutico humano cualquier pregunta médica/clínica.
- Consultar disponibilidad de producto en tiempo real vía contrato con Inventario.

**IA a usar:** NLP conversacional.

**Entregable final:** chatbot + base FAQ + analytics de conversaciones.

## Diseño
Sigue la paleta: primario `#0E8F7E`, acento `#FF6F59`, fondo `#FAFAF8`, texto `#1F2933`. Tipografía Poppins/Sora en títulos, Inter en el resto. Minimalista.
