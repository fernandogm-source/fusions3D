# Fusions3D — Frontend

Aplicación SPA de la tienda pública y del panel de administración de Fusions3D, desarrollada con Angular 20 y TypeScript. Consume la API REST de `fusions3d-back`.

El diseño usa un tema oscuro con acento naranja, Tailwind CSS 4, Inter y Space Grotesk. La tienda usa una cabecera compartida; el panel usa una sidebar en escritorio.

## Requisitos e instalación

- Node.js >= 20
- La API y MongoDB en ejecución. Para desarrollo, la API debe estar disponible en `http://localhost:3000`.

```bash
cd fusions3d-front
npm install
npm start
```

Abre `http://localhost:4200`.

## Comandos

| Comando | Acción |
|---|---|
| `npm start` | Angular dev server |
| `npm run build` | Build en `dist/` |
| `npm run watch` | Build de desarrollo en modo watch |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Tests unitarios en Chrome Headless |

## Configuración de API

La URL base se configura en `src/environments/`:

| Archivo | Uso | Valor actual |
|---|---|---|
| `environment.development.ts` | Desarrollo | `http://localhost:3000/api` |
| `environment.ts` | Build de producción | `http://localhost:3000/api` (placeholder local) |

**Antes de desplegar**, cambia `apiUrl` en `environment.ts` por la URL real del backend. El backend también debe permitir el origen del frontend mediante `CORS_ORIGIN`.

## Organización

La aplicación usa componentes standalone, rutas lazy-loaded, Reactive Forms, RxJS y Signals.

```text
src/app/
├── core/
│   ├── guards/        # authGuard, adminGuard y adminMatch/nonAdminMatch (canMatch)
│   ├── interceptors/  # Sesión (cookies y 401), loading y errores HTTP
│   ├── models/        # Modelos tipados por recurso
│   ├── services/      # Servicios HTTP tipados por recurso + ApiService
│   └── store/         # Stores Signals: auth, profile, caché/selección y CRUD
├── features/
│   ├── auth/          # Login (/login)
│   ├── shop/          # Tienda pública: inicio, catálogo y detalle
│   ├── profile/       # Perfil del usuario
│   ├── dashboard/     # Inicio del panel (/inicio)
│   ├── impresions/    # Impresiones (nombre histórico de la carpeta)
│   ├── categories/
│   ├── materials/
│   ├── print-variants/
│   ├── roles/
│   └── users/
├── layouts/
│   ├── shop-layout/   # Layout público: cabecera compartida, outlet y pie
│   └── main-layout/   # Layout del panel: sidebar, cabecera compartida, outlet y loader
└── shared/            # Componentes (incl. store-header), validadores y utilidades comunes
```

Cada feature de negocio tiene sus propias rutas, páginas y componentes específicos:

```text
features/<recurso>/
├── <recurso>.routes.ts
├── components/
│   ├── <recurso>-form/
│   └── <recurso>-table/
└── pages/
    ├── <recurso>-list/
    ├── <recurso>-create/
    └── <recurso>-edit/
```

La feature de impresiones también incluye una página de detalle en el panel (`/impresiones/:slug`). La tienda pública tiene su propio detalle (`/shop/:slug`).

### Cabecera compartida

`shared/components/store-header/` (`app-store-header`) es la cabecera que comparten la tienda y el panel. Contiene:

- Logo, buscador (escritorio y móvil) y navegación "Inicio" / "Catálogo".
- Enlace "Panel" (solo para ADMIN).
- Sin sesión: botón "Entrar" que lleva a `/login` conservando la página actual en `returnUrl`.
- Con sesión: avatar y nombre del usuario (enlace a `/perfil`) y botón de cerrar sesión.

En el panel, la cabecera sustituye a la antigua topbar. En móvil no hay botón de menú, así que el sidebar solo se muestra en escritorio. El componente `layouts/main-layout/topbar/` ya no se usa.

## Rutas de la aplicación

### Públicas (layout de tienda)

| Página | Ruta |
|---|---|
| Inicio de la tienda | `/` |
| Catálogo | `/shop` |
| Detalle de impresión | `/shop/:slug` |
| Login | `/login` |

### Sesión iniciada (cliente)

| Página | Ruta | Notas |
|---|---|---|
| Perfil | `/perfil` | Dentro del layout de tienda, con la cabecera compartida |

### Panel de administración (solo ADMIN)

| Feature | Listado / papelera | Crear | Detalle | Editar |
|---|---|---|---|---|
| Inicio | `/inicio` | — | — | — |
| Perfil | `/perfil` | — | — | — |
| Impresiones | `/impresiones` | `/impresiones/nueva` | `/impresiones/:slug` | `/impresiones/:id/editar` |
| Categorías | `/admin/categories` | `/admin/categories/nueva` | — | `/admin/categories/:id/editar` |
| Materiales | `/admin/materials` | `/admin/materials/nuevo` | — | `/admin/materials/:id/editar` |
| Variantes | `/admin/print-variants` | `/admin/print-variants/nueva` | — | `/admin/print-variants/:id/editar` |
| Roles | `/admin/roles` | `/admin/roles/nuevo` | — | `/admin/roles/:id/editar` |
| Usuarios | `/admin/users` | `/admin/users/nuevo` | — | `/admin/users/:id/editar` |

El perfil de un admin se muestra dentro del panel (con sidebar). El de un cliente se muestra dentro del layout de tienda.

La papelera se abre desde el listado de cada feature y no tiene una ruta independiente. Las features se cargan bajo demanda con `loadChildren`.

## Autenticación y navegación

- El login (`/login`) envía las credenciales a la API. La API devuelve la sesión en una cookie `HttpOnly`; el frontend no guarda tokens en el navegador.
- `AuthStore` mantiene el usuario actual. `restoreSession()` consulta `/api/auth/me` una sola vez por carga y se llama desde las guardas y desde la cabecera.
- Tras iniciar sesión, el usuario vuelve a `returnUrl` si existe; si no, va a `/` (admins y clientes).
- `authGuard` exige sesión y redirige a `/login` con `returnUrl`. `adminGuard` exige rol ADMIN; un cliente que intente entrar en el panel se redirige a `/perfil`.
- `adminMatch` y `nonAdminMatch` eligen la variante de `/perfil` según el rol: el admin la ve dentro del panel y el cliente dentro de la tienda.
- El interceptor de autenticación envía las cookies con cada petición y redirige a `/login` cuando la API responde `401`.

## API consumida

Base URL: `${environment.apiUrl}`. Recursos:

| Feature | Endpoint |
|---|---|
| Autenticación | `/auth` (`login`, `me`, `logout`) |
| Perfil | `/profiles` |
| Tienda pública | `/shop` |
| Impresiones | `/prints` |
| Categorías | `/categories` |
| Materiales | `/materials` |
| Variantes | `/print-variants` |
| Roles | `/roles` |
| Usuarios | `/users` |

Los recursos usan la envolvente `{ success, data }`; `ApiService` desenvuelve `data` y aplica timeout. Los errores se traducen en `error-message.util.ts` y se notifican mediante el interceptor/SweetAlert2.

Las impresiones y categorías pueden incluir imágenes pobladas; las variantes no tienen imágenes. Las impresiones aceptan una lista de URLs HTTP/HTTPS al crearse o actualizarse; al actualizar, la lista reemplaza las imágenes asociadas (una lista vacía las elimina). No hay subida de archivos ni endpoints independientes para imágenes. Las imágenes se conservan y se muestran aunque la impresión o categoría esté inactiva o en la papelera; se usa un placeholder cuando no hay ninguna imagen asociada.

## Estado y formularios

- Los stores usan Signals para lista, selección, caché, carga, error y operaciones CRUD. `DependencyRefreshStore` notifica cambios en categorías, impresiones, materiales y roles; el store de variantes actualiza sus listados relacionados sin recargar la página.
- Los formularios son componentes propios de cada feature y reciben el registro inicial en modo edición. Las variantes no tienen nombre personalizado: se identifican por SKU y muestran impresión, material y color.
- La lista y la papelera se mantienen como vistas separadas, sin filtros de estado.
- `ApiService` centraliza las peticiones y la envoltura de respuesta; los interceptores gestionan sesión, carga y errores.
- Los listados de impresiones y variantes muestran avisos `dependencyIssues` cuando una referencia está ausente, eliminada o inactiva. La API devuelve `409 DEPENDENCY_UNAVAILABLE` si una operación requiere una dependencia que no está disponible y `409 DEPENDENTS_EXIST` si se intenta desactivar o borrar lógicamente un recurso con dependientes. Los errores de acciones se notifican mediante el interceptor sin sustituir la vista ya cargada; los fallos al cargar muestran el estado de error. En ciertos conflictos de dependencias durante la edición, la interfaz vuelve al listado.

## Seguridad

Las guardas del frontend solo mejoran la navegación: ocultar enlaces o bloquear rutas no protege los datos. La protección real está en la API, que exige una sesión válida y, para las rutas de administración, rol `ADMIN`.

> [← Volver al README principal](../README.md)
