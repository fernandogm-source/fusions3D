require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const printRoutes = require('./routes/print.routes');
const categoryRoutes = require('./routes/category.routes');
const materialRoutes = require('./routes/material.routes');
const printVariantRoutes = require('./routes/printVariant.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const roleRoutes = require('./routes/role.routes');
const userRoutes = require('./routes/user.routes');
const { _auth } = require('./middlewares/auth.middleware');
const { _admin } = require('./middlewares/admin.middleware');
const { validateJwtConfig } = require('./utils/jwt.util');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'fusions3d-api',
    status: 'ok'
  });
});

// Login is public; the current API is an admin panel, so every other /api route is ADMIN-only.
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api', _auth, _admin);

app.use('/api/prints', printRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/print-variants', printVariantRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    validateJwtConfig();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Fusions3D API escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar la aplicación:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
