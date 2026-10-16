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
    ├── <recurso>-detail/
    └── <recurso>-edit/
```

Los modelos, servicios y stores tipados están en `core/`. Los formularios usan esos servicios para cargar referencias relacionadas (por ejemplo, materiales/prints para una variante y roles para un usuario); las operaciones CRUD pasan por el store del recurso.

## Rutas de la aplicación

| Feature | Listado / papelera | Crear | Detalle | Editar |
|---|---|---|---|---|
| Impresiones | `/impresiones` | `/impresiones/nueva` | `/impresiones/:slug` | `/impresiones/:slug/editar` |
| Categorías | `/admin/categories` | `/admin/categories/nueva` | `/admin/categories/:id` | `/admin/categories/:id/editar` |
| Materiales | `/admin/materials` | `/admin/materials/nuevo` | `/admin/materials/:id` | `/admin/materials/:id/editar` |
| Variantes | `/admin/print-variants` | `/admin/print-variants/nueva` | `/admin/print-variants/:id` | `/admin/print-variants/:id/editar` |
| Roles | `/admin/roles` | `/admin/roles/nuevo` | `/admin/roles/:id` | `/admin/roles/:id/editar` |
| Usuarios | `/admin/users` | `/admin/users/nuevo` | `/admin/users/:id` | `/admin/users/:id/editar` |

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
| Usuarios | `/users` |

Los recursos usan la envolvente `{ success, data }`; `ApiService` desenvuelve `data` y aplica timeout. Los errores se traducen en `error-message.util.ts` y se notifican mediante el interceptor/SweetAlert2.

Las respuestas de prints, categorías y variantes pueden incluir imágenes pobladas. La API no dispone todavía de endpoints de carga o edición de imágenes; los listados muestran un placeholder cuando no hay imagen.

## Estado y formularios

- Cada store sigue el patrón de `ImpresionsStore`: lista, selección, caché, carga, error, CRUD y acciones de estado/soft-delete/restore.
- Los formularios son componentes propios de cada feature y reciben el registro inicial en modo edición.
- La lista y la papelera se mantienen como vistas separadas, sin filtros de estado.
- `ApiService` centraliza las peticiones y la envoltura de respuesta; los interceptores gestionan carga y errores.

## Seguridad

Las rutas del frontend no tienen guard de autenticación y el backend tampoco valida identidad ni permisos. **Este panel es solo para desarrollo hasta que se implemente autenticación/autorización en la API**; ocultar enlaces o añadir un guard de frontend no protegería por sí solo los endpoints.

> [← Volver al README principal](../README.md)
