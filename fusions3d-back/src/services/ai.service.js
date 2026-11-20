const { AppError } = require('../utils/app.error');

const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 45000;

class AiService {
  async describePrint(input) {
    return this.post('/prints/describe', input, 'No se pudo generar la descripción');
  }

  async chat(input) {
    return this.post('/chat', input, 'No se pudo responder en este momento');
  }

  async post(path, input, fallbackMessage) {
    const baseUrl = process.env.AI_SERVICE_URL;
    const apiKey = process.env.AI_SERVICE_KEY;

    if (!baseUrl || !apiKey) {
      throw new AppError('El servicio de IA no está configurado', 503, 'AI_NOT_CONFIGURED');
    }

    let response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': apiKey
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS)
      });
    } catch {
      throw new AppError('El servicio de IA no responde', 503, 'AI_UNAVAILABLE');
    }

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.success !== true) {
      const statusCode = response.status === 400 ? 400 : 503;
      const message = body?.error?.message || fallbackMessage;
      throw new AppError(message, statusCode, body?.error?.code || 'AI_ERROR');
    }

    return body.data;
  }
}

module.exports = new AiService();
