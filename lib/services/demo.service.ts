// ============================================================
// Demo - Seed de datos de demostración
// ============================================================

import { crearCategoria, crearProducto, listarProductos } from "./inventario";
import { crearProyecto, crearTarea, listarProyectos } from "./tareas.service";
import type { CategoriaInput, ProductoInput } from "@/lib/types/inventario";
import type { ProyectoInput, TareaInput } from "@/lib/types/tareas";

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

    return { ok: true, message: "Datos de demostración creados exitosamente." };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}
