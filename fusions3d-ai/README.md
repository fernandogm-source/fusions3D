# Fusions3D AI

Microservicio sin estado que usa Grok a través de OpenRouter. No tiene base de datos: cada petición contiene todos los datos necesarios. Solo lo debe llamar el backend principal (`fusions3d-back`).

## Puesta en marcha

```bash
cd fusions3d-ai
npm install
cp .env.example .env
npm run dev
```

El servicio queda en `http://localhost:3001`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio (público) |
| POST | `/ai/v1/prints/describe` | Genera descripción comercial de una impresión |

Todas las rutas `/ai/v1/*` requieren la cabecera `X-Internal-Api-Key` con el valor de `AI_SERVICE_KEY`.

### Ejemplo

```bash
curl -X POST http://localhost:3001/ai/v1/prints/describe \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: <AI_SERVICE_KEY>" \
  -d '{"name":"Soporte para auriculares","category":"Organización","locale":"es"}'
```

## Variables de entorno

Ver `.env.example`. `OPENROUTER_MODELS` es una lista de modelos gratuitos (sufijo `:free`) separados por comas. El servicio prueba el primero y, si falla o devuelve un formato incorrecto, pasa al siguiente. Los modelos gratuitos tienen límites de uso y su disponibilidad cambia; consulta `https://openrouter.ai/models?max_price=0` para ver la lista actual.

Los modelos gratuitos pueden registrar o usar los prompts según sus condiciones. Como este servicio solo recibe datos de catálogo, no datos personales, pero conviene tenerlo en cuenta.

## Tests

```bash
npm test
```
