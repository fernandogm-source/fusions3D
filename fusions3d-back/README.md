# Fusions3D API

API REST de Fusions3D, desarrollada con Node.js, Express y MongoDB.

## Stack

- Node.js 20+
- Express 4
- MongoDB + Mongoose 8
- Zod 4 para validar cuerpos y parámetros
- Helmet, CORS y Morgan
- `argon2` para hash de contraseñas
- `jsonwebtoken` para JWT (access y refresh tokens) y `express-rate-limit` para limitar intentos de login, registro y renovación de sesión
- `slugify` para slugs
- Cliente HTTP nativo (`fetch`) hacia el microservicio de IA (`fusions3d-ai`) para el chat, el sentimiento y los resúmenes de comentarios

## Arquitectura

Cada recurso de negocio sigue el flujo **routes → controllers → services → repositories → models**. Los esquemas Zod se aplican en las rutas antes de invocar los controladores.

```text
src/
├── config/       # Conexión a MongoDB
├── controllers/  # Controladores HTTP por recurso
├── middlewares/  # Validación, autenticación, autorización y errores
├── models/       # Category, Image, Material, Print, PrintVariant, VariantLike, VariantReview, PrintSentiment, PrintReviewSummary, User, Profile, RevokedToken, RefreshToken
├── repositories/ # Consultas Mongoose
├── routes/       # Rutas Express por recurso
├── schemas/      # Esquemas Zod por recurso
├── services/     # Reglas de negocio y restricciones de dependencias
├── utils/        # Password, JWT, errores, slugs, SKU y avisos de dependencias
└── app.js
```

La API sirve a la tienda pública y al panel de administración. Las rutas de la tienda (`/api/shop/*`) son públicas. Las rutas del panel pasan por los middlewares `_auth` y `_admin`, en ese orden. Register, login, refresh y logout son públicos; `/api/auth/me` y Profile requieren `_auth`. Profile es un dominio separado de Auth y permite al propietario gestionar sus propios datos; ADMIN puede seleccionar cualquier perfil mediante `?userId=<id>`, incluso si la cuenta está inactiva o eliminada lógicamente. Las rutas `/api/roles` están activas para ADMIN. La ruta `/api/users` está activa para ADMIN y el router exige `_auth` y `_admin` por sí mismo. El email y el nombre de usuario (`username`) deben ser únicos, incluso frente a usuarios eliminados lógicamente (`EMAIL_ALREADY_EXISTS` y `USERNAME_ALREADY_EXISTS`, 409). El `username` tiene entre 3 y 30 caracteres (`a-z`, `0-9`, `.`, `_` y `-`), se guarda en minúsculas y lo puede cambiar un ADMIN desde `/api/users` o el propio usuario desde `/api/profiles/updateprofile`. El login sigue usando solo el email. Un ADMIN no puede cambiar su propio rol ni desactivarse o eliminarse (`SELF_MODIFICATION_FORBIDDEN`), y ninguna operación puede dejar el sistema sin ningún administrador activo (`LAST_ADMIN`). `Image` es un modelo asociado que se popula en impresiones y categorías.

## Instalación y ejecución

```bash
npm install
```

Copia `.env.example` a `.env`. Define dos claves JWT aleatorias de al menos 32 bytes, distintas entre sí (por ejemplo, con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`). Para el frontend local, CORS debe permitir `http://localhost:4200`. Si la API está detrás de un proxy, define `TRUST_PROXY` (número de saltos o IP/subred) para que los límites de peticiones usen la IP real del cliente.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
TRUST_PROXY=
JWT_SECRET=<secreto aleatorio de al menos 32 bytes>
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<otro secreto aleatorio, distinto de JWT_SECRET>
JWT_REFRESH_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:3001/ai/v1
AI_SERVICE_KEY=<misma clave que AI_SERVICE_KEY en fusions3d-ai>
AI_REQUEST_TIMEOUT_MS=45000
```

`AI_SERVICE_URL` y `AI_SERVICE_KEY` son necesarias para el chat de la tienda, el análisis de sentimiento y los resúmenes de comentarios. Si no están configuradas, esas rutas responden `503 AI_NOT_CONFIGURED`; el resto de la API funciona igual.

Al arrancar, la API comprueba que ambos secretos existan, tengan al menos 32 bytes y sean distintos.

```bash
npm run dev  # desarrollo con Nodemon
npm start    # ejecución normal
```

La API se sirve en `http://localhost:3000`.

## Seed de desarrollo

```bash
npm run seed
```

Crea o actualiza el catálogo de ejemplo (materiales, categorías, impresiones, variantes e imágenes), los comentarios de ejemplo de las variantes y las cuentas de prueba, sin vaciar las colecciones existentes. Los comentarios se generan con una valoración repartida entre 2 y 5 estrellas y actualizan `ratingAverage` y `ratingCount` de cada variante. Si una cuenta ya existe con el rol esperado, se conserva su contraseña; si existe con otro rol, el seed se detiene.

| Cuenta | Email | Contraseña | Rol |
|---|---|---|---|
| Administrador | `admin@fusions3d.local` | `Admin-Fusions3D-2026!` | ADMIN |
| Usuario 1 | `usuario1@fusions3d.local` | `Usuario1-Fusions3D-2026!` | USER |
| Usuario 2 | `usuario2@fusions3d.local` | `Usuario2-Fusions3D-2026!` | USER |

Cada cuenta tiene su Profile: el administrador sin direcciones, y cada usuario con teléfono y una dirección predeterminada. Estas credenciales son solo de prueba y están definidas en `seed.js`.

Para borrar primero los documentos de las colecciones de Fusions3D (`categories`, `materials`, `prints`, `print_variants`, `images`, `users`, `profiles`, `revoked_tokens`, `refresh_tokens`, `variant_reviews`, `print_sentiments` y `print_review_summaries`) y después recrear los datos de prueba, ejecuta:

```bash
npm run seed:reset
```

Este modo requiere `--confirm-reset`, que ya incluye el script. El borrado de documentos de las colecciones de Fusions3D es irreversible: ejecútalo solo en una base de pruebas.

El seed está bloqueado con `NODE_ENV=production`, tanto en modo normal como en `seed:reset`. Tampoco modifica la estructura de la base: no crea índices ni colecciones por su cuenta (`autoIndex` y `autoCreate` están desactivados), solo inserta, actualiza y borra documentos. Los índices de `profiles`, `revoked_tokens` y `refresh_tokens` los crea la aplicación al conectarse.

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
| POST | `/api/auth/register` | Crear cuenta de cliente (público, limitado por IP) |
| POST | `/api/auth/login` | Inicio de sesión (público, limitado por IP y por email) |
| POST | `/api/auth/refresh` | Renovar el access token con el refresh token (público, limitado por IP) |
| GET | `/api/auth/me` | Usuario autenticado actual |
| POST | `/api/auth/logout` | Cerrar la sesión actual (público; revoca los tokens que haya en las cookies) |
| GET | `/api/profiles/getprofile` | Consultar el propio perfil |
| PATCH | `/api/profiles/updateprofile` | Actualizar el propio perfil (incluye `username`) |
| GET | `/api/profiles/likes` | Variantes marcadas por el usuario con me gusta (paginado) |
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

`{resource}` puede ser `prints`, `categories`, `materials`, `print-variants` o `roles`. Todas estas rutas, incluidas las lecturas, requieren una sesión de ADMIN: la cookie `fusions3d_access` que emite el login, o `Authorization: Bearer <access token>` para clientes sin cookies. La ruta `/api/users` también está montada y requiere ADMIN.

Las rutas de Profile requieren un token válido y comprueban propiedad. ADMIN puede especificar `?userId=<id>` para consultar o actualizar el perfil de otro usuario, incluso si su cuenta está inactiva o eliminada lógicamente. El `userId` no se acepta en el cuerpo de actualización. `avatarUrl` acepta una URL HTTP/HTTPS o `null` para quitar el avatar; la imagen se aloja fuera de la API.

### Tienda pública

Estas rutas no requieren sesión.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/shop/home` | Datos de la página de inicio de la tienda |
| GET | `/api/shop/filters` | Opciones de filtrado del catálogo |
| GET | `/api/shop/prints` | Listado público de impresiones (acepta parámetros de búsqueda y filtrado) |
| GET | `/api/shop/prints/:slug` | Detalle público de una impresión por slug |
| POST | `/api/shop/chat` | Mensaje al asistente de la tienda (límite de 20 mensajes por hora y IP) |
| GET | `/api/shop/prints/:slug/reviews/summary` | Reparto de comentarios por estrellas: `{ total, distribution: [{ stars, count, percentage }] }` |
| GET | `/api/shop/prints/:slug/reviews/ai-summary` | Resumen en lenguaje natural de los comentarios generado con IA (`summary` es `null` si no hay comentarios) |

### Likes de variantes

Las rutas de likes están bajo la tienda pública, pero requieren sesión de cualquier usuario activo (`_auth`). Se identifican por el `slug` de la variante, que solo es válido si la variante es visible en la tienda (activa, de una impresión publicada con categoría publicada y material activo); en otro caso responde `404 VARIANT_NOT_FOUND`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/shop/variants/:variantSlug/likes/me` | Indica si el usuario actual ha dado like: `{ liked }` |
| POST | `/api/shop/variants/:variantSlug/likes` | Da like. Es idempotente: si ya existía, no cambia nada |
| DELETE | `/api/shop/variants/:variantSlug/likes` | Quita el like. Es idempotente: si no existía, no cambia nada |
| GET | `/api/profiles/likes?page=1&limit=12` | Lista paginada de las variantes con like del usuario, más recientes primero. `limit` máximo 48 |

POST y DELETE responden con el resumen `{ liked, likesCount }`. La lista `/api/profiles/likes` devuelve `{ items, meta }`; cada elemento incluye el slug, SKU, color, precio, material, nombre y slug de la impresión, la portada y `likedAt`. Solo aparecen las variantes que siguen visibles. Un usuario solo ve sus propios likes.

### Comentarios y valoraciones

Los comentarios se escriben sobre una variante concreta de una impresión publicada. Las lecturas son públicas; escribir, editar y borrar requieren sesión.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/shop/prints/:slug/reviews?stars=4,5` | Comentarios de una impresión. `stars` filtra por valoraciones concretas (lista de 1 a 5); máximo 50 resultados, más recientes primero |
| GET | `/api/shop/prints/:slug/reviews/me` | Comentarios del usuario actual en las variantes de esa impresión (`_auth`) |
| POST | `/api/shop/prints/:slug/reviews` | Crea un comentario con `{ variantSlug, rating, comment }` (`_auth`). Un usuario solo puede tener uno por variante (`409 REVIEW_ALREADY_EXISTS`) |
| PATCH | `/api/shop/reviews/:id` | Edita `rating` y/o `comment`. Solo el autor (`_auth`) |
| DELETE | `/api/shop/reviews/:id` | Borra el comentario. Lo puede hacer el autor o un ADMIN (`_auth`) |

Reglas de validación: `rating` es un entero de 1 a 5; `comment` tiene entre 1 y 1000 caracteres tras recortar espacios. Al editar hay que enviar al menos uno de los dos campos.

Cada alta, edición o borrado recalcula `ratingAverage` y `ratingCount` de la variante. Las respuestas de creación, edición y borrado devuelven la variante con sus nuevas estadísticas, `{ slug, ratingAverage, ratingCount }`. Las listas incluyen los comentarios de todas las variantes de la impresión, también de las inactivas.

Respuesta de `POST` (`201`):

```json
{
  "success": true,
  "data": {
    "review": { "_id": "<REVIEW_ID>", "rating": 5, "comment": "Muy buena calidad", "username": "usuario1", "variantSlug": "soporte-para-movil-negro-pla", "...": "..." },
    "variant": { "slug": "soporte-para-movil-negro-pla", "ratingAverage": 4.5, "ratingCount": 2 }
  }
}
```

### Comentarios en el panel (ADMIN)

Montadas en `/api/reviews`, detrás de `_auth` y `_admin`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/reviews/prints` | Impresiones con comentarios: `{ _id, name, slug, reviewCount, ratingAverage }` |
| GET | `/api/reviews?page=1&limit=20&stars=1,2&printId=<PRINT_ID>` | Listado paginado de comentarios de todas las impresiones, con `printName`. `limit` máximo 50 |
| GET | `/api/reviews/prints/:printId/sentiment` | Análisis de sentimiento de la impresión con IA (ver más abajo) |
| DELETE | `/api/reviews/:id` | Borra cualquier comentario y recalcula las estadísticas de la variante |

### Análisis con IA

Las rutas de IA llaman al microservicio `fusions3d-ai` mediante `AiService`. Son dos:

- `GET /api/shop/prints/:slug/reviews/ai-summary`: resumen de una o dos frases de la opinión general, visible en la tienda.
- `GET /api/reviews/prints/:printId/sentiment`: porcentajes de positivos, neutros y negativos más un resumen, solo para ADMIN.

Para ahorrar llamadas, el resultado se guarda en `print_review_summaries` o `print_sentiments` (una fila por impresión). La firma de caché es `número de comentarios:última actualización`: si no ha cambiado ningún comentario, se devuelve lo guardado. Ambas analizan como máximo los 60 comentarios más recientes. Si la IA no responde o devuelve un error, la API responde `503` (`AI_UNAVAILABLE` si no hay conexión o el código de error del microservicio en otro caso) y no guarda nada en caché.

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
| PrintVariant | `printId`, `sku` (generado), `materialId`, `color`, `salePrice`, `costPrice`, `printTime`, `likesCount`, `ratingAverage`, `ratingCount`, `isActive`, `deletedAt`, `createdAt`, `updatedAt` |
| VariantLike | `variantId`, `userId`, `createdAt` (colección `variant_likes`, único por `variantId` + `userId`) |
| VariantReview | `variantId`, `userId`, `rating` (1-5), `comment` (1-1000), `createdAt`, `updatedAt` (colección `variant_reviews`, único por `variantId` + `userId`) |
| PrintSentiment | `printId` (único), `signature`, `positive`, `neutral`, `negative`, `summary`, `sampleSize` (colección `print_sentiments`, caché del análisis) |
| PrintReviewSummary | `printId` (único), `signature`, `summary`, `sampleSize` (colección `print_review_summaries`, caché del resumen) |
| Role | `name` (único), `isActive`, `deletedAt` |
| User | `email`, `username` (único), `passwordHash` (Argon2id), `role` (ObjectId de `Role`), `isActive`, `deletedAt` |
| Profile | `userId` (único), `name`, `phone`, `addresses`, `avatarUrl` |
| RevokedToken | `tokenId` (jti del access token revocado), `expiresAt` (TTL) |
| RefreshToken | `tokenId` (jti), `userId`, `expiresAt` (TTL), `revokedAt` |

Las imágenes se asocian mediante `entityType` y `entityId`, y se devuelven pobladas en impresiones y categorías. Al crear o actualizar una impresión se puede enviar `images` como una lista de URLs HTTP/HTTPS. En un `PATCH`, la lista reemplaza las imágenes actuales: una lista vacía las elimina todas de esa impresión. Los archivos siguen alojados externamente. Las variantes no tienen imágenes.

## Notas importantes

- Los slugs de impresiones y categorías se generan desde el nombre.
- Las variantes no tienen nombre personalizado: se identifican por su `sku` y por sus referencias de impresión/material y color. El `sku` se genera automáticamente a partir del print, el material y el color. No se puede enviar ni modificar manualmente; al cambiar alguno de esos datos, el backend lo regenera.
- Las impresiones requieren una categoría activa; las variantes, una impresión y un material activos. Las altas, los cambios de referencia y las reactivaciones fallan con `409 DEPENDENCY_UNAVAILABLE` si falta alguna dependencia.
- Los listados de impresiones y variantes incluyen `dependencyIssues` cuando una referencia está ausente, eliminada o inactiva. Es un dato calculado para la respuesta, no un campo persistido en MongoDB.
- Los `ref` de Mongoose guardan referencias `ObjectId`, pero MongoDB no impone claves foráneas. Las comprobaciones se realizan en los servicios de la API; `dependencyIssues` permite identificar relaciones inválidas ya existentes.
- Los likes se guardan en `variant_likes`, con un índice único por variante y usuario, así que un usuario no puede duplicar un like aunque haga peticiones simultáneas. `PrintVariant.likesCount` es un contador desnormalizado que se incrementa o decrementa al dar o quitar el like; no se puede enviar desde el cuerpo de las peticiones de variantes.
- En el listado público de impresiones, `totalLikes` es la suma de `likesCount` de sus variantes visibles.
- Las valoraciones se guardan en `variant_reviews`, con un índice único por variante y usuario: un usuario tiene una sola valoración por variante. `PrintVariant.ratingAverage` y `ratingCount` son contadores desnormalizados que se recalculan en cada alta, edición o borrado; no se pueden enviar desde las peticiones de variantes. El detalle público de una impresión (`/api/shop/prints/:slug`) incluye `ratingAverage` y `ratingCount` en cada variante.
- Desactivar una variante no borra sus comentarios; siguen contando en su media y en los listados de ADMIN. Solo los borra el propio autor o un ADMIN.
- El borrado es lógico (`deletedAt`) y no elimina documentos físicamente.
- Las contraseñas se hashean con Argon2id mediante `src/utils/password.util.js`; la lógica JWT está centralizada en `src/utils/jwt.util.js`.
- La sesión usa dos tokens JWT, ambos en cookies `HttpOnly` (`SameSite=Lax`, `Secure` en producción) y ninguno aparece en el cuerpo de la respuesta:
  - `fusions3d_access`: access token de 1 hora (`JWT_EXPIRES_IN`), ruta `/api`.
  - `fusions3d_refresh`: refresh token de 7 días (`JWT_REFRESH_EXPIRES_IN`), ruta `/api/auth`, para que el navegador solo lo envíe a `/refresh` y `/logout`.
- Cualquier usuario con cuenta y rol activos puede iniciar sesión; las rutas de administración siguen reservadas a `ADMIN`, y el resto de usuarios solo accede a su Profile.
- `POST /api/auth/refresh` valida el refresh token y comprueba que siga registrado y activo en `refresh_tokens`. Emite un par nuevo y revoca el refresh anterior (rotación). Si el refresh no es válido, está revocado o ha caducado, borra las cookies y responde `401 SESSION_EXPIRED`.
- Los errores 401 de autenticación tienen código distinto para que el frontend sepa qué hacer:
  - `ACCESS_TOKEN_EXPIRED`: el access token ha caducado, o no llega pero sí hay refresh token. El cliente debe llamar a `/api/auth/refresh` y reintentar.
  - `SESSION_EXPIRED`: la sesión ha terminado. El cliente debe cerrar sesión y pedir un nuevo inicio.
  - `AUTHENTICATION_REQUIRED`: no hay sesión (visitante).
- `POST /api/auth/logout` revoca el access token (en `revoked_tokens`) y el refresh token (en `refresh_tokens`) que haya en las cookies, y borra ambas cookies. No requiere un access token válido, así que funciona aunque la sesión ya haya caducado.
- El registro (`POST /api/auth/register`) crea una cuenta con rol `USER` y su Profile. No inicia sesión: el cliente debe iniciarla después. El rol nunca se acepta desde el cuerpo de la petición.
- El JWT contiene el identificador del usuario y el id de su rol (`roleId`). Cada petición comprueba que la cuenta siga activa y que el rol del token coincida con el rol actual del usuario en MongoDB. Si cambia el rol del usuario, el token anterior deja de ser válido.
- Los roles son documentos de la colección `roles`. Solo el rol con nombre `ADMIN` da acceso al panel de administración; cualquier otro rol (como `USER` o uno creado desde `/api/roles`) no tiene acceso. El rol `ADMIN` no se puede renombrar, desactivar ni eliminar. Solo se pueden asignar roles activos, y no se puede desactivar o borrar un rol que tenga usuarios asignados. Las credenciales de prueba del seed están en `seed.js` y solo deben usarse en desarrollo.
- El logout revoca el `jti` del access token en MongoDB; desde ese momento, las siguientes peticiones con ese token reciben `401`. Los refresh tokens revocados o caducados se eliminan automáticamente con un índice TTL. Los índices se crean al iniciar la conexión.
- Cerrar sesión en todos los dispositivos todavía no está implementado: el logout solo cierra la sesión actual.
- Los datos personales, direcciones y avatar pertenecen a `Profile`, relacionado 1:1 con `User` mediante un `userId` único. `_auth` autentica; el servicio de Profile aplica propietario o ADMIN.
- Al crear un usuario se crea también su Profile, con el nombre derivado de la parte local del email.
- Migración de usernames para bases existentes: `node scripts/migrate-usernames.js` solo muestra el plan (solo funciona contra `localhost` y la base `fusions3d`). Con `--apply` asigna a cada usuario sin `username` uno derivado de la parte local del email (con sufijo numérico si hay colisión) y crea el índice único. Ejecútala antes de arrancar la nueva versión de la API.
- El login tiene dos límites: 10 intentos por IP y 5 por email cada 15 minutos. Ambos responden `429 LOGIN_RATE_LIMITED`.
- Registro y renovación de sesión tienen un límite de 10 peticiones por IP cada 15 minutos, responden `429 RATE_LIMITED`. Usuarios detrás de la misma IP comparten ese límite.
- El registro público crea cuentas de cliente. La creación de cuentas desde el panel de administración sigue disponible en `/api/users`.
- `POSTMAN.md` contiene ejemplos de las rutas actuales. No se distribuye una colección JSON importable de Postman.

> [← Volver al README principal](../README.md)
