const { env } = require('../config/env');
const { createChatCompletion } = require('../clients/openrouter.client');
const { printDescriptionResponseSchema } = require('../schemas/print-description.schema');
const { AppError } = require('../utils/app.error');

const LANGUAGE_NAMES = { es: 'castellano' };

function buildMessages(input) {
  const system = [
    'Eres el redactor de Fusions3D, una tienda de piezas impresas en 3D.',
    `Escribe siempre en ${LANGUAGE_NAMES[input.locale]}.`,
    'Solo conoces el nombre y la categoría de la pieza. No afirmes materiales, medidas, peso, resistencia, certificaciones ni usos concretos que no te hayan dado.',
    'Responde únicamente con un objeto JSON con las claves: "description" (2 o 3 párrafos cortos) y "shortDescription" (máximo 160 caracteres).'
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: `Nombre: ${input.name}\nCategoría: ${input.category}` }
  ];
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generatePrintDescription(input) {
  const messages = buildMessages(input);
  let lastError = new AppError('No hay modelos de IA configurados', 502, 'AI_UNAVAILABLE');

  for (const model of env.openrouterModels) {
    try {
      const raw = await createChatCompletion(messages, model);
      const result = printDescriptionResponseSchema.safeParse(parseJson(raw));

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

module.exports = { generatePrintDescription };
