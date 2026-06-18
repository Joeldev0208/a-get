# Implementation Plan

## Overview

Crear formularios modales de inserción (CRUD - Create) para los 3 módulos del sistema AGET (RR.HH., Tareas, Facturación), permitiendo insertar registros en las tablas de Supabase mediante modales emergentes con estados Loading/Error/Success y validación de campos.

## Types

No se requieren cambios en los tipos existentes (`lib/types/`). Los tipos Input ya están definidos. Sin embargo, se debe agregar un tipo auxiliar `FormModalProps` para estandarizar los modales:

```typescript
// interfaces para el estado del modal
interface ModalState<T> {
  open: boolean;
  mode: "create" | "edit";
  data?: T; // para edición futura
}
```

## Files

### Archivos a crear:

1. **`components/ui/Modal.tsx`** — Componente modal reutilizable genérico
   - Props: `isOpen`, `onClose`, `title`, `children`, `size?` ("sm" | "md" | "lg")
   - Efecto: overlay + centrado + animación fade
   - Cierra con Escape y clic fuera

2. **`components/ui/FormField.tsx`** — Componente de campo de formulario reutilizable
   - Props: `label`, `name`, `type`, `value`, `onChange`, `error?`, `required?`, `options?` (para selects), `placeholder?`
   - Renderiza: label, input/select/textarea, mensaje de error

3. **`components/ui/SubmitButton.tsx`** — Botón de envío con estado loading
   - Props: `loading`, `text`, `loadingText?`, `onClick`, `disabled?`, `variant?`

4. **`components/rrhh/EmpleadoForm.tsx`** — Modal formulario de empleado
   - Campos: nombre, email, puesto, salario, activo, departamento_id (select)
   - Incluye botón "+" al lado del select de departamento para abrir mini-modal de crear departamento

5. **`components/rrhh/DepartamentoForm.tsx`** — Modal formulario de departamento (mini)
   - Campos: nombre, descripcion

6. **`components/rrhh/AsistenciaForm.tsx`** — Modal formulario de asistencia
   - Campos: empleado_id (select), fecha, estado (select), hora_entrada, hora_salida

7. **`components/tareas/ProyectoForm.tsx`** — Modal formulario de proyecto
   - Campos: nombre, descripcion, estado, prioridad, fecha_inicio, fecha_fin, responsable_id (select)

8. **`components/tareas/TareaForm.tsx`** — Modal formulario de tarea (para el tablero Kanban)
   - Campos: proyecto_id (select), titulo, descripcion, columna, prioridad, asignado_id (select), fecha_limite

9. **`components/facturacion/ClienteForm.tsx`** — Modal formulario de cliente
   - Campos: nombre, email, telefono, direccion, rnc_cedula

10. **`components/facturacion/FacturaForm.tsx`** — Modal formulario de factura con líneas de detalle
    - Campos cabecera: numero, cliente_id (select), fecha_emision, fecha_vencimiento
    - Sección de detalles: tabla editable con múltiples líneas (descripcion, cantidad, precio_unitario, total calculado)
    - Cálculo automático: subtotal, impuesto (18%), total
    - Estado se asigna automáticamente como "pendiente"

11. **`components/facturacion/PagoForm.tsx`** — Modal formulario de pago
    - Campos: factura_id (select), monto, metodo (select), referencia, fecha_pago

### Archivos a modificar:

12. **`app/(dashboard)/rrhh/empleados/page.tsx`** — Agregar estado del modal y conectar con EmpleadoForm
    - Cambiar: importar EmpleadoForm, agregar `showModal`, pasar al onClick del botón "Nuevo Empleado"

13. **`app/(dashboard)/rrhh/departamentos/page.tsx`** — Agregar estado del modal y conectar con DepartamentoForm

14. **`app/(dashboard)/rrhh/asistencia/page.tsx`** — Agregar estado del modal y conectar con AsistenciaForm

15. **`app/(dashboard)/tareas/proyectos/page.tsx`** — Agregar estado del modal y conectar con ProyectoForm

16. **`app/(dashboard)/tareas/tablero/page.tsx`** — Agregar estado del modal y conectar con TareaForm

17. **`app/(dashboard)/facturacion/clientes/page.tsx`** — Agregar estado del modal y conectar con ClienteForm

18. **`app/(dashboard)/facturacion/facturas/page.tsx`** — Agregar estado del modal y conectar con FacturaForm

19. **`app/(dashboard)/facturacion/pagos/page.tsx`** — Agregar estado del modal y conectar con PagoForm

## Functions

### Nuevas funciones (ninguna — los servicios ya existen en `lib/services/`)

Los formularios usarán las funciones existentes:
- `crearEmpleado()`, `crearDepartamento()`, `registrarAsistencia()` (rrhh.service.ts)
- `crearProyecto()`, `crearTarea()` (tareas.service.ts)
- `crearCliente()`, `crearFactura()`, `crearDetalle()`, `crearPago()` (facturacion.service.ts)

### Funciones auxiliares nuevas (en los formularios):
- `calcularTotalesFactura(detalles)` — calcula subtotal, impuesto (18%), total
- `handleSubmit(input)` — valida campos, llama al servicio, maneja errores, cierra modal y refresca datos

## Classes

No se requieren nuevas clases. Los componentes serán funciones React.

## Dependencies

No se requieren nuevas dependencias externas. Se usarán:
- `lucide-react` — ya instalado (íconos X, Plus, Check, Loader2)
- `clsx` + `tailwind-merge` — ya instalados (cn())
- `@supabase/supabase-js` — ya instalado

## Testing

Probar manualmente cada formulario:
1. Abrir modal desde el botón "Nuevo" en cada página
2. Verificar que el modal se muestre correctamente
3. Llenar campos y enviar (debe fallar porque la tabla está vacía — es normal)
4. Verificar estado de carga (loading) durante el envío
5. Verificar estado de error si falla
6. Cerrar modal con Escape/clic fuera

## Implementation Order

1. **`Modal.tsx`** — Componente base de modal
2. **`FormField.tsx`** — Componente de campo de formulario
3. **`SubmitButton.tsx`** — Botón de envío con loading
4. **`DepartamentoForm.tsx`** — Primero porque EmpleadoForm lo necesita
5. **`EmpleadoForm.tsx`** — Formulario de empleado + botón para crear departamento
6. **`AsistenciaForm.tsx`** — Formulario de asistencia
7. **`ProyectoForm.tsx`** — Formulario de proyecto
8. **`TareaForm.tsx`** — Formulario de tarea
9. **`ClienteForm.tsx`** — Formulario de cliente
10. **`FacturaForm.tsx`** — Formulario de factura con detalles (el más complejo)
11. **`PagoForm.tsx`** — Formulario de pago
12. **Modificar páginas** — Conectar cada modal con su página correspondiente (archivos 12-19)
13. **Probar todo** — Iniciar servidor y verificar que compile y funcione