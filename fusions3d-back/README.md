# Fusions3D API

> **← Volver al README principal:** [`README.md`](../README.md)

API REST backend para **Fusions3D**, una tienda de impresiones 3D.

## Stack

- Node.js 20+
- Express.js
- MongoDB + Mongoose
- Zod (validación)
- Helmet (seguridad)
- CORS
- Morgan (logging)
- dotenv
- slugify
- Nodemon (desarrollo)

## Arquitectura

Patrón **Repository + Service + Controller** (arquitectura en capas).

```text
fusions3d-back/
├── src/
│   ├── config/
│   │   └── database.js              # Conexión a MongoDB
│   ├── controllers/
│   │   └── print.controller.js      # Controlador de impresiones
│   ├── middlewares/
│   │   ├── error.middleware.js      # Manejo de errores centralizado
│   │   └── validation.middleware.js # Validación con Zod
│   ├── modules/
│   │   └── print/
│   │       └── print.model.js       # Modelo Mongoose (Print)
│   ├── repositories/
│   │   └── print.repository.js      # Acceso a datos (CRUD)
│   ├── routes/
│   │   └── print.routes.js          # Definición de rutas
│   ├── schemas/
│   │   └── print.schema.js          # Esquemas Zod (validación)
│   ├── services/
│   │   └── print.service.js         # Lógica de negocio
│   ├── utils/
│   │   ├── app.error.js             # Clase AppError personalizada
│   │   └── slug.util.js             # Generador de slugs único
│   └── app.js                       # Punto de entrada
├── .env.example
├── .gitignore
├── package.json
├── seed.js
└── README.md
```

## Modelo de datos

Colección MongoDB: `impresiones`.

| Campo | Tipo | Requerido | Descripción |
|---|---|---:|---|
| `nombre` | String | Sí | Nombre de la impresión |
| `descripcion` | String | Sí | Descripción |
| `precio_venta` | Number | Sí | Precio de venta |
| `precio_coste` | Number | Sí | Coste de fabricación |
| `tiempo_impresion` | Number | Sí | Tiempo de impresión en minutos |
| `slug` | String | Sí | Slug único generado desde el nombre |
| `activo` | Boolean | Sí | Si la impresión está activa |
| `imagen` | String | No | URL de imagen (preparado para el futuro) |
| `deletedAt` | Date | No | Fecha de borrado lógico (null si está activa) |

El **slug** se genera automáticamente con `slugify` a partir del nombre y se verifica que sea único en la base de datos.

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
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

Arrancar en desarrollo:

```bash
npm run dev
```

Arrancar en producción:

```bash
npm start
```

La API estará disponible en `http://localhost:3000`.

### Seed de datos (opcional)

```bash
node seed.js
```

## Endpoints

| Método | Endpoint | Acción |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/impresiones` | Listar impresiones |
| GET | `/api/impresiones/soft-deleted` | Listar eliminadas |
| GET | `/api/impresiones/active` | Listar activas |
| GET | `/api/impresiones/inactive` | Listar inactivas |
| GET | `/api/impresiones/slug/:slug` | Obtener por slug |
| POST | `/api/impresiones` | Crear impresión |
| GET | `/api/impresiones/:id` | Obtener por ID |
| PATCH | `/api/impresiones/:id` | Actualizar impresión |
| PATCH | `/api/impresiones/:id/active` | Activar/desactivar |
| PATCH | `/api/impresiones/:id/soft-delete` | Eliminar (borrado lógico) |
| PATCH | `/api/impresiones/:id/restore` | Restaurar |

## Crear una impresión

```http
POST /api/impresiones
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

El `slug` no se envía: la API lo genera automáticamente.

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
- **Soft delete:** las impresiones se marcan con `deletedAt` en lugar de eliminarse físicamente, permitiendo su restauración.
- **Slugs:** se generan automáticamente desde el nombre con `slugify`, con verificación de unicidad.
- **Validación:** todos los bodies y params se validan con esquemas Zod antes de llegar al controlador.
- **Seguridad:** Helmet habilita headers HTTP seguros por defecto.
