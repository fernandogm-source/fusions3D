# Fusions3D API

API REST backend para **Fusions3D**, una tienda de impresiones 3D.

## Stack

- Node.js 20+
- Express.js
- MongoDB + Mongoose
- CORS
- dotenv
- Nodemon

## Arquitectura

```text
fusions3d-api/
├── src/
│   ├── controllers/
│   │   └── print.controller.js
│   ├── modules/
│   │   ├── database.js
│   │   └── print/
│   │       └── print.model.js
│   ├── repositories/
│   │   └── print.repository.js
│   ├── routes/
│   │   └── print.routes.js
│   ├── services/
│   │   └── print.service.js
│   ├── utils/
│   │   ├── app.error.js
│   │   └── error.handler.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── POSTMAN.md
└── README.md
```

## Modelo de datos

Colección MongoDB: `impresiones`.

| Campo | Tipo | Requerido | Descripción |
|---|---|---:|---|
| `uuid` | String | Sí | UUID estándar, generado automáticamente |
| `nombre` | String | Sí | Nombre de la impresión |
| `descripcion` | String | Sí | Descripción |
| `precio_venta` | Number | Sí | Precio de venta |
| `precio_coste` | Number | Sí | Coste de fabricación |
| `tiempo_impresion` | Number | Sí | Tiempo de impresión en minutos |

El UUID se genera con `crypto.randomUUID()`, se valida contra el formato UUID y es único e inmutable.

## Instalación

Requisitos: Node.js 20+ y MongoDB local o MongoDB Atlas.

```bash
npm install
```

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Arrancar en desarrollo:

```bash
npm run dev
```

Arrancar:

```bash
npm start
```

La API estará disponible en `http://localhost:3000`.

## Endpoints

| Método | Endpoint | Acción |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/v1/impresiones` | Listar impresiones |
| GET | `/api/v1/impresiones/:uuid` | Obtener una impresión |
| POST | `/api/v1/impresiones` | Crear impresión |
| PUT | `/api/v1/impresiones/:uuid` | Actualizar impresión |
| DELETE | `/api/v1/impresiones/:uuid` | Eliminar impresión |

## Crear una impresión

```http
POST /api/v1/impresiones
Content-Type: application/json
```

```json
{
  "nombre": "Soporte para auriculares",
  "descripcion": "Soporte de sobremesa para auriculares.",
  "precio_venta": 19.99,
  "precio_coste": 7.50,
  "tiempo_impresion": 240
}
```

El `uuid` no se envía: la API lo genera automáticamente.

## Respuestas

Éxito:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PRINT_NOT_FOUND",
    "message": "Impresión no encontrada"
  }
}
```

En desarrollo se añade el stack trace.

## CORS

CORS está habilitado mediante `cors`. El origen se controla mediante `CORS_ORIGIN`.

Para desarrollo puede utilizarse:

```env
CORS_ORIGIN=*
```

En producción es preferible definir el origen concreto del frontend.

## Decisiones

- No se han creado otras entidades de negocio: solo `impresiones`.
- No se ha añadido autenticación porque no forma parte del alcance solicitado.
- `tiempo_impresion` está expresado en minutos.
- Para sistemas contables estrictos, los precios pueden migrarse posteriormente a céntimos enteros o `Decimal128`.
