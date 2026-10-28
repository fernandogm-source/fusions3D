# Fusions3D — Frontend

Aplicación SPA de administración y catálogo de Fusions3D, desarrollada con Angular 20 y TypeScript. Consume la API REST de `fusions3d-back`.

El diseño usa un tema oscuro con acento naranja, una sidebar adaptable, Tailwind CSS 4, Inter y Space Grotesk.

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
│   ├── interceptors/  # Loading y errores HTTP
│   ├── models/        # Modelos tipados por recurso
│   ├── services/      # Servicios HTTP tipados por recurso + ApiService
│   └── store/         # Stores Signals con caché/selección y CRUD
├── features/
│   ├── impresions/    # Catálogo de prints (nombre histórico de la carpeta)
│   ├── categories/
│   ├── materials/
│   ├── print-variants/
│   ├── roles/
│   └── users/
├── layouts/
│   └── main-layout/   # Sidebar, topbar, outlet y loader global
└── shared/            # Componentes, validadores y utilidades comunes
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

La feature de impresiones también incluye una página de detalle (`/impresiones/:slug`); las demás features no tienen ruta de detalle en la interfaz actual.

Los modelos, servicios y stores tipados están en `core/`. Los formularios usan esos servicios para cargar referencias relacionadas (por ejemplo, materiales/prints para una variante y roles para un usuario); las operaciones CRUD pasan por el store del recurso.

## Rutas de la aplicación

| Feature | Listado / papelera | Crear | Detalle | Editar |
|---|---|---|---|---|
| Impresiones | `/impresiones` | `/impresiones/nueva` | `/impresiones/:slug` | `/impresiones/:id/editar` |
| Categorías | `/admin/categories` | `/admin/categories/nueva` | — | `/admin/categories/:id/editar` |
| Materiales | `/admin/materials` | `/admin/materials/nuevo` | — | `/admin/materials/:id/editar` |
| Variantes | `/admin/print-variants` | `/admin/print-variants/nueva` | — | `/admin/print-variants/:id/editar` |
| Roles | `/admin/roles` | `/admin/roles/nuevo` | — | `/admin/roles/:id/editar` |
| Usuarios (pendiente) | `/admin/users` | `/admin/users/nuevo` | — | `/admin/users/:id/editar` |

La papelera se abre desde el listado de cada feature y no tiene una ruta independiente.

Las features se cargan bajo demanda con `loadChildren`. Las vistas de papelera son accesos separados; no se añaden filtros por estado.

## API consumida

Base URL: `${environment.apiUrl}`. Recursos:

| Feature | Endpoint |
|---|---|
| Impresiones | `/prints` |
| Categorías | `/categories` |
| Materiales | `/materials` |
| Variantes | `/print-variants` |
| Roles | `/roles` |
| Usuarios (pendiente: la API no monta `/users`) | `/users` |

Los recursos usan la envolvente `{ success, data }`; `ApiService` desenvuelve `data` y aplica timeout. Los errores se traducen en `error-message.util.ts` y se notifican mediante el interceptor/SweetAlert2.

Las impresiones y categorías pueden incluir imágenes pobladas; las variantes no tienen imágenes. Las impresiones aceptan una lista de URLs HTTP/HTTPS al crearse o actualizarse; al actualizar, la lista reemplaza las imágenes asociadas (una lista vacía las elimina). No hay subida de archivos ni endpoints independientes para imágenes. Las imágenes se conservan y se muestran aunque la impresión o categoría esté inactiva o en la papelera; se usa un placeholder cuando no hay ninguna imagen asociada.

## Estado y formularios

- Los stores usan Signals para lista, selección, caché, carga, error y operaciones CRUD. `DependencyRefreshStore` notifica cambios en categorías, impresiones, materiales y roles; el store de variantes actualiza sus listados relacionados sin recargar la página.
- Los formularios son componentes propios de cada feature y reciben el registro inicial en modo edición. Las variantes no tienen nombre personalizado: se identifican por SKU y muestran impresión, material y color.
- La lista y la papelera se mantienen como vistas separadas, sin filtros de estado.
- `ApiService` centraliza las peticiones y la envoltura de respuesta; los interceptores gestionan carga y errores.
- Los listados de impresiones y variantes muestran avisos `dependencyIssues` cuando una referencia está ausente, eliminada o inactiva. La API devuelve `409 DEPENDENCY_UNAVAILABLE` si una operación requiere una dependencia que no está disponible y `409 DEPENDENTS_EXIST` si se intenta desactivar o borrar lógicamente un recurso con dependientes. Los errores de acciones se notifican mediante el interceptor sin sustituir la vista ya cargada; los fallos al cargar muestran el estado de error. En ciertos conflictos de dependencias durante la edición, la interfaz vuelve al listado.

## Seguridad

La API exige un token JWT de un usuario con rol `ADMIN`, pero el frontend todavía no tiene pantalla de login, guard de rutas ni envía el token en `ApiService`. Por tanto, las peticiones a la API protegida recibirán `401` hasta que se implemente. Ocultar enlaces o añadir un guard de frontend no protegería por sí solo los endpoints: la protección real está en la API.

La feature de usuarios está pendiente: su ruta de API no está montada y el servicio aún no está adaptado a su contrato.

> [← Volver al README principal](../README.md)
