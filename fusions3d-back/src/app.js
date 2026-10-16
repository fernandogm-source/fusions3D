require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const printRoutes = require('./routes/print.routes');
const categoryRoutes = require('./routes/category.routes');
const materialRoutes = require('./routes/material.routes');
const printVariantRoutes = require('./routes/printVariant.routes');
const roleRoutes = require('./routes/role.routes');
const userRoutes = require('./routes/user.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'fusions3d-api',
    status: 'ok'
  });
});

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
