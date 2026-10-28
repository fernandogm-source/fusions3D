# Fusions3D API

API REST de Fusions3D, desarrollada con Node.js, Express y MongoDB.

## Stack

- Node.js 20+
- Express 4
- MongoDB + Mongoose 8
- Zod 4 para validar cuerpos y parámetros
- Helmet, CORS y Morgan
- `argon2` para hash de contraseñas
- `jsonwebtoken` para JWT y `express-rate-limit` para limitar intentos de login
- `slugify` para slugs

## Arquitectura

Cada recurso de negocio sigue el flujo **routes → controllers → services → repositories → models**. Los esquemas Zod se aplican en las rutas antes de invocar los controladores.

```text
src/
├── config/       # Conexión a MongoDB
├── controllers/  # Controladores HTTP por recurso
├── middlewares/  # Validación, autenticación, autorización y errores
├── models/       # Category, Image, Material, Print, PrintVariant, User, Profile, RevokedToken
├── repositories/ # Consultas Mongoose
├── routes/       # Rutas Express por recurso
├── schemas/      # Esquemas Zod por recurso
├── services/     # Reglas de negocio y restricciones de dependencias
├── utils/        # Password, JWT, errores, slugs, SKU y avisos de dependencias
└── app.js
```

La API actual sirve al panel de administración. Las rutas del panel pasan por los middlewares `_auth` y `_admin`, en ese orden. El login es público; `/api/auth/me`, logout y Profile requieren `_auth`. Profile es un dominio separado de Auth y permite al propietario gestionar sus propios datos; ADMIN puede seleccionar cualquier perfil mediante `?userId=<id>`, incluso si la cuenta está inactiva o eliminada lógicamente. Las rutas `/api/roles` están activas para ADMIN. La ruta `/api/users` sigue desactivada hasta que el panel adopte sus nuevos contratos; cuando se monte, el router exige `_auth` y `_admin` por sí mismo. Un ADMIN no puede cambiar su propio rol ni desactivarse o eliminarse (`SELF_MODIFICATION_FORBIDDEN`), y ninguna operación puede dejar el sistema sin ningún administrador activo (`LAST_ADMIN`). `Image` es un modelo asociado que se popula en impresiones y categorías.

## Instalación y ejecución

```bash
npm install
```

Copia `.env.example` a `.env`. Define una clave JWT aleatoria de al menos 32 bytes (por ejemplo, con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`). Para el frontend local, CORS debe permitir `http://localhost:4200`. Si la API está detrás de un proxy, define `TRUST_PROXY` (número de saltos o IP/subred) para que el límite de login use la IP real del cliente.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
TRUST_PROXY=
JWT_SECRET=<secreto aleatorio de al menos 32 bytes>
JWT_EXPIRES_IN=1h
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

Crea o actualiza el catálogo de ejemplo (materiales, categorías, impresiones, variantes e imágenes) y las cuentas de prueba, sin vaciar las colecciones existentes. Si una cuenta ya existe con el rol esperado, se conserva su contraseña; si existe con otro rol, el seed se detiene.

| Cuenta | Email | Contraseña | Rol |
|---|---|---|---|
| Administrador | `admin@fusions3d.local` | `Admin-Fusions3D-2026!` | ADMIN |
| Usuario 1 | `usuario1@fusions3d.local` | `Usuario1-Fusions3D-2026!` | USER |
| Usuario 2 | `usuario2@fusions3d.local` | `Usuario2-Fusions3D-2026!` | USER |

Cada cuenta tiene su Profile: el administrador sin direcciones, y cada usuario con teléfono y una dirección predeterminada. Estas credenciales son solo de prueba y están definidas en `seed.js`.

Para borrar primero los documentos de las colecciones de Fusions3D (`categories`, `materials`, `prints`, `print_variants`, `images`, `users`, `profiles` y `revoked_tokens`) y después recrear los datos de prueba, ejecuta:

```bash
npm run seed:reset
```

Este modo requiere `--confirm-reset`, que ya incluye el script. El borrado de documentos de las colecciones de Fusions3D es irreversible: ejecútalo solo en una base de pruebas.

El seed está bloqueado con `NODE_ENV=production`, tanto en modo normal como en `seed:reset`. Tampoco modifica la estructura de la base: no crea índices ni colecciones por su cuenta (`autoIndex` y `autoCreate` están desactivados), solo inserta, actualiza y borra documentos. Los índices de `profiles` y `revoked_tokens` los crea la aplicación al conectarse.

Las contraseñas se hashean con Argon2id y nunca se devuelven por la API.

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

Los errores de validación incluyen `error.details`. En desarrollo, el middleware añade el stack trace a errores internos 500.

Las operaciones que requieren una referencia disponible pueden responder `409 DEPENDENCY_UNAVAILABLE` si el documento relacionado no existe o está inactivo/eliminado. Los listados de impresiones y variantes incluyen `dependencyIssues` por registro cuando detectan referencias inválidas.

Desactivar o borrar lógicamente una categoría, impresión o material responde `409 DEPENDENTS_EXIST` si todavía tiene dependientes asociados. La comprobación incluye dependientes inactivos y eliminados lógicamente; hay que reasignar o quitar esas referencias antes de continuar. Si un dependiente está en la papelera, restáuralo para poder cambiar la referencia.

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
| POST | `/api/auth/login` | Inicio de sesión (público, limitado por IP y por email) |
| GET | `/api/auth/me` | Usuario autenticado actual |
| POST | `/api/auth/logout` | Revocar el token actual |
| GET | `/api/profiles/getprofile` | Consultar el propio perfil |
| PATCH | `/api/profiles/updateprofile` | Actualizar el propio perfil |
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

`{resource}` puede ser `prints`, `categories`, `materials`, `print-variants` o `roles`. Todas estas rutas, incluidas las lecturas, requieren `Authorization: Bearer <token>` de un ADMIN. La ruta `/api/users` no está montada todavía (pendiente).

Las rutas de Profile requieren un token válido y comprueban propiedad. ADMIN puede especificar `?userId=<id>` para consultar o actualizar el perfil de otro usuario, incluso si su cuenta está inactiva o eliminada lógicamente. El `userId` no se acepta en el cuerpo de actualización. `avatarUrl` acepta una URL HTTP/HTTPS o `null` para quitar el avatar; la imagen se aloja fuera de la API.

### Rutas adicionales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/prints/slug/:slug` | Consultar impresión por slug |
| GET | `/api/categories/slug/:slug` | Consultar categoría por slug |
| GET | `/api/print-variants/sku/:sku` | Consultar variante por SKU |
| GET | `/api/print-variants/print/:printId` | Listar variantes de una impresión |

### Modelos principales

| Recurso | Campos principales |
|---|---|
| Print | `name`, `description`, `categoryId`, `slug`, `status`, `isActive`, `deletedAt` |
| Category | `name`, `slug`, `status`, `isActive`, `deletedAt` |
| Material | `name`, `isActive`, `deletedAt` |
| PrintVariant | `printId`, `sku` (generado), `materialId`, `color`, `salePrice`, `costPrice`, `printTime`, `isActive`, `deletedAt`, `createdAt`, `updatedAt` |
| Role | `name` (único), `isActive`, `deletedAt` |
| User | `email`, `passwordHash` (Argon2id), `role` (ObjectId de `Role`), `isActive`, `deletedAt` |
| Profile | `userId` (único), `name`, `phone`, `addresses`, `avatarUrl` |

Las imágenes se asocian mediante `entityType` y `entityId`, y se devuelven pobladas en impresiones y categorías. Al crear o actualizar una impresión se puede enviar `images` como una lista de URLs HTTP/HTTPS. En un `PATCH`, la lista reemplaza las imágenes actuales: una lista vacía las elimina todas de esa impresión. Los archivos siguen alojados externamente. Las variantes no tienen imágenes.

## Notas importantes

- Los slugs de impresiones y categorías se generan desde el nombre.
- Las variantes no tienen nombre personalizado: se identifican por su `sku` y por sus referencias de impresión/material y color. El `sku` se genera automáticamente a partir del print, el material y el color. No se puede enviar ni modificar manualmente; al cambiar alguno de esos datos, el backend lo regenera.
- Las impresiones requieren una categoría activa; las variantes, una impresión y un material activos. Las altas, los cambios de referencia y las reactivaciones fallan con `409 DEPENDENCY_UNAVAILABLE` si falta alguna dependencia.
- Los listados de impresiones y variantes incluyen `dependencyIssues` cuando una referencia está ausente, eliminada o inactiva. Es un dato calculado para la respuesta, no un campo persistido en MongoDB.
- Los `ref` de Mongoose guardan referencias `ObjectId`, pero MongoDB no impone claves foráneas. Las comprobaciones se realizan en los servicios de la API; `dependencyIssues` permite identificar relaciones inválidas ya existentes.
- El borrado es lógico (`deletedAt`) y no elimina documentos físicamente.
- Las contraseñas se hashean con Argon2id mediante `src/utils/password.util.js`; la lógica JWT está centralizada en `src/utils/jwt.util.js`.
- El JWT contiene el identificador del usuario y el id de su rol (`roleId`). Cada petición comprueba que la cuenta siga activa y que el rol del token coincida con el rol actual del usuario en MongoDB. Si cambia el rol del usuario, el token anterior deja de ser válido.
- Los roles son documentos de la colección `roles`. Solo el rol con nombre `ADMIN` da acceso al panel de administración; cualquier otro rol (como `USER` o uno creado desde `/api/roles`) no tiene acceso. El rol `ADMIN` no se puede renombrar, desactivar ni eliminar. Solo se pueden asignar roles activos, y no se puede desactivar o borrar un rol que tenga usuarios asignados. Las credenciales de prueba del seed están en `seed.js` y solo deben usarse en desarrollo.
- El logout revoca el `jti` del token en MongoDB; desde ese momento, las siguientes peticiones con ese token reciben `401`. El índice TTL se crea al iniciar la conexión y elimina automáticamente los registros revocados al expirar el JWT.
- Los datos personales, direcciones y avatar pertenecen a `Profile`, relacionado 1:1 con `User` mediante un `userId` único. `_auth` autentica; el servicio de Profile aplica propietario o ADMIN.
- Al crear un usuario se crea también su Profile, con el nombre derivado de la parte local del email.
- El login tiene dos límites: 10 intentos por IP y 5 por email cada 15 minutos. Ambos responden `429 LOGIN_RATE_LIMITED`.
- No hay registro público. La creación de cuentas del panel se incorporará como operación administrativa en un paso posterior.
- `POSTMAN.md` contiene ejemplos de las rutas actuales. No se distribuye una colección JSON importable de Postman.

> [← Volver al README principal](../README.md)
