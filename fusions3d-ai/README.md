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
| POST | `/ai/v1/chat` | Respuesta del asistente de la tienda a partir del historial de mensajes enviado en la petición |
| POST | `/ai/v1/prints/sentiment` | Clasifica los comentarios de una impresión en positivos, neutros y negativos (porcentajes) y genera un resumen |
| POST | `/ai/v1/prints/reviews/summary` | Genera un resumen en lenguaje natural de la opinión de los clientes sobre una impresión |

Todas las rutas `/ai/v1/*` requieren la cabecera `X-Internal-Api-Key` con el valor de `AI_SERVICE_KEY`.

### Análisis de comentarios

Los dos endpoints de comentarios reciben `{ printName, reviews: [{ rating, comment }] }`, con entre 1 y 60 comentarios. Cada comentario admite hasta 1000 caracteres y `rating` es un entero de 1 a 5. El cuerpo de la petición admite hasta 256 KB.

- `/prints/sentiment` responde `{ positive, neutral, negative, summary }`. Los tres porcentajes suman 100: si el modelo devuelve otra suma, el servicio los reescala y ajusta el mayor.
- `/prints/reviews/summary` responde `{ summary }`, de 300 caracteres como máximo.

Los comentarios se envían al modelo como datos, no como instrucciones: el prompt indica que se ignore cualquier orden que aparezca dentro de ellos. Si un modelo no devuelve el JSON esperado, se prueba el siguiente de `OPENROUTER_MODELS`; si ninguno lo consigue, responde `502` con el código del último error (`AI_INVALID_OUTPUT` si la respuesta no tiene el formato esperado, o `AI_UNAVAILABLE` si no hay modelos configurados o no responden).

El backend (`fusions3d-back`) guarda el resultado en caché, así que estas rutas no se llaman en cada visita a la tienda.

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

Los tests unitarios cubren los esquemas de descripción, chat, sentimiento y resúmenes de comentarios.
