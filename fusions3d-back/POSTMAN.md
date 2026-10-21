# Probar Fusions3D API con Postman

Guía de peticiones para la API actual. No hay un JSON de colección Postman incluido en el repositorio.

## Configuración

Define esta variable en Postman:

```text
baseUrl = http://localhost:3000
```

Las rutas de negocio llevan el prefijo `/api`. Los ejemplos asumen que la API está iniciada y MongoDB conectado.

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
  "status": "published"
}
```

El backend genera el `slug`. Guarda el `_id` devuelto para crear una variante.

### Crear variante

```http
POST {{baseUrl}}/api/print-variants
Content-Type: application/json
```

```json
{
  "printId": "<PRINT_ID>",
  "name": "Estándar - PLA Negro",
  "materialId": "<MATERIAL_ID>",
  "color": "Negro",
  "salePrice": 12.5,
  "costPrice": 4.2,
  "printTime": 180
}
```

El `sku` se genera automáticamente a partir del print, el material y el color. No debe enviarse en la creación ni en la actualización; si cambia alguno de esos datos, el backend lo vuelve a generar.

## Consultar recursos

```http
GET {{baseUrl}}/api/prints
GET {{baseUrl}}/api/categories
GET {{baseUrl}}/api/materials
GET {{baseUrl}}/api/print-variants
GET {{baseUrl}}/api/roles
GET {{baseUrl}}/api/users
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

El endpoint `PATCH /api/{resource}/<ID>/active` alterna el estado activo/inactivo y no requiere body:

```http
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/active
```

También existe un endpoint específico para reemplazar roles de usuario:

```http
PATCH {{baseUrl}}/api/users/<USER_ID>/roles
Content-Type: application/json
```

```json
{ "roles": ["<ROLE_ID>"] }
```

## Borrado lógico y restauración

Los recursos no se borran físicamente mediante la API:

```http
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/soft-delete
PATCH {{baseUrl}}/api/prints/<PRINT_ID>/restore
GET   {{baseUrl}}/api/prints/soft-deleted
```

Los mismos sufijos (`/soft-delete`, `/restore`, `/soft-deleted`) están disponibles en los demás recursos.

Desactivar un recurso padre también desactiva sus dependientes: categoría → impresiones y variantes; impresión o material → variantes; rol → usuarios asignados. El borrado lógico aplica la misma cascada. Los hijos no se borran y no se reactivan automáticamente cuando se restaura o activa el padre. Las imágenes asociadas a impresiones y categorías se conservan.

Los listados de impresiones, variantes y usuarios pueden incluir `dependencyIssues` en cada registro para señalar una referencia ausente, eliminada o inactiva.

Ejemplo de referencia inactiva en la respuesta de un listado:

```json
{
  "field": "categoryId",
  "message": "La categoría asignada está desactivada",
  "referenceId": "<CATEGORY_ID>"
}
```

## Usuarios

Crear usuario requiere nombre, email y contraseña de al menos ocho caracteres:

```http
POST {{baseUrl}}/api/users
Content-Type: application/json
```

```json
{
  "name": "María García",
  "email": "maria@example.com",
  "password": "Cambiar123!",
  "roles": ["<ROLE_ID>"],
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

Las contraseñas se guardan con bcrypt y no se devuelven en las respuestas.

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
- `409`: conflicto con un valor único ya existente o `DEPENDENCY_UNAVAILABLE` cuando una operación requiere una referencia borrada/inactiva.
- `500`: error interno.

## Seguridad

La API actual no tiene autenticación ni autorización. No la expongas públicamente ni uses estos ejemplos con datos sensibles hasta proteger las rutas.
