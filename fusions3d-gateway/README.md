# Fusions3D Gateway

API Gateway de Fusions3D. Recibe todas las peticiones del frontend en el puerto `4000` y las reenvía al servicio que corresponde según el prefijo de la ruta. Solo enruta: no valida tokens ni transforma peticiones o respuestas.

## Rutas

| Prefijo | Destino | Variable |
|---|---|---|
| `/api/*` | Backend (`fusions3d-back`, puerto 3000) | `BACK_URL` |
| `/health` | Health check propio del gateway | — |

El microservicio de IA (`fusions3d-ai`) no pasa por el gateway: lo llama solo el backend.

Las rutas no reconocidas responden `404` con `ROUTE_NOT_FOUND`. Si un servicio no responde, el gateway responde `502` con `SERVICE_UNAVAILABLE`.

## Configuración

Copia `.env.example` a `.env`:

```env
PORT=4000
BACK_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:4200
TRUST_PROXY=
```

Para añadir un servicio, agrega una entrada en `src/config/routes.js`:

```js
{ prefix: '/otro', target: process.env.OTRO_URL || 'http://localhost:3005' }
```

## Puesta en marcha

```bash
cd fusions3d-gateway
npm install
npm run dev
```

Orden de arranque: backend (`fusions3d-back`, puerto 3000) y después el gateway (puerto 4000). El frontend llama a `http://localhost:4000/api`.

## Notas

- Las cookies de sesión (`fusions3d_access`, `fusions3d_refresh`) se reenvían sin cambios porque el gateway no altera los paths.
- El gateway añade las cabeceras `X-Forwarded-For`, `X-Forwarded-Host` y `X-Forwarded-Proto`. Si hay un proxy delante, define `TRUST_PROXY`.
- CORS se gestiona en el gateway con `CORS_ORIGIN` y credenciales.
