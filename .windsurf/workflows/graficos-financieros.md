---
description: Investigar e implementar gráficos financieros (Finanzas + Reportes)
---

# Objetivo
Implementar gráficos financieros en BlasRodríguez de forma segura, responsive (móvil/desktop) y sin degradar rendimiento.

# Recomendación de librería
Usar **Recharts** (React-first):
- Encaja bien con Next.js (App Router) y componentes cliente.
- Buen soporte de responsive con `ResponsiveContainer`.
- Tooltips/legends simples.
- Curva de aprendizaje baja.

Si en la investigación aparece necesidad fuerte de features avanzadas (zoom, datasets enormes, anotaciones), considerar ECharts; pero empezar con Recharts.

# Alcance
- **Dashboard/Finanzas**: gráficos para control operativo (semanal/mensual) y lectura rápida.
- **Reportes**: gráficos para análisis (comparativas, distribución) y opcional export.

# Datos mínimos a preparar (antes de graficar)
1. Definir unidad de tiempo:
   - Semanal (Lun-Dom) como estándar del sistema.
   - Mensual para tendencias.

2. Definir métricas:
   - `totalPagado` (suma de `monto`).
   - `totalAbonos` y `totalCompletos` (según `tipoPago`).
   - `pendiente` (si aplica): `weeklyRate - pagadoSemana` por vehículo o total.

3. Definir dimensiones:
   - Por semana.
   - Por vehículo.
   - Por conductor.

# Investigación rápida (decisión final)
1. Revisar dependencias actuales del repo:
   - Ver si ya hay librería de charts instalada.
   - Confirmar si hay componentes UI que ya resuelven cards/containers.

2. Confirmar constraints de UX:
   - Mobile-first: sin overflow horizontal.
   - Tooltips que se puedan cerrar (tap) y que no salgan del viewport.

3. Confirmar performance:
   - Evitar graficar datasets gigantes en cliente.
   - Preferir agregaciones en server/API.

# Plan de implementación (primeros 2 gráficos)
## Gráfico A (Finanzas): Línea semanal
- Tipo: `LineChart`
- Eje X: semana (inicio o etiqueta `DD-MM`)
- Eje Y: total pagado
- Objetivo: tendencia de pagos

## Gráfico B (Finanzas): Dona abonos vs completos
- Tipo: `PieChart`
- Segmentos: `abono`, `completo`
- Objetivo: mix de pagos

# Estructura recomendada (componentes)
1. Crear componentes cliente:
   - `components/charts/WeeklyPaymentsLineChart.tsx`
   - `components/charts/PaymentTypeDonutChart.tsx`

2. Contenedor reusable:
   - Card con título/subtítulo
   - Estados: loading/empty/error

# API / Agregación de datos
1. Reusar endpoints existentes cuando sea posible.
2. Si falta agregación, crear endpoint de resumen (ejemplos):
   - `/api/finances/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=week`
   - `/api/finances/summary?groupBy=type`

Recomendación: devolver payload ya agregado para evitar computar en cliente.

# Checklist responsive (móvil/desktop)
1. Contenedor:
   - Usar `w-full` y `min-w-0` en wrappers flex.
   - Evitar `w-[...]` fijo en contenedores del gráfico.

2. Recharts:
   - Envolver en `ResponsiveContainer width="100%" height={...}`.
   - Ajustar `margin` para que labels no se corten.
   - Rotar/recortar labels si hace falta en móvil.

3. Tooltips:
   - En móvil, preferir tooltip simple y sin overflow.

4. Prueba de overflow:
   - En DevTools mobile, activar “Show layout shift regions” y revisar scroll lateral.

# Checklist de validación de datos
- Fechas:
  - Mostrar `DD-MM-YYYY` y semanas `DD-MM-YYYY al DD-MM-YYYY`.
- Moneda:
  - Formateo consistente (mismo utilitario que reportes).

# Pruebas finales
1. Desktop:
   - `/dashboard/finances` carga y renderiza rápido.

2. Mobile:
   - Sin scroll horizontal.
   - Tooltips usables.

3. Regression:
   - Export PDF/Excel sigue funcionando.

# Entregables
- 2 gráficos iniciales en Finanzas.
- Estructura preparada para replicar en Reportes.
- Responsive verificado móvil/desktop.
