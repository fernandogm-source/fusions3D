# Fusions3D

Aplicación full-stack para gestionar un catálogo de piezas impresas en 3D. El repositorio contiene una API REST (Express, MongoDB y Mongoose) y una SPA Angular 20.

## Documentación

- [Backend: instalación, seed y endpoints](./fusions3d-back/README.md)
- [Frontend: features, rutas y servicios](./fusions3d-front/README.md)

## Funcionalidades

- Gestión de impresiones, categorías, materiales, variantes y roles. La gestión de usuarios está pendiente (ver [limitaciones](#limitaciones-conocidas)).
- Autenticación JWT en la API: login, consulta de la sesión, logout y perfil propio.
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
```

Para generar una clave: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Si la API está detrás de un proxy, define `TRUST_PROXY`.

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

Abre `http://localhost:4200`. En desarrollo, el frontend usa `http://localhost:3000/api`.

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
| Usuarios | `/api/users` (pendiente: no montada) |
| Health check | `/health` |

Los recursos CRUD incluyen listados, consulta individual, creación, actualización, activación, borrado lógico y restauración. Impresiones/categorías tienen consulta por slug; las variantes, por SKU y por impresión. Las rutas de usuarios todavía no están disponibles.

Las altas, los cambios de referencia y las reactivaciones requieren dependencias disponibles; si no lo están, la API responde con `409 DEPENDENCY_UNAVAILABLE`. Para evitar referencias colgantes, desactivar o borrar lógicamente categorías, impresiones, materiales y roles responde con `409 DEPENDENTS_EXIST` mientras tengan dependientes asociados, incluso si estos están inactivos o en la papelera. Hay que quitar o reasignar esas referencias antes de continuar.

## Organización

- **Backend:** capas `routes → controllers → services → repositories → models`; validación de entrada mediante esquemas Zod.
- **Frontend:** `core` contiene modelos, servicios y stores tipados; `features/` contiene un módulo lazy-loaded por recurso; `shared/` y `layouts/` reúnen UI reutilizable.

## Seguridad y despliegue

La API protege sus rutas con JWT: todas las rutas de negocio (`/api/*`, salvo login y Profile) requieren un token de un usuario con rol `ADMIN`. Antes de publicarla, revisa `JWT_SECRET`, `CORS_ORIGIN` y `TRUST_PROXY`. El panel de administración todavía no implementa el login ni envía el token (ver limitaciones), por lo que no funciona contra la API protegida.

El archivo `fusions3d-front/src/environments/environment.ts` todavía apunta a `http://localhost:3000/api`; hay que configurarlo con la URL del backend real antes del build de producción. Configura también `CORS_ORIGIN` con el dominio del frontend.

## Limitaciones conocidas

- No hay subida de archivos ni endpoints independientes para imágenes; las URLs de imágenes de impresiones se gestionan al crear o actualizar la impresión.
- El backend no tiene una suite de tests configurada.
- El panel de administración no tiene pantalla de login ni envía el token JWT a la API; sus peticiones recibirán `401` hasta que se implemente.
- La gestión de usuarios está pendiente: `/api/users` no está montada en la API y el módulo de usuarios del frontend no está terminado.
- `fusions3d-back/POSTMAN.md` documenta las peticiones actuales para probar la API. No hay una colección JSON de Postman importable en el repositorio.
