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
6. [Especificación de Módulos a Modificar/Crear](#6-especificación-de-módulos-a-modificarcrear)
   - [6.1 Organización de Modelos - Módulo de Sesiones](#61-organización-de-modelos---módulo-de-sesiones)
   - [6.2 Inicio - Análisis de Ventas](#62-inicio---análisis-de-ventas)
   - [6.3 RRHH - Unificación y Mejoras](#63-rrhh---unificación-y-mejoras)
   - [6.4 Inventario - UI y Búsqueda de Productos](#64-inventario---ui-y-búsqueda-de-productos)
   - [6.5 Importación CSV a JSON → Supabase](#65-importación-csv-a-json--supabase)
   - [6.6 Punto de Venta - Código de Carrito](#66-punto-de-venta---código-de-carrito)
   - [6.7 Facturación - Impresión y Reimpresión](#67-facturación---impresión-y-reimpresión)
   - [6.8 Módulo de Facturas - Búsqueda y Modificación](#68-módulo-de-facturas---búsqueda-y-modificación)
   - [6.9 Proyectos - Vista Calendar + Kanban](#69-proyectos---vista-calendar--kanban)
7. [Orden de Implementación](#7-orden-de-implementación)

---

## 1. Contexto del Proyecto

**AGET** es un sistema SaaS de gestión PYME (ERP) construido con Next.js 16 + Supabase (PostgreSQL). Es multiempresa: cada registro está filtrado por `empresa_id`. El sistema maneja:

- **Inventario**: productos, categorías, importación CSV
- **Ventas/POS**: punto de venta con carrito, facturación, pagos
- **Facturación**: clientes, facturas con detalles, pagos, NCF
- **RRHH**: empleados, departamentos, asistencia
- **Tareas/Proyectos**: proyectos con tablero Kanban, tareas, comentarios
- **Configuración**: empresa, usuarios/roles

---

## 2. Estructura del Proyecto

```
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Layout del dashboard
│   │   ├── facturacion/
│   │   │   ├── page.tsx                  # Dashboard facturación
│   │   │   ├── clientes/page.tsx         # CRUD clientes
│   │   │   ├── facturas/page.tsx         # Lista de facturas
│   │   │   └── pagos/page.tsx            # Lista de pagos
│   │   ├── inicio/page.tsx               # Dashboard principal (INICIO)
│   │   ├── inventario/
│   │   │   ├── csv/page.tsx              # Importación CSV
│   │   │   └── productos/page.tsx        # CRUD productos
│   │   ├── rrhh/
│   │   │   ├── asistencia/page.tsx       # Registro asistencia
│   │   │   ├── departamentos/page.tsx    # CRUD departamentos
│   │   │   └── empleados/page.tsx        # CRUD empleados
│   │   ├── tareas/
│   │   │   ├── proyectos/page.tsx        # Lista proyectos
│   │   │   └── tablero/page.tsx          # Kanban por proyecto
│   │   └── ventas/
│   │       ├── clientes/page.tsx         # (ruta alternativa)
│   │       ├── facturas/page.tsx         # (ruta alternativa)
│   │       ├── pagos/page.tsx            # (ruta alternativa)
│   │       └── pos/page.tsx              # Punto de venta
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
│   │   ├── EmpleadoForm.tsx              # (existente en plan anterior)
│   │   ├── DepartamentoForm.tsx          # (existente en plan anterior)
│   │   └── AsistenciaForm.tsx            # (existente en plan anterior)
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
│   │   ├── empresa.ts                    # Perfil, roles
│   │   ├── facturacion.ts                # Clientes, facturas, pagos
│   │   ├── facturacion.service.ts        # (alternativo)
│   │   ├── inventario.ts                 # Productos, categorías, CSV
│   │   ├── rrhh.service.ts               # Empleados, departamentos, asistencia
│   │   ├── supabase-service.ts           # Clase base ServiceError
│   │   └── tareas.service.ts             # Proyectos, tareas
│   ├── supabase/
│   │   ├── middleware.ts
│   │   └── server.ts                     # Cliente Supabase server
│   ├── types/
│   │   ├── empresa.ts                    # Empresa, PerfilUsuario, Roles
│   │   ├── facturacion.ts                # Cliente, Factura, Detalle, Pago
│   │   └── inventario.ts                 # Categoria, Producto, CSV
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

**Patrón de componentes:** `"use client"` (todos los componentes de página son Client Components). Los servicios (`lib/services/`) son funciones asíncronas que usan `createClient()` de Supabase.

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
| `proyectos` | id, empresa_id, nombre, descripcion, estado (enum), prioridad (enum), fecha_inicio, fecha_fin, responsable_id |
| `tareas` | id, empresa_id, proyecto_id, titulo, descripcion, columna (enum), prioridad, orden, asignado_id, fecha_limite |
| `comentarios` | id, tarea_id, contenido, autor_id |

**Enums:** `rol_usuario`, `estado_factura`, `metodo_pago`, `estado_asistencia`, `estado_proyecto`, `prioridad`, `columna_kanban`

**Todas las tablas tienen** `empresa_id` para multiempresa y RLS habilitado.

---

## 5. Tipos y Servicios Existentes

### Ubicación de tipos:
- `lib/types/empresa.ts` → `Empresa`, `EmpresaInput`, `PerfilUsuario`, `PerfilUsuarioInput`, `RolUsuario`, `ROLES_LABELS`
- `lib/types/inventario.ts` → `Categoria`, `CategoriaInput`, `Producto`, `ProductoInput`, `ProductoCSV`
- `lib/types/facturacion.ts` → `Cliente`, `ClienteInput`, `Factura`, `FacturaInput`, `FacturaConCliente`, `DetalleFactura`, `DetalleFacturaInput`, `Pago`, `PagoInput`, `PagoConFactura`, `EstadoFactura`, `MetodoPago`

### Servicios clave:
- `lib/services/empresa.ts` → `obtenerPerfilActual()`
- `lib/services/inventario.ts` → `listarProductos(empresaId)`, `crearProducto()`, `actualizarProducto()`, `importarProductosCSV()`, `listarCategorias()`, etc.
- `lib/services/facturacion.ts` → `listarClientes(empresaId)`, `crearCliente()`, `crearFactura()` (con detalles), `listarFacturas()`, `listarPagos()`
- `lib/services/rrhh.service.ts` → `listarEmpleados()`, `crearEmpleado()`, `actualizarEmpleado()`, `eliminarEmpleado()`, `listarDepartamentos()`, etc.
- `lib/services/tareas.service.ts` → `listarProyectos()`, `crearProyecto()`, `listarTareas()`, `crearTarea()`, etc.

### Componentes UI existentes:
- `Modal.tsx` - Modal reutilizable con overlay, animación, cierre con Escape/clic fuera
- `FormField.tsx` - Campo de formulario (input, select, textarea) con label y error
- `SubmitButton.tsx` - Botón con estado loading
- `ConfirmDialog.tsx` - Diálogo de confirmación con skipKey
- `Loading.tsx`, `ErrorBox.tsx`, `EmptyState.tsx` - Estados de carga/error/vacío
- `PageHeader.tsx` - Encabezado de página con slot `actions`

---

## 6. Especificación de Módulos a Modificar/Crear

### 6.1 Organización de Modelos - Módulo de Sesiones

**Objetivo:** Crear un modelo/feature específico para la **generación de sesiones** (posiblemente sesiones de trabajo, sesiones de caja, o sesiones de usuario) para abstraer la complejidad y ahorrar trabajo al usuario.

**Archivos a crear:**
- `lib/types/sesiones.ts` — Tipos para Sesión (id, empresa_id, usuario_id, fecha_apertura, fecha_cierre, estado, total_inicial, total_final, observaciones)
- `lib/services/sesiones.service.ts` — Servicio CRUD para sesiones (`abrirSesion()`, `cerrarSesion()`, `listarSesiones()`)
- `app/(dashboard)/sesiones/page.tsx` — Página de gestión de sesiones
- `components/sesiones/SesionForm.tsx` — Modal formulario de sesión

**Campos sugeridos para Sesión:**
```
id: UUID (PK)
empresa_id: UUID (FK → empresas)
usuario_id: UUID (FK → perfiles_usuario)
fecha_apertura: TIMESTAMPTZ
fecha_cierre: TIMESTAMPTZ (nullable)
estado: ENUM ('abierta', 'cerrada')
total_inicial: DECIMAL(12,2)
total_final: DECIMAL(12,2) (nullable)
observaciones: TEXT (nullable)
created_at, updated_at
```

---

### 6.2 Inicio - Análisis de Ventas

**Archivo a modificar:** `app/(dashboard)/inicio/page.tsx`

**Objetivo:** Agregar al dashboard de inicio un análisis completo de ventas que incluya:

1. **Ganancias totales** del período (facturas pagadas - costos de productos vendidos)
2. **Cálculo de pérdidas** con pagos pendientes/vencidos
3. **Cambio de precios de productos** en el mercado (comparativa histórica)
4. **Compras específicas de la empresa** (productos que la empresa compra regularmente)

**Implementación:**
```typescript
interface AnalisisVentas {
  gananciasTotales: number;
  perdidasEstimadas: number; // facturas vencidas sin pagar
  productosMasVendidos: { nombre: string; cantidad: number; total: number }[];
  productosConCambioPrecio: { nombre: string; precioAnterior: number; precioActual: number; variacion: number }[];
  comprasMensuales: { mes: string; total: number }[];
}
```

**Funciones a agregar en `lib/services/inventario.ts` o nuevo servicio `lib/services/analisis.service.ts`:**
- `obtenerAnalisisVentas(empresaId, fechaInicio, fechaFin)` — Query que cruza facturas, detalles_factura y productos
- `obtenerCambioPrecios(empresaId)` — Historial de cambios de precio por producto
- `obtenerComprasEmpresa(empresaId)` — Productos más comprados/reabastecidos

**UI:** Agregar sección de tarjetas de métricas debajo de las tarjetas existentes, con gráficos simples (barras) usando HTML/CSS puro (sin librerías externas). Incluir:
- Tarjeta de "Ganancias del Mes" (verde)
- Tarjeta de "Pérdidas Estimadas" (roja)
- Tabla de "Productos con Cambio de Precio"
- Tabla de "Top Productos Vendidos"

---

### 6.3 RRHH - Unificación y Mejoras

**Objetivo:** Unificar la experiencia de RRHH en una sola página que integre empleados, departamentos y asistencia.

#### Cambios en `app/(dashboard)/rrhh/empleados/page.tsx`:

**Nueva UI unificada:**
1. **Encabezado** con botones: "Nuevo Empleado", "Gestionar Departamentos", "Asistencia"
2. **Lista de empleados** con las columnas actuales (nombre, email, puesto, departamento, salario, estado, acciones)
3. **Buscador** que filtre por nombre y departamento (input de búsqueda en tiempo real)
4. **Al presionar Enter** en un empleado buscado → redirigir al modal de edición de ese empleado
5. **Botón de eliminar** al lado de cada empleado (ya existe)
6. **Sección de Asistencia** integrada: lista con columnas donde se pueda marcar asistencia desde la misma página

#### Componentes a crear/modificar:

**a) Buscador de empleados** (en la página de empleados):
```tsx
<input
  type="text"
  placeholder="Buscar por nombre o departamento..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && filteredResults.length > 0) {
      // Abrir modal de edición para el primer resultado
      openEditModal(filteredResults[0]);
    }
  }}
/>
```

**b) Lista de Asistencia integrada:**
- Tabla con columnas: Empleado, Fecha, Estado (select: presente/ausente/tarde/permiso), Hora Entrada, Hora Salida
- Cada fila tiene checkbox para marcar
- Botón "Exportar Asistencia" → descarga CSV
- Botón "Importar Asistencia" → subir CSV
- Persistencia en la tabla `asistencia`

**c) Archivos a modificar:**
- `app/(dashboard)/rrhh/empleados/page.tsx` — Agregar buscador, integrar asistencia, unificar vista
- `components/layout/Sidebar.tsx` — Simplificar enlaces: solo "Empleados" en lugar de "Empleados", "Departamentos", "Asistencia" por separado

---

### 6.4 Inventario - UI y Búsqueda de Productos

**Archivo a modificar:** `app/(dashboard)/inventario/productos/page.tsx`

**Objetivo:** Rediseñar la UI de productos para que sea consistente con el resto del sistema (similar a departamentos) y agregar búsqueda avanzada.

**Cambios:**
1. **UI consistente**: usar la misma estructura visual que `app/(dashboard)/rrhh/departamentos/page.tsx` (tabla con las mismas clases, mismo estilo de botones, mismos colores)
2. **Buscador** con dos modos:
   - Por **nombre del producto** (búsqueda textual en tiempo real)
   - Por **código del producto** (búsqueda exacta o parcial)
3. **Al encontrar un producto y presionar Enter** → abrir modal de modificación de ese registro
4. **Acceso desde celular**: asegurar responsive design. La tabla debe colapsar a cards en mobile. Los botones deben ser táctiles (padding mínimo 44px).
5. **Rol de inventario**: el botón "Nuevo Producto" y las acciones de editar/eliminar deben respetar el rol del usuario (`inventario`, `gerente`). Usar `obtenerPerfilActual()`.

**Flujo de búsqueda:**
```
Usuario escribe en el input →
  - Filtra productos en tiempo real por nombre O código
  - Si hay resultados y presiona Enter →
    - Si solo hay 1 resultado → abre modal de edición
    - Si hay múltiples → selecciona el primero o muestra lista para elegir
  - Si no hay resultados → muestra "No se encontraron productos"
```

---

### 6.5 Importación CSV a JSON → Supabase

**Archivo a modificar:** `app/(dashboard)/inventario/csv/page.tsx`

**Objetivo:** Agregar una función que transforme archivos CSV subidos por el usuario a JSON, y luego inserte ese JSON en Supabase como registros en la tabla `productos`.

**Flujo actual (en `lib/services/inventario.ts` → `importarProductosCSV()`):**
- Ya existe `ProductoCSV` (interface con codigo, nombre, descripcion, categoria, precio_venta, costo, stock)
- La función recibe un array de productos y los inserta uno por uno, creando categorías automáticamente si no existen

**Mejora necesaria:**
1. En la página CSV, agregar un **paso intermedio**: el usuario sube el archivo → se parsea a JSON → se muestra preview en tabla editable → usuario confirma → se envía a Supabase
2. Función `csvToJson(csvContent: string): ProductoCSV[]` que convierta el texto CSV a array de objetos
3. Preview de datos antes de insertar (tabla editable con los campos mapeados)
4. Botón "Confirmar Importación" que llama a `importarProductosCSV()` con los datos del preview

**Detalles técnicos:**
```typescript
function csvToJson(csvContent: string): ProductoCSV[] {
  // Parsear CSV: split por saltos de línea, split por comas
  // Mapear columnas esperadas:
  //   codigo, nombre, descripcion, categoria, precio_venta, costo, stock
  // Retornar array de ProductoCSV
}
```

**UI de la página CSV:**
- Paso 1: Subir archivo (drag & drop o file input)
- Paso 2: Preview en tabla editable (mostrar datos parseados)
- Paso 3: Confirmar importación
- Mostrar resultado: "X insertados, Y errores"

---

### 6.6 Punto de Venta - Código de Carrito

**Archivo a modificar:** `app/(dashboard)/ventas/pos/page.tsx`

**Objetivo:** Generar un código único aleatorio para cada compra/carrito, similar a "CLI3103139", que se incremente de 3 en 3 en los dígitos posteriores.

**Formato del código:** `CLI` + número secuencial que avanza de 3 en 3.
- Ejemplo: CLI3103139, CLI3103142, CLI3103145...
- El código se genera automáticamente al iniciar un nuevo carrito (o al abrir la página POS)
- Se muestra en la parte superior del carrito

**Implementación:**
```typescript
function generarCodigoCarrito(): string {
  const prefix = "CLI3103";
  // Obtener el último número usado (de localStorage o consulta a DB)
  const ultimoNumero = parseInt(localStorage.getItem("ultimo_codigo_pos") || "139");
  const nuevoNumero = ultimoNumero + 3;
  localStorage.setItem("ultimo_codigo_pos", nuevoNumero.toString());
  return `${prefix}${nuevoNumero}`;
}
```

**Visual:** Agregar en el header del carrito (panel derecho):
```
Código: CLI3103139
```

---

### 6.7 Facturación - Impresión y Reimpresión

**Archivos a modificar:**
- `app/(dashboard)/ventas/pos/page.tsx` — Agregar impresión después del cobro
- `app/(dashboard)/ventas/facturas/page.tsx` y/o `app/(dashboard)/facturacion/facturas/page.tsx` — Botón de reimpresión

**Objetivo:** Implementar impresión de facturas en impresora térmica (formato ticket) y guardar versión digital simultáneamente.

**Flujo de impresión:**
1. Al realizar el cobro en POS:
   - Se genera la factura en DB (ya existe)
   - Se genera el formato HTML para ticket de factura (80mm de ancho)
   - Se imprime automáticamente usando `window.print()` o API de impresión
   - Se guarda una copia digital en localStorage o como PDF

2. **Botón de reimpresión** en la lista de facturas:
   - Columna "Acciones" con botón de impresión
   - Al hacer clic, abre vista previa de la factura e invoca impresión

**Formato del ticket:**
```
================================
         AGET - EMPRESA
       [nombre de empresa]
       RNC: [rnc_cedula]
================================
Factura: FAC-000001
Cliente: [nombre]
Fecha: [fecha]
================================
 Código  Descripción    Qty  Precio
--------------------------------
 PRO-01  Producto A      2    $100
 PRO-02  Producto B      1    $50
--------------------------------
Subtotal:                    $250
ITBIS (18%):                 $45
TOTAL:                       $295
================================
 ¡Gracias por su compra!
================================
```

**Implementación:**
```typescript
function imprimirFactura(factura: FacturaConCliente, detalles: DetalleFactura[]) {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  printWindow?.document.write(`
    <html>
      <head><style>body { font-family: monospace; font-size: 12px; width: 80mm; }</style></head>
      <body>
        <!-- contenido del ticket -->
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
}
```

---

### 6.8 Módulo de Facturas - Búsqueda y Modificación

**Archivo a modificar:** `app/(dashboard)/facturacion/facturas/page.tsx`

**Objetivo:** Agregar un buscador de facturas que permita buscar por código/número de factura, y al presionar Enter sobre un resultado, abrir modal de edición.

**Implementación:**
1. **Input de búsqueda** al inicio de la página que filtre por:
   - Número de factura (ej: "FAC-000001")
   - Código interno
   - Nombre del cliente
2. **Al presionar Enter** sobre un registro encontrado → abrir modal de edición de esa factura
3. **Modal de edición** debe permitir modificar:
   - Cliente (select)
   - Fecha de emisión
   - Fecha de vencimiento
   - Detalles (agregar/quitar líneas)
   - Estado (pendiente/pagada/vencida/cancelada)
4. **Botón de impresión** al lado de cada factura en la tabla (ver sección 6.7)

**Componentes a modificar:**
- `app/(dashboard)/facturacion/facturas/page.tsx` — Buscador + modal de edición
- `components/facturacion/FacturaForm.tsx` (si existe) o crear nuevo `FacturaEditModal.tsx`

---

### 6.9 Proyectos - Vista Calendar + Kanban

**Archivos a modificar:**
- `app/(dashboard)/tareas/proyectos/page.tsx`
- `app/(dashboard)/tareas/tablero/page.tsx`
- `components/layout/Sidebar.tsx`

**Objetivo:** Rediseñar la sección de proyectos para que sea un **Calendar View** donde a la izquierda hay un sidebar con la lista de proyectos y a la derecha el tablero Kanban correspondiente.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  [Sidebar Proyectos]  │  [Tablero Kanban]       │
│                       │                         │
│  ● Proyecto Alpha     │  ┌───┐ ┌───┐ ┌───┐    │
│  ● Proyecto Beta      │  │Pend│ │Prog│ │Rev │    │
│  ● Proyecto Gamma     │  └───┘ └───┘ └───┘    │
│                       │                         │
└─────────────────────────────────────────────────┘
```

**Funcionalidad:**
1. **Sidebar izquierdo** (200-250px):
   - Lista de proyectos con título y estado (color indicador)
   - Al hacer clic en un proyecto, se carga su tablero Kanban a la derecha
   - Botón "Nuevo Proyecto" al inicio
   - Búsqueda de proyectos (input filter)

2. **Panel derecho** (tablero Kanban):
   - Muestra las 4 columnas: Pendientes, En Progreso, En Revisión, Completadas
   - Cada tarea muestra: título, nombre del empleado asignado, prioridad (badge de color)
   - Drag & drop entre columnas (usar @dnd-kit, ya instalado)
   - Botón "Nueva Tarea" que abre modal para agregar tarea al proyecto actual

3. **Integración:**
   - Sidebar y Kanban deben estar en la misma página (unificar proyectos y tablero)
   - Actualizar Sidebar.tsx para que apunte a una sola ruta: `/tareas/proyectos`

**Archivos a unificar/modificar:**
- `app/(dashboard)/tareas/proyectos/page.tsx` — Nuevo layout con sidebar + kanban
- Se puede eliminar `app/(dashboard)/tareas/tablero/page.tsx` o redirigir a proyectos

**Componentes a crear:**
- `components/tareas/ProyectoSidebar.tsx` — Sidebar con lista de proyectos
- `components/tareas/KanbanBoard.tsx` — Tablero Kanban con drag & drop
- `components/tareas/TareaCard.tsx` — Card de tarea individual

---

## 7. Orden de Implementación

```
FASE 1 - FUNDACIÓN
[ ] 1. Migración de sesiones (modelo + servicio + tipos)
[ ] 2. CSV → JSON → Supabase (mejora importación)

FASE 2 - MEJORAS MODULARES
[ ] 3. Inventario: UI consistente + buscador de productos
[ ] 4. RRHH: unificación (buscador, asistencia integrada, export/import)
[ ] 5. POS: código de carrito + impresión de ticket

FASE 3 - FACTURACIÓN
[ ] 6. Facturas: buscador + modal de edición + reimpresión
[ ] 7. Inicio: análisis de ventas (ganancias, pérdidas, cambios de precio)

FASE 4 - PROYECTOS
[ ] 8. Calendar + Kanban (sidebar proyectos + tablero unificado)
[ ] 9. Actualizar sidebar navegación (rutas simplificadas)
```

---

## Notas para el Agente IA

1. **Next.js 16**: Antes de escribir código, verifica las API de Next.js 16 en `node_modules/next/dist/docs/`. Especial atención a cambios en metadata, layouts, y server components.

2. **Supabase SSR**: Los servicios usan `createClient()` de `@/lib/supabase/server` que retorna el cliente autenticado. No instanciar Supabase manualmente.

3. **Multiempresa**: Todas las queries deben filtrar por `empresa_id`. Usar `obtenerPerfilActual()` para obtener el ID de empresa del usuario logueado.

4. **Estilos**: Usar Tailwind CSS v4. Clases utilitarias. No usar CSS modules nuevos (solo existe `layout.module.css`).

5. **Componentes reutilizables**: Usar Modal, FormField, SubmitButton, ConfirmDialog de `components/ui/`. No recrearlos.

6. **Manejo de errores**: Usar `ServiceError` de `lib/services/supabase-service.ts` para errores consistentes.

7. **Estados de UI**: Toda página debe manejar: loading (`<Loading />`), error (`<ErrorBox error={error} onRetry={fn} />`), empty (`<EmptyState />`), y datos.

8. **Roles**: Verificar rol del usuario con `obtenerPerfilActual()` antes de mostrar acciones de edición/eliminación.