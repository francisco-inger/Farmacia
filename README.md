# SaaS Farmacia — Proyecto Final de Ingeniería de Requisitos

Sistema SaaS modular e integrado para gestión farmacéutica.

## 👥 Equipo y Responsabilidades de Módulos

| Módulo | Responsable | Descripción |
|---|---|---|
| **Orquestador Central** | Francisco Rosendo Diaz (Líder) | API Gateway, auth, bus de eventos, dashboard consolidado |
| **POS (Punto de Venta)** | Adrian Felipe | Ventas en caja, facturación rápida, cobros |
| **Servicios** | Ambiorix | Citas, servicios clínicos, asignación de personal |
| **Inventario** | Ana María | Catálogo de medicamentos, lotes, stock, transferencias |
| **Facturación** | Anyelo | Comprobantes fiscales (NCF), facturación electrónica |
| **RR.HH.** | Daniel | Personal, turnos, nómina, asistencia |
| **Chatbot** | Héctor | Atención automatizada por WhatsApp/Web |
| **Analytics** | Kendry | BI, reportes gerenciales, proyecciones |
| **Seguridad** | Luisa | RBAC, auditoría imborrable, encriptación |
| **Integraciones** | Rafi | ARS, pasarelas de pago, proveedores |
| **QA** | Diego | Pruebas end-to-end, monitoreo de contratos |

---

## 📁 Estructura del Repositorio

```
.
├── contexto-equipo/       # Guías y contexto inicial de desarrollo por integrante
└── sas-farmacia/
    ├── contracts/         # Contratos de API/eventos entre módulos (Solo lectura para integrantes; escritura: Francisco)
    └── modules/           # Módulos del sistema
        ├── analytics/
        ├── chatbot/
        ├── facturacion/
        ├── integraciones/
        ├── inventario/
        ├── orquestador/
        ├── pos/
        ├── qa/
        ├── rrhh/
        ├── seguridad/
        └── servicios/
```

---

## 🔒 Reglas de Trabajo para Integrantes

1. Cada integrante trabaja **únicamente en su subcarpeta** dentro de `modules/`.
2. **Nombres en el código:** Variables, funciones, tablas y contratos deben estar en **inglés** (`camelCase` para variables, `PascalCase` para clases, `snake_case` para DB).
3. **Texto de UI:** Mensajes y etiquetas visibles al cliente deben estar en **español**.
4. **IDs:** Usar `UUID v4` para todos los identificadores que crucen módulos (`<entidad>_id`).
5. **Fechas:** Todo en formato **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`).
6. **Dinero:** Montos guardados como **enteros en centavos** (ej. RD$150.50 → `15050`).
7. **Contratos:** Si necesitas comunicarte con otro módulo, consulta o solicita un esquema en `contracts/`. No edites directamente el código de otro módulo.
