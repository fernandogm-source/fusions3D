# Fusions3D

Aplicación full-stack para gestionar un catálogo de piezas impresas en 3D. El repositorio contiene una API REST (Express, MongoDB y Mongoose) y una SPA Angular 20.

## Documentación

- [Backend: instalación, seed y endpoints](./fusions3d-back/README.md)
- [Frontend: features, rutas y servicios](./fusions3d-front/README.md)

## Funcionalidades

- Gestión de impresiones, categorías, materiales, variantes, roles y usuarios.
- Alta y edición de los recursos; las impresiones también tienen vista de detalle.
- Activación/desactivación y borrado lógico con restauración desde la papelera. Desactivar o borrar un padre desactiva sus dependientes.
- Slugs para impresiones y categorías; SKU para variantes.
- Imágenes asociadas a impresiones y categorías se devuelven al poblar los recursos. Se conservan al desactivar o borrar lógicamente el elemento. **No existe una API para subir o administrar imágenes.**
- Los listados de impresiones, variantes y usuarios pueden devolver `dependencyIssues` cuando una referencia no existe, está borrada o inactiva.

## Tecnologías

| Aplicación | Tecnologías |
|---|---|
| Frontend | Angular 20, TypeScript 5.9, Tailwind CSS 4, RxJS, Signals, Reactive Forms, SweetAlert2 |
| Backend | Node.js 20+, Express 4, MongoDB, Mongoose 8, Zod 4, Helmet, CORS, Morgan |

## Requisitos

- Node.js >= 20 y npm >= 10.
- MongoDB >= 6, local o Atlas.

## Puesta en marcha

### 1. Backend

```bash
cd fusions3d-back
npm install
```

Copia `.env.example` a `.env` y configura `MONGODB_URI`. En desarrollo, el CORS debe permitir `http://localhost:4200`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`.

### 2. Datos de ejemplo (opcional)

Desde `fusions3d-back`:

```bash
npm run seed
```

El seed es idempotente: inserta o actualiza los registros de ejemplo sin vaciar las colecciones existentes. Crea materiales, categorías, roles, impresiones, variantes y usuarios. Cada impresión tiene una foto pública de Pexels y las categorías usan imágenes placeholder; los demás recursos no tienen imágenes asociadas. En la primera ejecución, el usuario de desarrollo es `admin@fusions3d.local` con contraseña `Admin123!`; define `SEED_ADMIN_PASSWORD` antes de ejecutarlo para usar otra. Las credenciales de ejemplo no son para producción.

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
| Health check | `/health` |

Los recursos CRUD incluyen listados, consulta individual, creación, actualización, activación, borrado lógico y restauración. Impresiones/categorías tienen consulta por slug; las variantes, por SKU y por impresión; los usuarios incluyen actualización de roles.

Al desactivar o borrar lógicamente una categoría se desactivan sus impresiones y variantes; al hacerlo con una impresión o material, se desactivan sus variantes; al hacerlo con un rol, se desactivan los usuarios que lo tienen asignado. Restaurar o reactivar el padre **no reactiva automáticamente** a sus dependientes. Las altas, cambios de referencia y reactivaciones requieren dependencias disponibles; si no lo están, la API responde con `409 DEPENDENCY_UNAVAILABLE`.

## Organización

- **Backend:** capas `routes → controllers → services → repositories → models`; validación de entrada mediante esquemas Zod.
- **Frontend:** `core` contiene modelos, servicios y stores tipados; `features/` contiene un módulo lazy-loaded por recurso; `shared/` y `layouts/` reúnen UI reutilizable.

## Seguridad y despliegue

**La autenticación y autorización todavía no están implementadas.** Las operaciones administrativas y los datos de usuarios están expuestos a cualquier cliente que pueda acceder a la API. No publiques la API ni el panel admin en producción hasta proteger las rutas.

El archivo `fusions3d-front/src/environments/environment.ts` todavía apunta a `http://localhost:3000/api`; hay que configurarlo con la URL del backend real antes del build de producción. Configura también `CORS_ORIGIN` con el dominio del frontend.

## Limitaciones conocidas

- No hay endpoints para cargar, editar o eliminar imágenes.
- El backend no tiene una suite de tests configurada.
- `fusions3d-back/POSTMAN.md` documenta las peticiones actuales para probar la API. No hay una colección JSON de Postman importable en el repositorio.
