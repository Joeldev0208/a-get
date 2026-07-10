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

export async function obtenerClientePorDefecto(empresaId: string): Promise<Cliente | null> {
  // Buscar cliente "Consumidor Final"
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("nombre", "Consumidor Final")
    .single();

  if (data) return data;

  // Si no existe, crearlo
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      empresa_id: empresaId,
      nombre: "Consumidor Final",
      rnc_cedula: "000000000"
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear cliente por defecto: ${error.message}`);
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
  // Generar número de factura (buscar el máximo número y sumar 1)
  const { data: maxData } = await supabase
    .from("facturas")
    .select("numero")
    .eq("empresa_id", empresaId)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  let ultimoNumero = 0;
  if (maxData?.numero) {
    const match = maxData.numero.match(/FAC-(\d+)/);
    if (match) ultimoNumero = parseInt(match[1], 10);
  }
  const numero = `FAC-${String(ultimoNumero + 1).padStart(6, "0")}`;

  // Crear factura con reintento si hay duplicado
  let factura: Factura | null = null;
  let error: any = null;
  
  for (let intento = 0; intento < 3; intento++) {
    const numeroIntento = `FAC-${String(ultimoNumero + 1 + intento).padStart(6, "0")}`;
    const result = await supabase
      .from("facturas")
      .insert({
        empresa_id: empresaId,
        numero: numeroIntento,
        cliente_id: data.cliente_id,
        subtotal: data.subtotal,
        impuesto: data.impuesto,
        total: data.total,
      })
      .select()
      .single();
    
    if (result.error) {
      error = result.error;
      // Si es error de duplicado, continuar al siguiente intento
      if (error.code === "23505" && error.message.includes("facturas_numero_key")) {
        continue;
      }
      // Si es otro error, lanzar
      throw new Error(`Error al crear factura: ${error.message}`);
    }
    
    factura = result.data;
    break;
  }

  if (!factura) {
    throw new Error(`Error al crear factura: No se pudo generar un número único después de 3 intentos`);
  }

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
