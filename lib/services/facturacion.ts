import { supabase } from "@/lib/supabase";
import type { Cliente, Factura, FacturaConCliente, PagoConFactura } from "@/lib/types/facturacion";

// ---- Clientes ----
export async function listarClientes(empresaId: string): Promise<Cliente[]> {
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nombre");

  return data || [];
}

export async function crearCliente(empresaId: string, data: { nombre: string; email?: string | null; telefono?: string | null; direccion?: string | null; rnc_cedula?: string | null }): Promise<Cliente> {
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({ ...data, empresa_id: empresaId })
    .select()
    .single();

  if (error) throw new Error(`Error al crear cliente: ${error.message}`);
  return cliente;
}

// ---- Facturas ----
export async function crearFactura(
  empresaId: string,
  data: {
    cliente_id: string;
    subtotal: number;
    impuesto: number;
    total: number;
    detalles: { producto_id?: string; descripcion: string; cantidad: number; precio_unitario: number; total: number }[];
  }
): Promise<Factura> {
  // Generar número de factura
  const { data: countData } = await supabase
    .from("facturas")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId);

  const count = countData?.length || 0;
  const numero = `FAC-${String(count + 1).padStart(6, "0")}`;

  // Crear factura
  const { data: factura, error } = await supabase
    .from("facturas")
    .insert({
      empresa_id: empresaId,
      numero,
      cliente_id: data.cliente_id,
      subtotal: data.subtotal,
      impuesto: data.impuesto,
      total: data.total,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear factura: ${error.message}`);

  // Crear detalles
  const detalles = data.detalles.map((d) => ({
    factura_id: factura.id,
    producto_id: d.producto_id || null,
    descripcion: d.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    total: d.total,
  }));

  const { error: detError } = await supabase.from("detalles_factura").insert(detalles);
  if (detError) throw new Error(`Error al crear detalles: ${detError.message}`);

  return factura;
}

export async function listarFacturas(empresaId: string): Promise<FacturaConCliente[]> {
  const { data } = await supabase
    .from("facturas")
    .select("*, clientes(nombre, rnc_cedula)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  return data || [];
}

// ---- Pagos ----
export async function listarPagos(empresaId: string): Promise<PagoConFactura[]> {
  const { data } = await supabase
    .from("pagos")
    .select("*, facturas(numero, total)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  return data || [];
}
