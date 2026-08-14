# PharmaPlus - Sistema de Gestión Farmacéutica con Asistente IA

Sistema integral para gestión de farmacias con control de inventario, ventas (POS), compras, clientes, reportes financieros y un **Asistente Inteligente con IA (Groq)**.

---

## 👥 Guía para el Equipo de Trabajo

Para que cualquier miembro del equipo clone el repositorio y el **Chatbot / Asistente IA** funcione correctamente respondiendo a sus preguntas y ejecutando acciones en el sistema:

### 1. Requisitos Previos
- **Node.js** v18 o superior instalado.
- Una clave de API gratuita de Groq ([https://console.groq.com/keys](https://console.groq.com/keys)).

---

### 2. Configuración del Backend (Clave de IA)

1. Ingresa a la carpeta del backend:
   ```bash
   cd pharmaplus/backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo `.env` copiando el de ejemplo:
   ```bash
   cp .env.example .env
   ```
4. Abre el archivo `.env` y coloca tu **API Key de Groq**:
   ```env
   PORT=3001
   JWT_SECRET=pharmaplus_secret_key_2026
   GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
   DATABASE_PATH=./pharmaplus.db
   NODE_ENV=development
   ```
5. *(Opcional)* Si no configuras una clave de Groq, el sistema cuenta con un **motor de respuestas inteligentes de respaldo (offline)** para preguntas de stock, ventas, clientes y farmacia.

6. Inicia el backend:
   ```bash
   npm start
   ```

---

### 3. Configuración del Frontend

1. En una nueva terminal, ingresa a la carpeta del frontend:
   ```bash
   cd pharmaplus/frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la URL indicada (usualmente `http://localhost:5173` o `http://localhost:5178`).

---

## 🤖 Capacidades del Chatbot / Asistente IA

El asistente inteligente integrado en la plataforma puede:
- **Consultar Inventario en tiempo real:** Medicamentos con bajo stock, productos agotados, lotes próximos a vencer.
- **Resumen Financiero y Ventas:** Ventas del día, ingresos del mes, ticket promedio.
- **Acciones automáticas:** Creación rápida de productos, registro de compras y ajustes de stock directamente por comandos conversacionales.
- **Atención Farmacéutica:** Preguntas sobre dosificación, contraindicaciones e indicaciones generales de fármacos.
