const { env } = require('../config/env');
const { AppError } = require('../utils/app.error');

async function createChatCompletion(messages, model) {
  let data;

  try {
    const response = await fetch(`${env.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.openrouterReferer,
        'X-Title': 'Fusions3D AI'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(env.requestTimeoutMs)
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`OpenRouter respondió ${response.status} con ${model}: ${body}`);
      throw new AppError('El proveedor de IA ha devuelto un error', 502, 'AI_PROVIDER_ERROR');
    }

    data = await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('El servicio de IA no responde', 502, 'AI_UNAVAILABLE');
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError('El proveedor de IA ha devuelto una respuesta vacía', 502, 'AI_PROVIDER_ERROR');
  }

  return content;
}

module.exports = { createChatCompletion };
