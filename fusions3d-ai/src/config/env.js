require('dotenv').config();

const DEFAULT_FREE_MODELS = [
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.2-flash:free',
  'openrouter/free'
];

const env = {
  port: Number(process.env.PORT) || 3001,
  aiServiceKey: process.env.AI_SERVICE_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openrouterModels: process.env.OPENROUTER_MODELS
    ? process.env.OPENROUTER_MODELS.split(',').map((model) => model.trim()).filter(Boolean)
    : DEFAULT_FREE_MODELS,
  openrouterReferer: process.env.OPENROUTER_REFERER || 'http://localhost:3000',
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000
};

function validateEnv() {
  const required = ['AI_SERVICE_KEY', 'OPENROUTER_API_KEY'];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
}

module.exports = { env, validateEnv };
