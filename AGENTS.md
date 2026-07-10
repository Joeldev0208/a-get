# AGET - Especificación Técnica para Agentes IA

<!-- BEGIN:nextjs-agent-rules -->
# ⚠️ Next.js 16 (Breaking Changes)
This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 📋 Índice

1. [Contexto del Proyecto](#1-contexto-del-proyecto)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Base de Datos - Supabase](#4-base-de-datos---supabase)
5. [Tipos y Servicios Existentes](#5-tipos-y-servicios-existentes)
6. [Especificación de Nuevos Cambios (Aspec-first)](#6-especificación-de-nuevos-cambios-aspec-first)
   - [6.1 POS - UI de Productos como Lista](#61-pos---ui-de-productos-como-lista)
   - [6.2 Ventas - Clientes con Búsqueda y Estilos](#62-ventas---clientes-con-búsqueda-y-estilos)
   - [6.3 Ventas - Facturas con Búsqueda por Código](#63-ventas---facturas-con-búsqueda-por-código)
   - [6.4 Eliminar Módulo de Facturación (duplicado)](#64-eliminar-módulo-de-facturación-duplicado)
   - [6.5 Tareas - CRUD Completo de Proyectos y Tareas](#65-tareas---crud-completo-de-proyectos-y-tareas)
7. [Orden de Implementación](#7-orden-de-implementación)

---

## 1. Contexto del Proyecto

**AGET** es un sistema SaaS de gestión PYME (ERP) construido con Next.js 16 + Supabase (PostgreSQL). Es multiempresa: cada registro está filtrado por `empresa_id`. El sistema maneja:

- **Inventario**: productos, categorías, importación CSV
- **Ventas/POS**: punto de venta con carrito, facturación, pagos
- **Ventas Clientes**: CRUD de clientes dentro del módulo ventas
- **Ventas Facturas**: facturas con detalles, pagos, NCF
- **RRHH**: empleados, departamentos, asistencia
- **Tareas/Proyectos**: proyectos con tablero Kanban, tareas, comentarios
- **Configuración**: empresa, usuarios/roles
- **Sesiones**: gestión de sesiones de caja/trabajo

**Estado actual:** Todas las implementaciones previas (FASE 1-4) están completadas. Los siguientes cambios son una nueva iteración de mejoras.

---

## 2. Estructura del Proyecto

```
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Layout del dashboard
│   │   ├── inicio/page.tsx               # Dashboard principal (INICIO)
│   │   ├── inventario/
│   │   │   ├── csv/page.tsx              # Importación CSV
│   │   │   └── productos/page.tsx        # CRUD productos
│   │   ├── rrhh/
│   │   │   ├── asistencia/page.tsx       # Registro asistencia
│   │   │   ├── departamentos/page.tsx    # CRUD departamentos
│   │   │   └── empleados/page.tsx        # CRUD empleados (unificado)
│   │   ├── sesiones/page.tsx             # Gestión de sesiones
│   │   ├── tareas/
│   │   │   ├── proyectos/page.tsx        # Proyectos + Kanban unificado
│   │   │   └── tablero/page.tsx          # (obsoleto, mantener por compatibilidad)
│   │   └── ventas/
│   │       ├── clientes/page.tsx         # CRUD clientes con buscador
│   │       ├── facturas/page.tsx         # Lista facturas con buscador
│   │       ├── pagos/page.tsx            # Lista de pagos
│   │       └── pos/page.tsx              # Punto de venta (productos en lista)
│   ├── auth/callback/route.ts            # Auth callback Supabase
│   ├── layout.tsx                        # Root layout
│   ├── login/page.tsx                    # Login page
│   └── page.tsx                          # Landing page
├── components/
│   ├── Dashboard.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Sidebar.tsx
│   │   └── layout.module.css
│   ├── rrhh/
│   │   ├── EmpleadoForm.tsx
│   │   ├── DepartamentoForm.tsx
│   │   └── AsistenciaForm.tsx
│   ├── sesiones/
│   │   └── SesionForm.tsx
│   ├── tareas/
│   │   ├── ProyectoSidebar.tsx
│   │   ├── TareaCard.tsx
│   │   └── KanbanBoard.tsx
│   └── ui/
│       ├── Auth.tsx
│       ├── AuthProvider.tsx
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBox.tsx
│       ├── FormField.tsx
│       ├── Loading.tsx
│       ├── Modal.tsx
│       └── SubmitButton.tsx
├── lib/
│   ├── services/
│   │   ├── empresa.ts                    # Perfil, roles (auto-creación de perfil)
│   │   ├── facturacion.ts                # Clientes, facturas, pagos (browser client)
│   │   ├── facturacion.service.ts        # (alternativo, mantener)
│   │   ├── inventario.ts                 # Productos, categorías, CSV
│   │   ├── rrhh.service.ts               # Empleados, departamentos, asistencia
│   │   ├── sesiones.service.ts            # CRUD de sesiones
│   │   ├── supabase-service.ts           # Clase base ServiceError
│   │   └── tareas.service.ts             # Proyectos, tareas
│   ├── supabase/
│   │   ├── middleware.ts
│   │   └── server.ts                     # Cliente Supabase server
│   ├── types/
│   │   ├── empresa.ts                    # Empresa, PerfilUsuario, Roles
│   │   ├── facturacion.ts                # Cliente, Factura, Detalle, Pago
│   │   ├── inventario.ts                 # Categoria, Producto, CSV
│   │   ├── rrhh.ts                       # Empleado, Departamento, Asistencia
│   │   ├── sesiones.ts                   # Sesion, SesionInput
│   │   └── tareas.ts                     # Proyecto, Tarea, Comentario
│   ├── supabase.ts                       # Cliente Supabase browser
│   └── utils.ts
├── supabase-schema.sql                   # Schema completo BD
├── package.json
├── next.config.ts
└── AGENTS.md                             # ← ESTE ARCHIVO
```

---

## 3. Stack Tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 16.2.9 | Framework React (App Router) |
| React | 19.2.4 | UI Library |
| TypeScript | 5.x | Tipado estático |
| Supabase JS | 2.108.2 | Cliente DB + Auth (SSR) |
| Supabase SSR | 0.12.0 | Auth server-side |
| Tailwind CSS | 4.x | Estilos utilitarios |
| Lucide React | 1.20.0 | Iconos |
| clsx + tailwind-merge | - | Utilidades CSS |
| @dnd-kit | 6/9/10 | Drag & drop (Kanban) |

**Patrón de componentes:** `"use client"` (todos los componentes de página son Client Components). Los servicios (`lib/services/`) usan `supabase` de `@/lib/supabase` (browser client). **NO usar** `createClient()` de server en servicios llamados desde Client Components.

**Convenciones:**
- Las páginas están en `app/(dashboard)/[modulo]/[submodulo]/page.tsx`
- Los tipos están en `lib/types/[modulo].ts`
- Los servicios están en `lib/services/[modulo].ts`
- Los componentes UI reutilizables están en `components/ui/`
- Los componentes específicos de módulo están en `components/[modulo]/`

---

## 4. Base de Datos - Supabase

El schema completo está en `supabase-schema.sql`. Tablas clave:

| Tabla | Columnas clave |
|-------|---------------|
| `empresas` | id, nombre, codigo_unico |
| `perfiles_usuario` | id, user_id, empresa_id, rol (enum), activo |
| `categorias` | id, empresa_id, nombre, descripcion |
| `productos` | id, empresa_id, categoria_id, codigo, nombre, precio_venta, costo, stock, activo |
| `clientes` | id, empresa_id, nombre, email, telefono, direccion, rnc_cedula |
| `facturas` | id, empresa_id, numero, cliente_id, subtotal, impuesto, total, estado (enum), fecha_emision, fecha_vencimiento |
| `detalles_factura` | id, factura_id, producto_id, descripcion, cantidad, precio_unitario, total |
| `pagos` | id, empresa_id, factura_id, monto, metodo (enum), referencia, fecha_pago |
| `departamentos` | id, empresa_id, nombre, descripcion |
| `empleados` | id, empresa_id, nombre, email, puesto, salario, activo, departamento_id |
| `asistencia` | id, empresa_id, empleado_id, fecha, estado (enum), hora_entrada, hora_salida |
| `sesiones` | id, empresa_id, usuario_id, fecha_apertura, fecha_cierre, estado (enum), total_inicial, total_final |
| `proyectos` | id, empresa_id, nombre, descripcion, estado (enum), prioridad (enum), fecha_inicio, fecha_fin, responsable_id |
| `tareas` | id, empresa_id, proyecto_id, titulo, descripcion, columna (enum), prioridad, orden, asignado_id, fecha_limite |
| `comentarios` | id, tarea_id, contenido, autor_id |

**Enums:** `rol_usuario`, `estado_factura`, `metodo_pago`, `estado_asistencia`, `estado_sesion`, `estado_proyecto`, `prioridad`, `columna_kanban`

**Todas las tablas tienen** `empresa_id` para multiempresa y RLS habilitado.

**Nota importante:** La tabla `perfiles_usuario` tiene columna `nombre` (TEXT, opcional) para mostrar el nombre del usuario. No tiene columna `email`.

---

## 5. Tipos y Servicios Existentes

### Ubicación de tipos:
- `lib/types/empresa.ts` → `Empresa`, `EmpresaInput`, `PerfilUsuario`, `PerfilUsuarioInput`, `RolUsuario`, `ROLES_LABELS`
- `lib/types/inventario.ts` → `Categoria`, `CategoriaInput`, `Producto`, `ProductoInput`, `ProductoCSV`
- `lib/types/facturacion.ts` → `Cliente`, `ClienteInput`, `Factura`, `FacturaInput`, `FacturaConCliente`, `DetalleFactura`, `DetalleFacturaInput`, `Pago`, `PagoInput`, `PagoConFactura`, `EstadoFactura`, `MetodoPago`
- `lib/types/rrhh.ts` → `Empleado`, `EmpleadoInput`, `EmpleadoConDepartamento`, `Departamento`, `Asistencia`, `AsistenciaConEmpleado`, `EstadoAsistencia`
- `lib/types/sesiones.ts` → `Sesion`, `SesionInput`, `EstadoSesion`
- `lib/types/tareas.ts` → `Proyecto`, `ProyectoInput`, `Tarea`, `TareaInput`, `TareaConAsignado`, `ColumnaKanban`, `Comentario`

### Servicios clave:
- `lib/services/empresa.ts` → `obtenerPerfilActual()` (auto-crea perfil si no existe)
- `lib/services/inventario.ts` → `listarProductos(empresaId)`, `crearProducto()`, `actualizarProducto()`, `importarProductosCSV()`, `listarCategorias()`, etc.
- `lib/services/facturacion.ts` → `listarClientes(empresaId)`, `crearCliente()`, `crearFactura()` (con detalles), `listarFacturas()`, `listarPagos()`
- `lib/services/facturacion.service.ts` → Versión sin `empresaId` (alternativa)
- `lib/services/rrhh.service.ts` → `listarEmpleados()`, `crearEmpleado()`, `actualizarEmpleado()`, `eliminarEmpleado()`, `listarDepartamentos()`, `registrarAsistencia()`, etc.
- `lib/services/sesiones.service.ts` → `abrirSesion()`, `cerrarSesion()`, `listarSesiones()`, `obtenerSesion()`
- `lib/services/tareas.service.ts` → `listarProyectos()`, `crearProyecto()`, `listarTareas()`, `crearTarea()`, `moverTarea()`, `eliminarTarea()`, etc.

### Componentes UI existentes:
- `Modal.tsx` - Modal reutilizable con overlay, animación, cierre con Escape/clic fuera
- `FormField.tsx` - Campo de formulario (input, select, textarea) con label y error
- `SubmitButton.tsx` - Botón con estado loading
- `ConfirmDialog.tsx` - Diálogo de confirmación con skipKey
- `Loading.tsx`, `ErrorBox.tsx`, `EmptyState.tsx` - Estados de carga/error/vacío
- `PageHeader.tsx` - Encabezado de página con slot `actions`

---

## 6. Especificación de Nuevos Cambios (Aspec-first)

### 6.1 POS - UI de Productos como Lista

**Archivo a modificar:** `app/(dashboard)/ventas/pos/page.tsx`

**Objetivo:** Cambiar la vista de productos en el POS de grid (tarjetas) a una **lista** y eliminar el selector de cliente ("Seleccionar cliente").

#### Cambios en la UI del POS:

1. **Productos en formato lista:**
   - Reemplazar el grid de 3 columnas por una **lista vertical** (tabla o filas apiladas)
   - Cada fila debe mostrar: Código, Nombre, Precio, Stock
   - Al hacer clic en una fila, se agrega el producto al carrito (igual que antes)
   - La lista debe ser más compacta que las tarjetas actuales

   **Estructura sugerida:**
   ```tsx
   <div className="flex-1 overflow-y-auto">
     <table className="w-full text-sm">
       <thead>
         <tr>
           <th>Código</th>
           <th>Nombre</th>
           <th>Precio</th>
           <th>Stock</th>
         </tr>
       </thead>
       <tbody>
         {filteredProductos.map((p) => (
           <tr key={p.id} onClick={() => addToCart(p)} className="cursor-pointer hover:bg-gray-50">
             <td>{p.codigo}</td>
             <td>{p.nombre}</td>
             <td>${p.precio_venta}</td>
             <td>{p.stock}</td>
           </tr>
         ))}
       </tbody>
     </table>
   </div>
   ```

2. **Eliminar selector de cliente:**
   - Remover el `<select>` de "Seleccionar cliente..." del panel derecho del carrito
   - Si se necesita cliente, se puede agregar después o usar un cliente por defecto

3. **Conservar funcionalidades existentes:**
   - Código de carrito CLI3103XXX
   - Impresión de ticket al cobrar
   - Carrito con items, cantidades, totales
   - Búsqueda de productos

---

### 6.2 Ventas - Clientes con Búsqueda y Estilos

**Archivo a modificar:** `app/(dashboard)/ventas/clientes/page.tsx`

**Objetivo:** Agregar los mismos estilos de tabla que tiene `facturacion/clientes/page.tsx` y añadir un buscador por nombre de cliente.

#### Cambios necesarios:

1. **Estilos consistentes:**
   - Usar los mismos estilos de tabla que las páginas de facturación (bordes redondeados, sombra, hover, etc.)
   - Botones con los mismos colores y estilos (bg-blue-600, rounded-lg, etc.)
   - Misma estructura de PageHeader

2. **Buscador por nombre:**
   - Input de búsqueda en tiempo real que filtre por nombre del cliente
   - Mostrar "No se encontraron clientes" si no hay resultados
   - Al presionar Enter, abrir modal de edición del primer resultado (si existe `actualizarCliente()` en el servicio)

3. **Componentes a usar:**
   - `Loading.tsx`, `ErrorBox.tsx`, `EmptyState.tsx` para estados
   - `Modal.tsx` para crear/editar cliente
   - `FormField.tsx`, `SubmitButton.tsx` para formularios

4. **Funcionalidad completa:**
   - Crear cliente (ya existe)
   - Editar cliente (usar `actualizarCliente()` si existe en el servicio o agregarlo)
   - Eliminar cliente con ConfirmDialog

---

### 6.3 Ventas - Facturas con Búsqueda por Código

**Archivo a modificar:** `app/(dashboard)/ventas/facturas/page.tsx`

**Objetivo:** Agregar buscador por código/número de factura con los mismos estilos que la página de facturación.

#### Cambios necesarios:

1. **Estilos consistentes:**
   - Igual que 6.2, usar los estilos de tabla de facturación
   - Tabla con bordes redondeados, sombra, hover

2. **Buscador por código:**
   - Input que filtre por número de factura (ej: "FAC-000001")
   - También debe buscar por nombre del cliente asociado
   - Filtrado en tiempo real

3. **Mantener funcionalidades existentes:**
   - Lista de facturas con columnas: Número, Cliente, Emisión, Vencimiento, Total, Estado, Acciones
   - Botón de reimpresión (Printer)
   - Botón de eliminar

---

### 6.4 Eliminar Módulo de Facturación (duplicado)

**Objetivo:** Eliminar el módulo duplicado de facturación en `app/(dashboard)/facturacion/` ya que existe en `app/(dashboard)/ventas/`.

#### Archivos a modificar/eliminar:

1. **Sidebar (`components/layout/Sidebar.tsx`):**
   - Eliminar la sección "Facturación" del menú de navegación
   - Mantener solo la sección "Ventas" que ya contiene Clientes, Facturas y Pagos

2. **Archivos a marcar como obsoletos (NO eliminar, mantener por compatibilidad):**
   - `app/(dashboard)/facturacion/clientes/page.tsx`
   - `app/(dashboard)/facturacion/facturas/page.tsx`
   - `app/(dashboard)/facturacion/pagos/page.tsx`
   - `app/(dashboard)/facturacion/page.tsx`

3. **Acción:** Solo eliminar del Sidebar las rutas de facturación. Los archivos se mantienen pero dejan de ser accesibles desde la navegación principal.

---

### 6.5 Tareas - CRUD Completo de Proyectos y Tareas

**Archivo a modificar:** `app/(dashboard)/tareas/proyectos/page.tsx`

**Objetivo:** Agregar funcionalidad CRUD completa para proyectos y tareas dentro de la vista unificada (Sidebar + Kanban).

#### Funcionalidades CRUD a agregar:

1. **Proyectos (ya existe crear, falta editar y eliminar):**
   - **Editar proyecto:** Modal que permita modificar nombre, descripción, estado, prioridad, responsable
   - **Eliminar proyecto:** Botón con ConfirmDialog en el sidebar (hover sobre el proyecto)
   - **Estado del proyecto:** Poder cambiar entre activo/pausado/completado/cancelado

2. **Tareas (ya existe crear y mover, falta editar y eliminar):**
   - **Editar tarea:** Hacer clic en una tarjeta de tarea abre modal de edición con:
     - Título, descripción, prioridad, asignado, fecha límite
     - También permitir cambiar la columna desde el modal
   - **Eliminar tarea:** Botón dentro del modal de edición o al hacer clic derecho/largo
   - **Ver comentarios:** Sección dentro del modal de tarea para ver/agregar comentarios

3. **Mejoras en el Kanban:**
   - Mostrar contador de tareas por columna (ya existe)
   - Al hacer drag & drop, actualizar columna en DB (ya existe con `moverTarea()`)
   - Refrescar tareas automáticamente después de crear/editar/eliminar

4. **Componentes a crear:**
   - `components/tareas/ProyectoEditModal.tsx` — Modal de edición de proyecto
   - `components/tareas/TareaEditModal.tsx` — Modal de edición de tarea (con comentarios)
   - O reutilizar los modales existentes dentro de la página de proyectos

5. **Servicios a usar (ya existen):**
   - `actualizarProyecto(id, partial)` — Para editar proyecto
   - `eliminarProyecto(id)` — Para eliminar proyecto
   - `actualizarTarea(id, partial)` — Para editar tarea
   - `eliminarTarea(id)` — Para eliminar tarea
   - `listarComentarios(tareaId)` — Para ver comentarios
   - `crearComentario(input)` — Para agregar comentarios

---

## 7. Orden de Implementación

```
ITERACIÓN ACTUAL - ASEC-FIRST
[x] 1. POS: cambiar productos a lista + eliminar selector de cliente
[x] 2. Ventas/Clientes: estilos consistentes + buscador por nombre
[x] 3. Ventas/Facturas: estilos consistentes + buscador por código
[x] 4. Sidebar: eliminar sección Facturación (módulo duplicado)
[x] 5. Tareas: CRUD completo (editar/eliminar proyectos y tareas + comentarios)
[x] 6. Mi Empresa: corrección tipos, estilos, unificar Usuarios y Roles
[x] 7. Agregar columna nombre a perfiles_usuario
```

## 8. Migraciones SQL Pendientes

Después de actualizar el código, ejecutar en **Supabase SQL Editor**:

```sql
-- Agregar columna nombre a perfiles_usuario
ALTER TABLE perfiles_usuario 
ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Asignar nombres a usuarios existentes
UPDATE perfiles_usuario 
SET nombre = 'Usuario ' || LEFT(user_id::text, 8)
WHERE nombre IS NULL;

-- Agregar columna empresa_id a facturas
ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_facturas_empresa ON facturas(empresa_id);

-- Actualizar facturas existentes con la empresa del cliente
UPDATE facturas f
SET empresa_id = c.empresa_id
FROM clientes c
WHERE f.cliente_id = c.id
AND f.empresa_id IS NULL;
```

---

## Notas para el Agente IA

1. **Next.js 16**: Antes de escribir código, verifica las API de Next.js 16 en `node_modules/next/dist/docs/`. Especial atención a cambios en metadata, layouts, y server components.

2. **Cliente Supabase browser**: Todos los servicios deben usar `import { supabase } from "@/lib/supabase"` (browser client). **NO usar** `createClient()` de server en servicios llamados desde Client Components.

3. **Multiempresa**: Todas las queries deben filtrar por `empresa_id`. Usar `obtenerPerfilActual()` para obtener el ID de empresa del usuario logueado.

4. **Estilos**: Usar Tailwind CSS v4. Clases utilitarias. No usar CSS modules nuevos (solo existe `layout.module.css`).

5. **Componentes reutilizables**: Usar Modal, FormField, SubmitButton, ConfirmDialog de `components/ui/`. No recrearlos.

6. **Manejo de errores**: Usar `ServiceError` de `lib/services/supabase-service.ts` para errores consistentes.

7. **Estados de UI**: Toda página debe manejar: loading (`<Loading />`), error (`<ErrorBox error={error} onRetry={fn} />`), empty (`<EmptyState />`), y datos.

8. **Roles**: Verificar rol del usuario con `obtenerPerfilActual()` antes de mostrar acciones de edición/eliminación.

9. **Auto-creación de perfil**: `obtenerPerfilActual()` ya crea automáticamente empresa y perfil si no existen. No necesita lógica adicional para primer inicio de sesión.

10. **Tabla perfiles_usuario**: NO tiene columna `email`. No intentar insertar ese campo.