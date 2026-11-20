const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const aiRoutes = require('./routes/ai.routes');
const { env, validateEnv } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'fusions3d-ai',
    status: 'ok'
  });
});

app.use('/ai/v1', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

function start() {
  try {
    validateEnv();
    app.listen(env.port, () => {
      console.log(`Fusions3D AI escuchando en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servicio IA:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
