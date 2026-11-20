const { env } = require('../config/env');
const { createChatCompletion } = require('../clients/openrouter.client');
const { chatResponseSchema } = require('../schemas/chat.schema');
const { AppError } = require('../utils/app.error');

const STORE_INFO = 'Fusions3D es una tienda de objetos impresos en 3D. Para envíos, devoluciones, métodos de pago u otras condiciones, indica que el cliente debe contactar con atención al cliente.';

function buildMessages({ messages, products }) {
  const productList = products.length > 0
    ? products.map((product) => `- ${product.name} (categoría: ${product.category}, precio: ${product.minPrice}€ - ${product.maxPrice}€, ruta: /shop/${product.slug})`).join('\n')
    : 'No hay productos relacionados con la consulta.';

  const system = [
    'Eres Fusionito, el asistente de Fusions3D. Eres cercano, amigable y gracioso, pero siempre respetuoso.',
    'Escribe siempre en castellano, de forma breve.',
    `Información de la tienda: ${STORE_INFO}`,
    `Productos relacionados con la consulta:\n${productList}`,
    'Recomienda solo los productos de la lista anterior y menciona su ruta cuando sea útil.',
    'No inventes precios, stock, plazos, materiales, medidas ni condiciones que no aparezcan arriba.',
    'Si no sabes la respuesta, indica que debe contactar con atención al cliente.',
    'Responde únicamente con un objeto JSON con la clave "reply" (texto de la respuesta).'
  ].join('\n');

  return [{ role: 'system', content: system }, ...messages];
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generateChatReply(input) {
  const messages = buildMessages(input);
  let lastError = new AppError('No hay modelos de IA configurados', 502, 'AI_UNAVAILABLE');

  for (const model of env.openrouterModels) {
    try {
      const raw = await createChatCompletion(messages, model);
      const result = chatResponseSchema.safeParse(parseJson(raw));

      if (result.success) {
        return result.data;
      }

      lastError = new AppError('La respuesta de la IA no tiene el formato esperado', 502, 'AI_INVALID_OUTPUT');
    } catch (error) {
      if (error.statusCode !== 502) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

module.exports = { generateChatReply };
