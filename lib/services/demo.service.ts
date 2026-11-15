// ============================================================
// Demo - Seed de datos de demostración
// ============================================================

import { crearCategoria, crearProducto, listarProductos } from "./inventario";
import { crearProyecto, crearTarea, listarProyectos } from "./tareas.service";
import { crearDepartamento, crearEmpleado } from "./rrhh.service";
import type { CategoriaInput, ProductoInput } from "@/lib/types/inventario";
import type { ProyectoInput, TareaInput } from "@/lib/types/tareas";
import type { DepartamentoInput, EmpleadoInput } from "@/lib/types/rrhh";

export async function seedDemoData(
  empresaId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    // Idempotente: si ya existen productos para esta empresa, no crear nada
    const productosExistentes = await listarProductos(empresaId);
    if (productosExistentes.length > 0) {
      return { ok: false, message: "Ya existen datos de demostración." };
    }

    // 1. Crear 2 categorías
    const categoria1 = await crearCategoria(empresaId, {
      nombre: "Tecnología",
      descripcion: "Equipos y dispositivos",
    });
    const categoria2 = await crearCategoria(empresaId, {
      nombre: "Oficina",
      descripcion: "Suministros de oficina",
    });

    // 2. Crear 3 productos
    const productos: ProductoInput[] = [
      {
        categoria_id: categoria1.id,
        codigo: "TEC-001",
        nombre: "Laptop Dell XPS 13",
        descripcion: "Laptop para desarrollo",
        precio_venta: 1200,
        costo: 900,
        stock: 10,
      },
      {
        categoria_id: categoria1.id,
        codigo: "TEC-002",
        nombre: "Monitor 27\" 4K",
        descripcion: "Monitor profesional",
        precio_venta: 450,
        costo: 300,
        stock: 5,
      },
      {
        categoria_id: categoria2.id,
        codigo: "OF-001",
        nombre: "Silla Ergonómica",
        descripcion: "Silla de oficina",
        precio_venta: 350,
        costo: 200,
        stock: 8,
      },
    ];

    for (const producto of productos) {
      await crearProducto(empresaId, producto);
    }

    // 3. Crear 2 proyectos
    const proyecto1 = await crearProyecto(empresaId, {
      nombre: "Sitio Web Corporativo",
      descripcion: "Rediseño del sitio web",
      estado: "activo",
      prioridad: "alta",
      fecha_inicio: "2026-01-15",
    });
    const proyecto2 = await crearProyecto(empresaId, {
      nombre: "App Móvil",
      descripcion: "Aplicación móvil para clientes",
      estado: "pausado",
      prioridad: "media",
      fecha_inicio: "2026-02-01",
    });

    // 4. Crear 4 tareas
    const tareas: TareaInput[] = [
      {
        proyecto_id: proyecto1.id,
        titulo: "Diseñar wireframes",
        columna: "completadas",
        prioridad: "alta",
        orden: 1,
      },
      {
        proyecto_id: proyecto1.id,
        titulo: "Desarrollar frontend",
        columna: "en_progreso",
        prioridad: "alta",
        orden: 2,
      },
      {
        proyecto_id: proyecto1.id,
        titulo: "Testing y QA",
        columna: "pendientes",
        prioridad: "media",
        orden: 3,
      },
      {
        proyecto_id: proyecto2.id,
        titulo: "Definir requisitos",
        columna: "pendientes",
        prioridad: "media",
        orden: 1,
      },
    ];

    for (const tarea of tareas) {
      await crearTarea(empresaId, tarea);
    }

    // 5. Crear un departamento y empleados ("para las personas")
    const departamento = await crearDepartamento(empresaId, {
      nombre: "Operaciones",
      descripcion: "Equipo operativo principal",
    });

    const empleados: EmpleadoInput[] = [
      {
        nombre: "María González",
        email: "maria.gonzalez@empresa.demo",
        puesto: "Gerente de Operaciones",
        salario: 45000,
        activo: true,
        departamento_id: departamento.id,
      },
      {
        nombre: "Carlos Ruiz",
        email: "carlos.ruiz@empresa.demo",
        puesto: "Desarrollador Frontend",
        salario: 32000,
        activo: true,
        departamento_id: departamento.id,
      },
      {
        nombre: "Lucía Méndez",
        email: "lucia.mendez@empresa.demo",
        puesto: "Diseñadora UX/UI",
        salario: 30000,
        activo: true,
        departamento_id: departamento.id,
      },
    ];

    for (const empleado of empleados) {
      await crearEmpleado(empresaId, empleado);
    }

    return { ok: true, message: "Datos de demostración creados exitosamente." };
  } catch (error: any) {
    // Manejo de expiración de sesión de Supabase
    if (
      error?.message?.includes("session") ||
      error?.message?.includes("auth") ||
      error?.code === "401" ||
      error?.status === 401
    ) {
      return {
        ok: false,
        message:
          "Tu sesión expiró. Vuelve a iniciar sesión e intenta cargar los datos de demostración nuevamente.",
      };
    }
    return { ok: false, message: error.message };
  }
}
