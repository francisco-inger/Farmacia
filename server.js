import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let relativePath = req.url === '/' ? 'index.html' : req.url;
  // Strip query parameters
  relativePath = relativePath.split('?')[0];

  const filePath = path.join(__dirname, relativePath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 — Archivo no encontrado en el servidor general del proyecto</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Error del servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🏥 Servidor General del Proyecto SaaS Farmacia activo en http://localhost:${PORT}`);
  console.log(`📦 Módulo de Inventario (Ana María) visible en http://localhost:${PORT}/modules/inventario/`);
});
