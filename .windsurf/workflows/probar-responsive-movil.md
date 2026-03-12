---
description: Probar y validar responsive en móviles
---

# Objetivo
Validar que BlasRodríguez se vea y funcione bien en teléfonos móviles (UI responsive + usabilidad táctil) y detectar problemas comunes (overflow, targets pequeños, modales cortados, tablas inmanejables, etc.).

# Alcance
- Login / Logout
- Dashboard (layout + sidebar)
- Finanzas (tabla, filtros, modales, export)
- Mantenimientos (tabla y formularios)
- Vehículos / Conductores

# Preparación
1. Inicia el servidor local.
   - Ejecuta `npm run dev`.
2. Abre el sitio en el navegador.
3. Asegúrate de tener datos de prueba (vehículos, conductores y algunos pagos) para ver tablas con scroll.

# Pruebas en DevTools (rápidas)
## A. Modo dispositivo (Chrome/Edge)
1. Abre DevTools.
2. Activa la barra de dispositivos (Toggle device toolbar).
3. Prueba al menos estos tamaños:
   - 360x800 (Android típico)
   - 390x844 (iPhone 12/13/14)
   - 414x896 (iPhone Plus/Max)
   - 768x1024 (tablet)
4. Prueba orientaciones:
   - Portrait
   - Landscape

## B. Checklist visual (por pantalla)
### 1) Login (`/login`)
- El formulario no debe salirse de pantalla.
- Botones deben ser fáciles de tocar (mínimo ~44px de alto).
- Campos con `type=password/email` visibles y sin zoom raro.

### 2) Dashboard layout (`/dashboard/*`)
- Sidebar:
  - En móvil debe ser usable. Si queda fijo ocupando 256px, puede romper la UX (se verá muy estrecho).
  - Verifica que el contenido no quede cortado.
- Contenido principal:
  - No debe haber scroll horizontal global.

### 3) Finanzas (`/dashboard/finances`)
- KPI cards:
  - Deben apilar bien.
- Filtros:
  - Inputs/selects deben ocupar ancho completo.
- Tabla:
  - Debe ser scrollable horizontal dentro del contenedor (no en toda la página).
  - Columnas legibles.
- Modales (Registrar/Editar):
  - No deben quedar cortados.
  - Deben permitir scroll interno si el alto del dispositivo es bajo.
- Botones Export:
  - Deben verse sin romper layout.

### 4) Mantenimientos / Vehículos / Conductores
- Tablas:
  - Igual que Finanzas: scroll horizontal local.
- Formularios:
  - Inputs y selects a 100%.

## C. Checklist funcional (táctil)
- Tap en botones pequeños (Editar/Eliminar):
  - Si cuesta tocar, aumentar padding.
- Confirmaciones:
  - Confirm delete debe ser claro en móvil.
- Navegación:
  - Links accesibles.

# Pruebas en dispositivo real (recomendado)
## Opción 1: misma red (LAN)
1. Obtén tu IP local.
2. Levanta el servidor en 0.0.0.0 si aplica.
3. En el teléfono abre `http://TU_IP:3000`.
4. Prueba scroll, taps, teclado y orientación.

## Opción 2: producción
1. Abre `https://blasrodriguez.vercel.app` en el teléfono.
2. Repite el checklist funcional.

# Cómo detectar problemas comunes
## 1) Scroll horizontal global
- Síntoma: aparece un scroll lateral en toda la página.
- Causa típica: un contenedor o tabla excede ancho.
- Acción:
  - Inspecciona el elemento más ancho.
  - En tablas: envolver con `overflow-x-auto`.

## 2) Sidebar fija en mobile
- Síntoma: el contenido queda muy comprimido.
- Acción:
  - Implementar sidebar colapsable (hamburger) para < `md`.

## 3) Modales cortados
- Síntoma: no se ve el botón de guardar/cerrar.
- Acción:
  - Agregar `max-h-[90vh]` + `overflow-y-auto` al contenedor del modal.

## 4) Targets táctiles pequeños
- Síntoma: cuesta tocar iconos.
- Acción:
  - Aumentar padding y tamaño mínimo.

# Criterios de aceptación
- No hay scroll horizontal global en pantallas < 420px.
- Formularios y modales son utilizables sin zoom.
- Tablas son navegables (scroll horizontal local) y no rompen layout.
- Botones y acciones son tocables.
- Login/Logout funcionan correctamente desde móvil.

# Evidencia
- Capturas por cada pantalla clave en 390x844 (portrait) y 844x390 (landscape).
- Lista de issues encontrados con:
  - URL
  - tamaño de pantalla
  - pasos
  - comportamiento esperado vs actual
  - captura
