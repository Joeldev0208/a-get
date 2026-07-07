import { supabase } from "@/lib/supabase";
import type { Categoria, CategoriaInput, Producto, ProductoInput } from "@/lib/types/inventario";

// ---- Categorías ----
export async function listarCategorias(empresaId: string): Promise<Categoria[]> {
  const { data } = await supabase
    .from("categorias")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nombre");

  return data || [];
}

export async function crearCategoria(empresaId: string, data: CategoriaInput): Promise<Categoria> {
  const { data: categoria, error } = await supabase
    .from("categorias")
    .insert({ ...data, empresa_id: empresaId })
    .select()
    .single();

  if (error) throw new Error(`Error al crear categoría: ${error.message}`);
  return categoria;
}

export async function eliminarCategoria(id: string): Promise<void> {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw new Error(`Error al eliminar categoría: ${error.message}`);
}

// ---- Productos ----
export async function listarProductos(empresaId: string): Promise<Producto[]> {
  const { data } = await supabase
    .from("productos")
    .select("*, categorias(nombre)")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .order("nombre");

  return data || [];
}

export async function obtenerProducto(id: string): Promise<Producto | null> {
  const { data } = await supabase
    .from("productos")
    .select("*, categorias(nombre)")
    .eq("id", id)
    .single();

  return data;
}

export async function crearProducto(empresaId: string, data: ProductoInput): Promise<Producto> {
  const { data: producto, error } = await supabase
    .from("productos")
    .insert({ ...data, empresa_id: empresaId })
    .select("*, categorias(nombre)")
    .single();

  if (error) throw new Error(`Error al crear producto: ${error.message}`);
  return producto;
}

export async function actualizarProducto(id: string, data: Partial<ProductoInput>): Promise<void> {
  const { error } = await supabase.from("productos").update(data).eq("id", id);
  if (error) throw new Error(`Error al actualizar producto: ${error.message}`);
}

export async function eliminarProducto(id: string): Promise<void> {
  const { error } = await supabase.from("productos").update({ activo: false }).eq("id", id);
  if (error) throw new Error(`Error al eliminar producto: ${error.message}`);
}

export async function importarProductosCSV(
  empresaId: string,
  productos: { codigo: string; nombre: string; descripcion: string; categoria: string; precio_venta: number; costo: number; stock: number }[]
): Promise<{ insertados: number; errores: string[] }> {
  let insertados = 0;
  const errores: string[] = [];

  for (const p of productos) {
    try {
      // Buscar o crear categoría
      let categoriaId: string | null = null;
      if (p.categoria) {
        const { data: cat } = await supabase
          .from("categorias")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("nombre", p.categoria)
          .single();

        if (cat) {
          categoriaId = cat.id;
        } else {
          const { data: newCat } = await supabase
            .from("categorias")
            .insert({ nombre: p.categoria, empresa_id: empresaId })
            .select("id")
            .single();
          categoriaId = newCat?.id || null;
        }
      }

      const { error } = await supabase.from("productos").insert({
        empresa_id: empresaId,
        categoria_id: categoriaId,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion || null,
        precio_venta: p.precio_venta,
        costo: p.costo,
        stock: p.stock || 0,
      });

      if (error) {
        errores.push(`${p.codigo}: ${error.message}`);
      } else {
        insertados++;
      }
    } catch (e: any) {
      errores.push(`${p.codigo}: ${e.message}`);
    }
  }

  return { insertados, errores };
}