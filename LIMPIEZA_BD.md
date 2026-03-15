# Limpieza de base de datos para entrega final

Este documento describe cómo dejar la base de datos sin datos operativos, manteniendo **solo los usuarios** (correos y contraseñas) para que el sistema quede listo para entrega.

## Tablas que se vacían

- Gastos (Expense)
- Mantenimientos (Maintenance)
- Alquileres (Rental)
- WeeklyPayment
- Pagos semanales (PagoSemanal / pagos_semanales)
- Ingresos (Income)
- Repuestos (Repuesto)
- Conductores (Driver)
- Vehículos (Vehicle)

## Tablas que NO se modifican

- **User** — Se conservan todos los usuarios (correos y contraseñas). El login sigue funcionando igual.

## Opción 1: Desde la terminal (recomendado para producción)

Con el `.env` configurado con la base de datos a limpiar:

```bash
npm run db:clean
```

O directamente:

```bash
node scripts/clean-data.mjs
```

El script elimina en el orden correcto (respetando claves foráneas), muestra cuántos registros se borraron por tabla y confirma que los usuarios se mantienen.

## Opción 2: Desde la API (requiere estar logueado)

Si tienes una ruta de administración que llama a la API de limpieza:

```http
POST /api/admin/clean-data
```

Requiere autenticación. La respuesta incluye:
- Cantidad eliminada por tabla
- Verificación de que las tablas operativas quedaron en 0
- Confirmación de que el número de usuarios no cambió

## Después de la limpieza

- No quedan registros huérfanos.
- Las relaciones de la base de datos siguen correctas (no se modifica la estructura ni los modelos de Prisma).
- El sistema sigue operando con normalidad; solo estarán vacías las tablas de vehículos, choferes, pagos, mantenimientos, gastos, ingresos, repuestos y alquileres.
- Los usuarios pueden seguir iniciando sesión con sus correos y contraseñas.
