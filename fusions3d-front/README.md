# Fusions3D — Frontend

SPA desarrollada con **Angular 20** para la plataforma **Fusions3D**, tienda de objetos
impresos en 3D. Consume la API REST del proyecto `fusions3d-back`.

Diseño oscuro tipo *PcComponentes* (acento naranja `#ff6000`) construido con TailwindCSS.

---

## 📋 Requisitos

- Node.js >= 20
- La API REST `fusions3d-back` en ejecución (`http://localhost:3000`) con MongoDB.

## 🚀 Instalación

```bash
cd fusions3d-front
npm install
```

## ▶️ Ejecución

```bash
# 1. Arranca el backend (desde la carpeta fusions3d-back)
npm run dev          # http://localhost:3000

# 2. Arranca el frontend (desde fusions3d-front)
npm start            # http://localhost:4200
```

Abre `http://localhost:4200` — redirige automáticamente al catálogo `/impresiones`.

### Otros comandos

```bash
npm run build        # build de producción en dist/
npm test             # tests unitarios (Karma)
```

## 📄 Variables de entorno

Configuración en `src/environments/`:

| Archivo                       | Uso         | Variables                                            |
| ----------------------------- | ----------- | ---------------------------------------------------- |
| `environment.development.ts`  | Desarrollo  | `apiUrl: 'http://localhost:3000/api'`, `apiTimeout: 10000` |
| `environment.ts`              | Producción  | Mismas claves (ajustar `apiUrl` al dominio real)     |

> **CORS**: el backend debe permitir el origen `http://localhost:4200`
> (`CORS_ORIGIN` en el `.env` del backend).

## 📁 Estructura del proyecto

```
src/
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── app/
│   ├── core/                        # Servicios singleton, interceptors, modelos, store
│   │   ├── interceptors/
│   │   │   ├── error.interceptor.ts     # Errores globales → SweetAlert2
│   │   │   └── loading.interceptor.ts   # Indicador global de carga
│   │   ├── models/
│   │   │   ├── api-response.model.ts    # Envolvente { success, data } / errores API
│   │   │   └── impresion.model.ts       # Modelo Impresion + payloads
│   │   ├── services/
│   │   │   ├── api.service.ts           # Servicio HTTP centralizado (baseUrl, timeout, serialización)
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
│   │       ├── custom-validators.ts     # Validadores (URL, número positivo, mensajes)
│   │       ├── error-message.util.ts    # Traducción de errores a mensajes amigables
│   │       ├── format.util.ts           # Formato del tiempo de impresión
│   │       └── placeholder-image.util.ts# Imágenes placeholder SVG deterministas
│   ├── layouts/
│   │   └── main-layout/             # Navbar responsive + outlet + footer + loader
│   ├── features/
│   │   └── impresions/              # Módulo de impresiones (lazy loaded)
│   │       ├── components/
│   │       │   ├── impresion-card/      # Card (imagen, título, precio)
│   │       │   ├── impresion-grid/      # Grid de cards
│   │       │   └── impresion-form/      # Formulario reactivo reutilizable
│   │       ├── pages/
│   │       │   ├── impresiones-list/    # Listar
│   │       │   ├── impresion-detail/    # Detalle (por slug)
│   │       │   ├── impresion-create/    # Crear
│   │       │   └── impresion-edit/      # Editar (por slug)
│   │       └── impresions.routes.ts
│   ├── app.config.ts                # Providers (router, HttpClient + interceptors)
│   ├── app.routes.ts                # Rutas raíz con lazy loading
│   └── app.ts                       # Componente raíz
└── index.html
```

## 🛣️ Rutas

| Ruta                          | Descripción                    |
| ----------------------------- | ------------------------------ |
| `/impresiones`                | Catálogo (listado)             |
| `/impresiones/nueva`          | Crear impresión                |
| `/impresiones/:slug`          | Detalle (identificador: slug)  |
| `/impresiones/:slug/editar`   | Editar impresión               |
| `**`                          | Página 404                     |

Todas las rutas usan **lazy loading** (`loadComponent` / `loadChildren`) y los
parámetros se reciben como `input()` gracias a `withComponentInputBinding()`.

## 🔌 API consumida

Base URL: `http://localhost:3000/api` (recurso `/impresiones`):

| Método | Endpoint                         | Uso en la app            |
| ------ | -------------------------------- | ------------------------ |
| GET    | `/impresiones`                   | Listado                  |
| GET    | `/impresiones/slug/:slug`        | Detalle / edición        |
| POST   | `/impresiones`                   | Crear                    |
| PATCH  | `/impresiones/:id`               | Actualizar               |
| PATCH  | `/impresiones/:id/active`        | Activar / desactivar     |
| PATCH  | `/impresiones/:id/soft-delete`   | Eliminar (borrado lógico)|

Respuestas con envolvente `{ success, data }`, desenvueltas por `ApiService`.
Errores con `{ success: false, error: { code, message, details? } }`, gestionados
globalmente por el `errorInterceptor` (SweetAlert2) y traducidos a mensajes amigables.

## 🧠 Gestión de estado — `ImpresionsStore`

Store global con **Angular Signals** (`signal`, `computed`, `effect`) que actúa como
**caché**:

- `loadAll()` solo pide el catálogo la primera vez (evita peticiones duplicadas).
- `loadBySlug()` consulta la caché antes de llamar a la API.
- Las mutaciones (crear/editar/activar/eliminar) sincronizan la caché en memoria.
- Estado expuesto: `impresions`, `loading`, `error`, `selectedImpresion`
  (+ derivados: `total`, `activeImpresions`, `hasError`, `isEmpty`).

## 🎨 Stack

Angular 20 (Standalone Components) · Router · HttpClient · Signals · Reactive Forms ·
RxJS · TailwindCSS 4 · SweetAlert2 · ngx-skeleton-loader

## 📝 Notas

- **Imágenes**: la API actual no persiste un campo `imagen`. El formulario admite una
  URL de imagen opcional (validada, preparada para el futuro) y las tarjetas muestran
  un placeholder SVG determinista generado a partir del slug cuando no hay imagen.
- **Validaciones del formulario**: `required`, `minLength`, `maxLength`, patrón de URL,
  precios positivos y valores numéricos, con mensajes accesibles (`role="alert"`,
  `aria-invalid`, `aria-describedby`).
- **Manejo de errores**: timeout (10 s), API caída, errores HTTP 4xx/5xx, errores de
  validación del backend y respuestas inválidas; todas las operaciones usan try/catch
  y muestran mensajes amigables.
- **Preparada para crecer**: nuevos módulos (usuarios, reservas, pagos, reviews,
  favoritos…) se añaden como carpetas bajo `features/` con sus propias rutas lazy.
