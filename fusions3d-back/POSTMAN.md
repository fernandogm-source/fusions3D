# Fusions3D API - Postman

Se incluye una colección importable en:

```text
postman/Fusions3D.postman_collection.json
```

## Variable

En Postman utiliza:

```text
baseUrl = http://localhost:3000
```

## 1. Health check

```http
GET {{baseUrl}}/health
```

Respuesta:

```json
{
  "success": true,
  "service": "fusions3d-api",
  "status": "ok"
}
```

## 2. Listar impresiones

```http
GET {{baseUrl}}/api/v1/impresiones
```

## 3. Crear impresión

```http
POST {{baseUrl}}/api/v1/impresiones
Content-Type: application/json
```

Body:

```json
{
  "nombre": "Soporte para auriculares",
  "descripcion": "Soporte de sobremesa para auriculares.",
  "precio_venta": 19.99,
  "precio_coste": 7.5,
  "tiempo_impresion": 240
}
```

Copia el `uuid` recibido en la respuesta.

## 4. Obtener una impresión

```http
GET {{baseUrl}}/api/v1/impresiones/{uuid}
```

## 5. Actualizar una impresión

```http
PUT {{baseUrl}}/api/v1/impresiones/{uuid}
Content-Type: application/json
```

Body:

```json
{
  "nombre": "Soporte premium para auriculares",
  "descripcion": "Versión reforzada para sobremesa.",
  "precio_venta": 24.99,
  "precio_coste": 9.25,
  "tiempo_impresion": 300
}
```

El `uuid` no se puede modificar.

## 6. Eliminar una impresión

```http
DELETE {{baseUrl}}/api/v1/impresiones/{uuid}
```

## Orden recomendado de pruebas

1. `GET /health`
2. `POST /api/v1/impresiones`
3. `GET /api/v1/impresiones/{uuid}`
4. `PUT /api/v1/impresiones/{uuid}`
5. `GET /api/v1/impresiones`
6. `DELETE /api/v1/impresiones/{uuid}`

## Códigos de error principales

- `400`: datos inválidos.
- `404`: impresión o ruta no encontrada.
- `409`: conflicto de UUID único.
- `500`: error interno.
