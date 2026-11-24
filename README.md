# Fusions3D

Aplicación full-stack para gestionar un catálogo de piezas impresas en 3D. El repositorio contiene una API REST (Express, MongoDB y Mongoose) y una SPA Angular 20.

## Documentación

- [Backend: instalación, seed y endpoints](./fusions3d-back/README.md)
- [Frontend: features, rutas y servicios](./fusions3d-front/README.md)
- [Gateway: enrutado de `/api`](./fusions3d-gateway/README.md)
- [Servicio de IA: descripciones, chat y análisis de comentarios](./fusions3d-ai/README.md)
- [Pruebas de la API con Postman](./fusions3d-back/POSTMAN.md)

## Funcionalidades

- Gestión de impresiones, categorías, materiales, variantes, roles y usuarios desde el panel de administración.
- Tienda pública con inicio, catálogo y detalle de impresiones, y una cabecera compartida con buscador, navegación y acceso a la sesión. Esa misma cabecera aparece en el panel de administración.
- Registro público de clientes (`/register`): crea una cuenta con rol `USER` y su perfil, y lleva al login.
- Autenticación JWT con dos tokens en cookies `HttpOnly`: un access token de 1 hora y un refresh token de 7 días. Si el access token caduca, el frontend lo renueva en silencio; si la sesión ha terminado, cierra sesión y pide iniciarla de nuevo.
- Login, consulta de la sesión, logout y perfil propio. La misma pantalla de login sirve a admins y clientes; tras entrar, los admins van al panel y los clientes a la tienda, salvo que haya una página de origen.
- Likes en variantes: cualquier usuario con sesión puede marcar o desmarcar "me gusta" en una variante desde la tienda. Cada usuario puede dar un solo like por variante, y el contador `likesCount` se actualiza al dar o quitar el like. El catálogo muestra el total de likes de cada impresión y cada usuario tiene su página "Mis likes" (`/perfil/likes`) con las variantes que ha marcado.
- Valoraciones y comentarios: en el detalle de cada impresión, los clientes con sesión valoran una variante con 1 a 5 estrellas y escriben un comentario (uno por variante). Pueden editar o borrar el suyo. La tienda muestra la media y el número de valoraciones de cada variante, el reparto de estrellas con filtros y la lista de comentarios. Cada alta, edición o borrado recalcula la media de la variante.
- Resumen con IA: la tienda muestra un resumen en lenguaje natural de la opinión de los clientes sobre una impresión, generado por el servicio de IA y guardado en caché hasta que cambien sus comentarios.
- Panel de comentarios (`/admin/reviews`, solo ADMIN): lista las impresiones con comentarios, permite filtrar, borrar comentarios y consultar el análisis de sentimiento de cada impresión (porcentajes de positivos, neutros y negativos y un resumen generado con IA).
- Alta y edición de los recursos; las impresiones también tienen vista de detalle.
- Activación/desactivación y borrado lógico con restauración desde la papelera. Desactivar o borrar lógicamente una categoría, impresión, material o rol se bloquea si conserva dependientes (`409 DEPENDENTS_EXIST`); no se aplica una cascada.
- Slugs para impresiones y categorías; SKU generado como identificador de variantes (sin nombre personalizado).
- Imágenes asociadas a impresiones y categorías se devuelven al poblar los recursos y se conservan al desactivar o borrar lógicamente el elemento. En impresiones se pueden enviar listas de URLs al crear o actualizar; no hay subida de archivos ni rutas independientes para imágenes.
- Los listados de impresiones, variantes y usuarios pueden devolver `dependencyIssues` cuando una referencia no existe, está borrada o inactiva.

## Tecnologías

| Aplicación | Tecnologías |
|---|---|
| Frontend | Angular 20, TypeScript 5.9, Tailwind CSS 4, RxJS, Signals, Reactive Forms, SweetAlert2 |
| Backend | Node.js 20+, Express 4, MongoDB, Mongoose 8, Zod 4, Argon2, JWT, Helmet, CORS, Morgan |
| Gateway | Node.js 20+, Express, reenvío de `/api` al backend |
| Servicio de IA | Node.js 20+, Express, OpenRouter (modelos gratuitos con respaldo entre modelos), Zod |

## Requisitos

- Node.js >= 20 y npm >= 10.
- MongoDB >= 6, local o Atlas.

## Puesta en marcha

### 1. Backend

```bash
cd fusions3d-back
npm install
```

Copia `.env.example` a `.env`, configura `MONGODB_URI` y define `JWT_SECRET` con una clave aleatoria de al menos 32 bytes. En desarrollo, el CORS debe permitir `http://localhost:4200`:

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
```

Para generar una clave: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Usa una distinta para `JWT_SECRET` y para `JWT_REFRESH_SECRET`. Si la API está detrás de un proxy, define `TRUST_PROXY`.

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`.

### 2. Datos de ejemplo (opcional)

Desde `fusions3d-back`:

```bash
npm run seed
```

Este comando inserta o actualiza datos de ejemplo sin vaciar las colecciones. Para borrar y recrear los datos de las colecciones de Fusions3D, ejecuta `npm run seed:reset` desde `fusions3d-back`; no se permite con `NODE_ENV=production`. El seed crea también las cuentas de prueba (administrador `admin@fusions3d.local` y usuarios `usuario1@fusions3d.local` y `usuario2@fusions3d.local`). Las contraseñas están definidas en `fusions3d-back/seed.js`, son solo para desarrollo y no para producción.

### 3. Frontend

```bash
cd fusions3d-front
npm install
npm start
```

### 4. Gateway

```bash
cd fusions3d-gateway
npm install
npm run dev
```

El gateway escucha en `http://localhost:4000` y reenvía `/api/*` al backend (puerto 3000). Abre `http://localhost:4200`. En desarrollo, el frontend usa `http://localhost:4000/api`.

### 5. Servicio de IA (opcional)

```bash
cd fusions3d-ai
npm install
cp .env.example .env
npm run dev
```

El servicio queda en `http://localhost:3001`. Configura `AI_SERVICE_KEY` (la misma clave en `fusions3d-ai` y en `fusions3d-back`) y `OPENROUTER_API_KEY`. Sin él, el chat de la tienda y los resúmenes de comentarios no funcionan (`503 AI_NOT_CONFIGURED`), pero el resto de la aplicación sí. Las peticiones de IA las hace solo el backend, no el navegador.

### Arranque rápido en Windows

`iniciar-todo.bat`, en la raíz del repositorio, abre una pestaña (o ventana) por servicio: backend, IA, gateway y frontend. Hay que tener instaladas las dependencias de cada uno (`npm install`) antes de usarlo.

## Comandos

### Frontend (`fusions3d-front`)

| Comando | Acción |
|---|---|
| `npm start` | Servidor Angular de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Tests unitarios |

### Backend (`fusions3d-back`)

| Comando | Acción |
|---|---|
| `npm run dev` | API con Nodemon |
| `npm start` | API en modo normal |
| `npm run seed` | Insertar/actualizar datos de ejemplo |
| `npm run seed:reset` | Vaciar las colecciones de Fusions3D y recrear datos de prueba |

## Rutas principales de la API

Todos los recursos están bajo `/api`; la tabla completa está en el [README del backend](./fusions3d-back/README.md).

| Recurso | Base |
|---|---|
| Impresiones | `/api/prints` |
| Categorías | `/api/categories` |
| Materiales | `/api/materials` |
| Variantes | `/api/print-variants` |
| Roles | `/api/roles` |
| Usuarios | `/api/users` |
| Tienda pública | `/api/shop` |
| Likes de variantes | `/api/shop/variants/:variantSlug/likes` |
| Mis likes | `/api/profiles/likes` |
| Valoraciones y comentarios de una impresión | `/api/shop/prints/:slug/reviews` |
| Resumen de valoraciones con IA | `/api/shop/prints/:slug/reviews/ai-summary` |
| Comentarios del panel (ADMIN) | `/api/reviews` |
| Health check | `/health` |

Los recursos CRUD incluyen listados, consulta individual, creación, actualización, activación, borrado lógico y restauración. Impresiones/categorías tienen consulta por slug; las variantes, por SKU y por impresión.

Las altas, los cambios de referencia y las reactivaciones requieren dependencias disponibles; si no lo están, la API responde con `409 DEPENDENCY_UNAVAILABLE`. Para evitar referencias colgantes, desactivar o borrar lógicamente categorías, impresiones, materiales y roles responde con `409 DEPENDENTS_EXIST` mientras tengan dependientes asociados, incluso si estos están inactivos o en la papelera. Hay que quitar o reasignar esas referencias antes de continuar.

## Organización

- **Backend:** capas `routes → controllers → services → repositories → models`; validación de entrada mediante esquemas Zod.
- **Frontend:** `core` contiene modelos, servicios y stores tipados; `features/` contiene un módulo lazy-loaded por recurso; `shared/` y `layouts/` reúnen UI reutilizable.

## Seguridad y despliegue

La API protege sus rutas con JWT: todas las rutas de negocio (`/api/*`, salvo login, registro, renovación, logout, tienda pública y Profile) requieren un token de un usuario con rol `ADMIN`. Los likes de variantes, la lista "Mis likes" y los comentarios (escribir, editar y borrar el propio) requieren sesión de cualquier usuario activo, no solo de ADMIN. Solo ADMIN puede borrar comentarios ajenos y acceder al panel de comentarios. El servicio de IA solo acepta peticiones con la clave interna `AI_SERVICE_KEY`. Antes de publicarla, revisa `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` y `TRUST_PROXY`.

La sesión se guarda en dos cookies `HttpOnly`: `fusions3d_access` (1 hora, ruta `/api`) y `fusions3d_refresh` (7 días, ruta `/api/auth`). El frontend gestiona los 401: si el access token ha caducado, pide `/api/auth/refresh` y reintenta la petición; si la sesión ha terminado, pide `/api/auth/logout` y lleva al login con un aviso. Detalles en el [README del backend](./fusions3d-back/README.md#notas-importantes).

El archivo `fusions3d-front/src/environments/environment.ts` todavía apunta a `http://localhost:4000/api` (el gateway); hay que configurarlo con la URL pública del gateway antes del build de producción. Configura también `CORS_ORIGIN` con el dominio del frontend.

## Limitaciones conocidas

- No hay subida de archivos ni endpoints independientes para imágenes; las URLs de imágenes de impresiones se gestionan al crear o actualizar la impresión.
- El backend tiene tests unitarios e integración con `npm test`, pero la cobertura es parcial (sobre todo shop, búsqueda, slugs y query builder).
- La topbar antigua del panel (`layouts/main-layout/topbar`) ya no se usa y está pendiente de eliminar. En móvil el panel no tiene botón de menú, así que el sidebar solo se ve en escritorio.
- Los comentarios no tienen moderación automática: se publican al instante. Solo su autor o un ADMIN pueden borrarlos.
- Los resúmenes y el sentimiento con IA usan como máximo los 60 comentarios más recientes, y dependen de los modelos gratuitos de OpenRouter, cuya disponibilidad y límites cambian.
- El análisis y el resumen de la IA no se recalculan al instante: se guardan en caché y se regeneran en la siguiente petición tras un cambio en los comentarios de la impresión.
- `fusions3d-back/POSTMAN.md` documenta las peticiones actuales para probar la API. No hay una colección JSON de Postman importable en el repositorio.
