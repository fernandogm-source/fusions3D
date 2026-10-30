# Probar Fusions3D API con Postman

Guía de peticiones para la API actual. No hay un JSON de colección Postman incluido en el repositorio.

## Configuración

Define esta variable en Postman:

```text
baseUrl = http://localhost:3000
adminEmail = admin@fusions3d.local
adminPassword = Admin-Fusions3D-2026!
```

Las rutas de negocio llevan el prefijo `/api`. Las rutas del panel requieren un token ADMIN; las de Auth y Profile aplican sus propios requisitos de autenticación. Los ejemplos asumen que la API está iniciada y MongoDB conectado.

## Iniciar sesión

Provisiona primero los datos de prueba con `npm run seed`. El administrador de desarrollo es `admin@fusions3d.local` con contraseña `Admin-Fusions3D-2026!`, definida en `seed.js`.

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

El login devuelve `data.user` y emite el token en la cookie `fusions3d_session` (HttpOnly, `SameSite=Lax`, ruta `/api`). Postman guarda y reenvía esa cookie automáticamente. Cualquier usuario con cuenta y rol activos puede iniciar sesión. Las rutas de administración requieren rol `ADMIN` (`403` para el resto); los usuarios normales solo pueden usar Profile.

Si necesitas un cliente sin cookies, también se acepta la cabecera `Authorization: Bearer <token>`, pero el token ya no se devuelve en el cuerpo de la respuesta.

`GET {{baseUrl}}/api/auth/me` devuelve la identidad de la sesión actual.

## Cerrar sesión

El endpoint revoca el token de la sesión, borra la cookie y responde `{ success: true, data: null, message }`. Después de responder, ese token ya no puede volver a utilizarse.

```http
POST {{baseUrl}}/api/auth/logout
```

Respuesta esperada:

```json
{
  "success": true,
  "data": null,
  "message": "Sesión cerrada correctamente"
}
```

## Consultar y actualizar Profile

El usuario autenticado consulta y modifica su propio perfil. ADMIN puede indicar el usuario objetivo mediante `userId` en la query.

```http
GET {{baseUrl}}/api/profiles/getprofile
```

```http
PATCH {{baseUrl}}/api/profiles/updateprofile
Content-Type: application/json
```

```json
{
  "username": "nuevo.usuario",
  "name": "Nombre de usuario",
  "phone": "+34 600 000 000",
  "addresses": [
    {
      "street": "Calle Mayor 1",
      "city": "Madrid",
      "postalCode": "28001",
      "country": "España",
      "isDefault": true
    }
  ]
}
```

Para que un ADMIN opere sobre otro perfil, añade `?userId=<USER_ID>` a cualquiera de las dos rutas. Los usuarios normales no pueden seleccionar otro `userId`.

## Health check

```http
GET {{baseUrl}}/health
```

Respuesta esperada:

```json
{
  "success": true,
  "service": "fusions3d-api",
  "status": "ok"
}
```

## Crear datos relacionados

### Crear categoría

```http
POST {{baseUrl}}/api/categories
Content-Type: application/json
```

```json
{
  "name": "Accesorios de escritorio",
  "status": "published"
}
```

Guarda el `_id` devuelto para crear un print.

### Crear material

```http
POST {{baseUrl}}/api/materials
Content-Type: application/json
```

```json
{ "name": "PLA" }
```

### Crear print

```http
POST {{baseUrl}}/api/prints
Content-Type: application/json
```

```json
{
  "name": "Soporte para móvil",
  "description": "Soporte de escritorio para teléfono móvil.",
  "categoryId": "<CATEGORY_ID>",
  "status": "published",
  "images": [
    "https://example.com/soporte-frontal.jpg",
    "https://example.com/soporte-lateral.jpg"
  ]
}
```

El backend genera el `slug`. Las URLs deben usar HTTP o HTTPS; la primera imagen queda como portada. Guarda el `_id` devuelto para crear una variante.

### Crear variante

```http
POST {{baseUrl}}/api/print-variants
Content-Type: application/json
```

```json
{
  "printId": "<PRINT_ID>",
  "materialId": "<MATERIAL_ID>",
  "color": "Negro",
  "salePrice": 12.5,
  "costPrice": 4.2,
  "printTime": 180
}
```

Las variantes no tienen nombre personalizado: se muestran mediante SKU, impresión, material y color. El `sku` se genera automáticamente a partir del print, el material y el color. No debe enviarse en la creación ni en la actualización; si cambia alguno de esos datos, el backend lo vuelve a generar.

## Consultar recursos

```http
GET {{baseUrl}}/api/prints
GET {{baseUrl}}/api/categories
GET {{baseUrl}}/api/materials
GET {{baseUrl}}/api/print-variants
```

Consultas específicas:

```http
GET {{baseUrl}}/api/prints/slug/soporte-para-movil
GET {{baseUrl}}/api/categories/slug/accesorios-de-escritorio
GET {{baseUrl}}/api/print-variants/sku/SOPMOV-PLA-NEG
GET {{baseUrl}}/api/print-variants/print/<PRINT_ID>
GET {{baseUrl}}/api/prints/<PRINT_ID>
```

Los recursos también admiten `GET /active`, `GET /inactive` y `GET /soft-deleted`.

## Actualizar y activar

Los cambios de campos usan `PATCH` y solo requieren enviar los campos que se quieren actualizar:

```http
PATCH {{baseUrl}}/api/prints/<PRINT_ID>
Content-Type: application/json
```

```json
{ "name": "Soporte premium para móvil" }
```

Para gestionar las imágenes, envía la lista final que quieres conservar (incluidas las URLs nuevas). Las imágenes omitidas se eliminan de esa impresión; `"images": []` las elimina todas. La respuesta devuelve la impresión con sus imágenes actualizadas.

```json
{
  "images": [
    "https://example.com/soporte-frontal.jpg",
    "https://example.com/nueva-vista.jpg"
  ]
}
```

El endpoint `PATCH /api/{resource}/<ID>/active` alterna el estado activo/inactivo y no requiere body:

```http
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/active
```

## Borrado lógico y restauración

Los recursos no se borran físicamente mediante la API:

```http
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/soft-delete
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/restore
GET   {{baseUrl}}/api/prints/soft-deleted
```

Los mismos sufijos (`/soft-delete`, `/restore`, `/soft-deleted`) están disponibles en los demás recursos.

Desactivar o borrar lógicamente una categoría, impresión o material se rechaza con `409 DEPENDENTS_EXIST` si todavía tiene dependientes asociados: categoría → impresiones, impresión o material → variantes. Se cuentan también los dependientes inactivos y eliminados lógicamente; hay que reasignar o quitar esas referencias antes de continuar. Si un dependiente está en la papelera, restáuralo para cambiar la referencia. No se modifican los dependientes. Las imágenes asociadas a impresiones y categorías se conservan.

Los listados de impresiones y variantes pueden incluir `dependencyIssues` en cada registro para señalar una referencia ausente, eliminada o inactiva.

Ejemplo de referencia inactiva en la respuesta de un listado:

```json
{
  "field": "categoryId",
  "message": "La categoría asignada está desactivada",
  "referenceId": "<CATEGORY_ID>"
}
```

## Respuestas y errores

Éxito:

```json
{ "success": true, "data": {} }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación en los datos enviados",
    "details": [{ "field": "name", "message": "El nombre es obligatorio" }]
  }
}
```

- `400`: datos inválidos o estado no permitido.
- `404`: recurso o ruta no encontrada.
- `409`: conflicto con un valor único ya existente, `DEPENDENCY_UNAVAILABLE` cuando una operación requiere una referencia borrada/inactiva o `DEPENDENTS_EXIST` cuando se intenta desactivar/eliminar lógicamente un recurso que aún tiene dependientes.
- `500`: error interno.

## Seguridad

Las rutas del panel de negocio, incluidas las lecturas, requieren rol `ADMIN`. Profile requiere autenticación y aplica propietario o ADMIN; este último puede seleccionar cualquier usuario con `?userId=<USER_ID>`. Sin token la API responde `401`; un usuario que intente acceder al perfil de otro recibe `403`. `/api/roles` está activa para ADMIN; `/api/users` sigue desactivada mientras el frontend adopta los nuevos contratos.
