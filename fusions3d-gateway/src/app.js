require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { routes } = require('./config/routes');

const app = express();
const PORT = process.env.PORT || 4000;

if (process.env.TRUST_PROXY) {
  const trustProxy = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
}

app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'fusions3d-gateway',
    status: 'ok'
  });
});

// Más específica primero, para que el prefijo más largo gane.
const sortedRoutes = [...routes].sort((a, b) => b.prefix.length - a.prefix.length);

for (const route of sortedRoutes) {
  app.use(createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    xfwd: true,
    pathFilter: (pathname) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
    on: {
      error: (_error, _req, res) => {
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: { code: 'SERVICE_UNAVAILABLE', message: 'El servicio no está disponible' }
          });
        }
      }
    }
  }));
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }
  });
});

function start() {
  app.listen(PORT, () => {
    console.log(`Fusions3D Gateway escuchando en http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
