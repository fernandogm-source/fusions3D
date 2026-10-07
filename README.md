# Fusions3D

Aplicación web full-stack para la gestión de impresiones 3D. Permite listar, crear, editar, eliminar (borrado lógico) y restaurar impresiones, con una API REST y una interfaz moderna reactiva.

---

## Documentación detallada

- **Para información más detallada del frontend:** [`fusions3d-front/README.md`](./fusions3d-front/README.md)
- **Para información más detallada del backend:** [`fusions3d-back/README.md`](./fusions3d-back/README.md)

---

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Configuración e instalación](#configuración-e-instalación)
- [Variables de entorno](#variables-de-entorno)
- [Comandos disponibles](#comandos-disponibles)
- [Endpoints de la API](#endpoints-de-la-api)
- [Arquitectura](#arquitectura)
- [Funcionalidades clave](#funcionalidades-clave)
- [Despliegue](#despliegue)

---

## Requisitos previos

| Requisito | Versión |
|-----------|---------|
| Node.js | >= 20 |
| npm | >= 10 |
| MongoDB | >= 6 (local o Atlas) |

---

## Estructura del proyecto

Es un **monorepo** con dos subproyectos independientes:

```
Projecte-fusions3d/
├── fusions3d-back/          # API REST (Node.js + Express + MongoDB)
└── fusions3d-front/         # SPA (Angular 20 + TailwindCSS)
```

---

## Tecnologías

### Frontend (`fusions3d-front`)

| Categoría | Tecnología |
|-----------|------------|
| Framework | Angular 20 |
| Lenguaje | TypeScript 5.9 |
| Estilos | TailwindCSS 4 |
| Build | @angular/build (esbuild) |
| Librerías | ngx-skeleton-loader, SweetAlert2, RxJS, zone.js |

### Backend (`fusions3d-back`)

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express 4 |
| Base de datos | MongoDB |
| ODM | Mongoose 8 |
| Validación | Zod 4 |
| Seguridad | Helmet, CORS |
| Logging | Morgan |
| Utilidades | dotenv, slugify |
| Desarrollo | Nodemon |

---

## Configuración e instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Projecte-fusions3d
```

### 2. Backend

```bash
cd fusions3d-back
npm install
cp .env.example .env   # si no existe
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

### 3. Frontend

```bash
cd fusions3d-front
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

### 4. Seed de datos (opcional)

```bash
cd fusions3d-back
node seed.js
```

---

## Variables de entorno

### Backend (`fusions3d-back/.env`)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fusions3d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

### Frontend (`fusions3d-front/src/environments/environment.development.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiTimeout: 10000
};
```

---

## Comandos disponibles

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Build de producción |
| `npm run watch` | Build en modo watch |
| `npm test` | Tests unitarios (Karma + Jasmine) |

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot-reload (Nodemon) |
| `npm start` | Producción |

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/impresiones` | Listar impresiones |
| GET | `/api/impresiones/soft-deleted` | Listar eliminadas |
| GET | `/api/impresiones/active` | Listar activas |
| GET | `/api/impresiones/inactive` | Listar inactivas |
| GET | `/api/impresiones/slug/:slug` | Obtener por slug |
| POST | `/api/impresiones` | Crear impresión |
| GET | `/api/impresiones/:id` | Obtener por ID |
| PATCH | `/api/impresiones/:id` | Actualizar |
| PATCH | `/api/impresiones/:id/active` | Activar/desactivar |
| PATCH | `/api/impresiones/:id/soft-delete` | Eliminar (borrado lógico) |
| PATCH | `/api/impresiones/:id/restore` | Restaurar |

---

## Arquitectura

### Frontend

```
src/
├── environments/
│   ├── environment.ts              # Producción
│   └── environment.development.ts  # Desarrollo
├── app/
│   ├── core/                        # Servicios singleton, interceptors, modelos, store
│   │   ├── interceptors/
│   │   │   ├── error.interceptor.ts     # Errores globales → SweetAlert2
│   │   │   └── loading.interceptor.ts   # Indicador global de carga
│   │   ├── models/
│   │   │   ├── api-response.model.ts    # Envolvente { success, data } / errores API
│   │   │   └── impresion.model.ts       # Modelo Impresion + payloads
│   │   ├── services/
│   │   │   ├── api.service.ts           # Servicio HTTP centralizado
│   │   │   ├── impresiones.service.ts   # Endpoints del recurso /impresiones
│   │   │   └── loading.service.ts       # Contador global de peticiones (Signals)
│   │   └── store/
│   │       └── impresions.store.ts      # Store global/caché con Signals
│   ├── shared/                      # Reutilizable y agnóstico de dominio
│   │   ├── components/
│   │   │   ├── loader/                  # Spinner global
│   │   │   ├── empty-state/             # Sin resultados
│   │   │   ├── error-state/             # Error de API + reintento
│   │   │   └── not-found/               # Página 404
│   │   └── utils/
│   │       ├── alert.util.ts            # SweetAlert2 con tema oscuro
│   │       ├── custom-validators.ts     # Validadores (URL, número positivo)
│   │       ├── error-message.util.ts    # Traducción de errores
│   │       ├── format.util.ts           # Formato del tiempo de impresión
│   │       └── placeholder-image.util.ts# Imágenes placeholder SVG
│   ├── layouts/
│   │   └── main-layout/             # Navbar responsive + outlet + footer + loader
│   ├── features/
│   │   └── impresions/              # Módulo de impresiones (lazy loaded)
│   │       ├── components/
│   │       │   ├── impresion-card/      # Card (imagen, título, precio)
│   │       │   ├── impresion-form/      # Formulario reactivo reutilizable
│   │       │   ├── impresion-grid/      # Grid de cards
│   │       │   └── impresion-table/     # Tabla de impresiones
│   │       ├── pages/
│   │       │   ├── impresiones-list/    # Listar
│   │       │   ├── impresion-detail/    # Detalle (por slug)
│   │       │   ├── impresion-create/    # Crear
│   │       │   └── impresion-edit/      # Editar (por slug)
│   │       └── impresions.routes.ts
│   ├── app.config.ts                # Providers (router, HttpClient + interceptors)
│   ├── app.routes.ts                # Rutas raíz con lazy loading
│   ├── app.spec.ts                  # Tests unitarios
│   └── app.ts                       # Componente raíz
├── index.html
├── main.ts
└── styles.css
```

### Backend

```
src/
├── config/
│   └── database.js                  # Conexión a MongoDB
├── controllers/
│   └── print.controller.js          # Controlador de impresiones
├── middlewares/
│   ├── error.middleware.js          # Manejo de errores centralizado
│   └── validation.middleware.js     # Validación con Zod
├── modules/
│   └── print/
│       └── print.model.js           # Modelo Mongoose (Print)
├── repositories/
│   └── print.repository.js          # Acceso a datos (CRUD)
├── routes/
│   └── print.routes.js              # Definición de rutas
├── schemas/
│   └── print.schema.js              # Esquemas Zod (validación)
├── services/
│   └── print.service.js             # Lógica de negocio
├── utils/
│   ├── app.error.js                 # Clase AppError personalizada
│   └── slug.util.js                 # Generador de slugs único
└── app.js                           # Punto de entrada
```

---

## Funcionalidades clave

- **Soft delete:** Las impresiones se marcan con `deletedAt` en lugar de eliminarse físicamente, permitiendo su restauración.
- **Slugs únicos:** Se generan automáticamente a partir del nombre usando `slugify`, con verificación de unicidad en la base de datos.
- **Validación con Zod:** Todos los bodies y params de la API se validan con esquemas Zod antes de llegar al controlador.
- **Signals en Angular:** Estado reactivo con Signals para el store global y el contador de peticiones.
- **Lazy loading:** El módulo de impresiones se carga bajo demanda.
- **Interceptores HTTP:** Manejo centralizado de errores (con SweetAlert2) e indicador de carga global.
- **CORS configurable:** Origen permitido configurable vía variable de entorno.
- **Helmet:** Headers HTTP seguros habilitados por defecto.

---

## Despliegue

### Backend

```bash
cd fusions3d-back
npm start
```

Asegúrate de definir las variables de entorno en producción (`PORT`, `MONGODB_URI`, `CORS_ORIGIN`, `NODE_ENV=production`).

### Frontend

```bash
cd fusions3d-front
npm run build
```

Los archivos de producción se generan en `dist/`. Sirve estos archivos con cualquier servidor estático (Nginx, Apache, etc.) y configura el proxy inverso hacia la API.

---

## Notas

- **Autenticación:** No implementada (fuera del alcance actual).
- **Tests:** El frontend incluye tests unitarios con Karma + Jasmine. El backend no tiene tests configurados.
- **Docker:** No configurado.
