# Fusions3D API

API REST de Fusions3D, desarrollada con Node.js, Express y MongoDB.

## Stack

- Node.js 20+
- Express 4
- MongoDB + Mongoose 8
- Zod 4 para validar cuerpos y parámetros
- Helmet, CORS y Morgan
- `bcryptjs` para hash de contraseñas
- `slugify` para slugs

## Arquitectura

Cada recurso de negocio sigue el flujo **routes → controllers → services → repositories → models**. Los esquemas Zod se aplican en las rutas antes de invocar los controladores.

```text
src/
├── config/       # Conexión a MongoDB
├── controllers/  # Controladores HTTP por recurso
├── middlewares/  # Validación Zod y errores
├── models/       # Category, Image, Material, Print, PrintVariant, Role, User
├── repositories/ # Consultas Mongoose
├── routes/       # Rutas Express por recurso
├── schemas/      # Esquemas Zod por recurso
├── services/     # Reglas de negocio y cascadas de dependencias
├── utils/        # Errores, slugs, SKU y avisos de dependencias
└── app.js
```

La aplicación registra seis recursos: `prints`, `categories`, `materials`, `print-variants`, `roles` y `users`. `Image` es actualmente un modelo asociado que se popula en algunos recursos; **no tiene rutas ni operaciones CRUD propias**.

## Instalación y ejecución

```bash
npm install
```

Copia `.env.example` a `.env` y comprueba especialmente el origen CORS: para el frontend local debe ser `http://localhost:4200`.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

```bash
npm run dev  # desarrollo con Nodemon
npm start    # ejecución normal
```

La API se sirve en `http://localhost:3000`.

## Seed de desarrollo

```bash
npm run seed
```

El seed inserta o actualiza datos de ejemplo para materiales, categorías, roles, impresiones, variantes, usuarios e imágenes. Cada print lleva una URL de foto pública de Pexels; las categorías usan placeholders. Solo se generan imágenes para impresiones y categorías; las variantes no tienen imágenes. Usa upserts y no vacía las colecciones, por lo que puede repetirse.

En la primera ejecución crea `admin@fusions3d.local`. La contraseña inicial por defecto es `Admin123!`; para cambiarla, define `SEED_ADMIN_PASSWORD` en `.env` antes de sembrar. Las contraseñas de los usuarios de ejemplo también son exclusivamente para desarrollo. Los hashes se guardan con bcrypt.

## Respuestas

Éxito:

```json
{ "success": true, "data": {} }
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

Los errores de validación incluyen `error.details`. En desarrollo, el middleware añade el stack trace.

Las operaciones que requieren una referencia disponible pueden responder `409 DEPENDENCY_UNAVAILABLE` si el documento relacionado no existe o está inactivo/eliminado. Los listados de impresiones, variantes y usuarios incluyen `dependencyIssues` por registro cuando detectan referencias inválidas.

Ejemplo del campo calculado en una impresión:

```json
{
  "dependencyIssues": [
    {
      "field": "categoryId",
      "message": "La categoría asignada está desactivada",
      "referenceId": "<CATEGORY_ID>"
    }
  ]
}
```

## Endpoints

Base URL: `http://localhost:3000`. Todos los recursos de negocio usan el prefijo `/api`.

### Comunes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/{resource}` | Listar registros no eliminados |
| GET | `/api/{resource}/active` | Listar activos |
| GET | `/api/{resource}/inactive` | Listar inactivos |
| GET | `/api/{resource}/soft-deleted` | Listar eliminados lógicamente |
| POST | `/api/{resource}` | Crear |
| GET | `/api/{resource}/:id` | Consultar por ObjectId |
| PATCH | `/api/{resource}/:id` | Actualizar campos |
| PATCH | `/api/{resource}/:id/active` | Alternar activo/inactivo |
| PATCH | `/api/{resource}/:id/soft-delete` | Borrado lógico |
| PATCH | `/api/{resource}/:id/restore` | Restaurar |

`{resource}` puede ser `prints`, `categories`, `materials`, `print-variants`, `roles` o `users`. El endpoint `/:id/active` alterna el estado y no requiere body. Al desactivar un padre, sus dependientes también quedan inactivos:

- Categoría → impresiones → variantes.
- Impresión → variantes.
- Material → variantes.
- Rol → usuarios asignados.

El borrado lógico aplica la misma cascada. Los dependientes conservan sus documentos y referencias; no se eliminan ni se marcan como borrados. Reactivar o restaurar al padre no reactiva automáticamente a los hijos. Las imágenes de impresiones y categorías se conservan y siguen poblándose, incluso si el padre está inactivo o en la papelera.

### Rutas adicionales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/prints/slug/:slug` | Consultar impresión por slug |
| GET | `/api/categories/slug/:slug` | Consultar categoría por slug |
| GET | `/api/print-variants/sku/:sku` | Consultar variante por SKU |
| GET | `/api/print-variants/print/:printId` | Listar variantes de una impresión |
| PATCH | `/api/users/:id/roles` | Reemplazar los roles de un usuario |

### Modelos principales

| Recurso | Campos principales |
|---|---|
| Print | `name`, `description`, `categoryId`, `slug`, `status`, `isActive`, `deletedAt` |
| Category | `name`, `slug`, `status`, `isActive`, `deletedAt` |
| Material | `name`, `isActive`, `deletedAt` |
| PrintVariant | `printId`, `sku` (generado), `materialId`, `color`, `salePrice`, `costPrice`, `printTime`, `isActive`, `deletedAt`, `createdAt`, `updatedAt` |
| Role | `name`, `isActive`, `deletedAt` |
| User | `name`, `email`, `password` (hash), `roles`, `addresses`, `phone`, `isActive`, `deletedAt` |

Las imágenes se asocian mediante `entityType` y `entityId`, y se devuelven pobladas en impresiones y categorías. Las variantes no tienen imágenes. No hay rutas para modificarlas todavía.

## Notas importantes

- Los slugs de impresiones y categorías se generan desde el nombre.
- Las variantes no tienen nombre personalizado: se identifican por su `sku` y por sus referencias de impresión/material y color. El `sku` se genera automáticamente a partir del print, el material y el color. No se puede enviar ni modificar manualmente; al cambiar alguno de esos datos, el backend lo regenera.
- Las impresiones requieren una categoría activa; las variantes, una impresión y un material activos; y los roles asignados a usuarios también deben estar activos. Las altas, los cambios de referencia y las reactivaciones fallan con `409 DEPENDENCY_UNAVAILABLE` si falta alguna dependencia.
- Los listados de impresiones, variantes y usuarios incluyen `dependencyIssues` cuando una referencia está ausente, eliminada o inactiva. Es un dato calculado para la respuesta, no un campo persistido en MongoDB.
- Los `ref` de Mongoose guardan referencias `ObjectId`, pero MongoDB no impone claves foráneas. Las comprobaciones se realizan en los servicios de la API; `dependencyIssues` permite identificar relaciones inválidas ya existentes.
- El borrado es lógico (`deletedAt`) y no elimina documentos físicamente.
- Las contraseñas de usuario se hashean con bcrypt y no se incluyen en las consultas de lectura.
- **No hay autenticación ni autorización**: todas las rutas, incluidas las de usuarios y roles, están expuestas. No desplegar públicamente hasta añadir controles de acceso.
- `POSTMAN.md` contiene ejemplos de las rutas actuales. No se distribuye una colección JSON importable de Postman.
- El backend no tiene tests configurados.

### Migración local de variantes

El campo `name` se elimina de los documentos existentes de `print_variants` con una migración acotada a MongoDB local (`localhost`, base `fusions3d`). Primero ejecuta una simulación; para aplicar el `$unset` de `name`, usa `--apply`:

```bash
npm run migrate:remove-variant-name
npm run migrate:remove-variant-name -- --apply
```

La migración no modifica otras colecciones ni elimina documentos.

> [← Volver al README principal](../README.md)
