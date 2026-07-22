import { supabase } from "@/lib/supabase";
import { fromSupabaseSingle, fromSupabaseList } from "./supabase-service";
import type {
  Cliente,
  ClienteInput,
  Factura,
  FacturaInput,
  FacturaConCliente,
  DetalleFactura,
  DetalleFacturaInput,
  Pago,
  PagoInput,
  PagoConFactura,
} from "@/lib/types/facturacion";

// ---- Clientes ----

export async function listarClientes(empresaId: string): Promise<Cliente[]> {
  return fromSupabaseList(
    supabase.from("clientes").select("*").eq("empresa_id", empresaId).order("nombre")
  );
}

export async function obtenerCliente(id: string, empresaId: string): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").select("*").eq("id", id).eq("empresa_id", empresaId).single()
  );
}

export async function crearCliente(empresaId: string, input: ClienteInput): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarCliente(
  id: string,
  empresaId: string,
  input: Partial<ClienteInput>
): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").update(input).eq("id", id).eq("empresa_id", empresaId).select("*").single()
  );
}

export async function eliminarCliente(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Facturas ----

export async function listarFacturas(empresaId: string): Promise<FacturaConCliente[]> {
  return fromSupabaseList(
    supabase
      .from("facturas")
      .select("*, clientes(nombre, rnc_cedula)")
      .eq("empresa_id", empresaId)
      .order("fecha_emision", { ascending: false })
  );
}

export async function obtenerFactura(id: string, empresaId: string): Promise<FacturaConCliente> {
  return fromSupabaseSingle(
    supabase
      .from("facturas")
      .select("*, clientes(nombre, rnc_cedula)")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function crearFactura(empresaId: string, input: FacturaInput): Promise<Factura> {
  return fromSupabaseSingle(
    supabase.from("facturas").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarFactura(
  id: string,
  empresaId: string,
  input: Partial<FacturaInput>
): Promise<Factura> {
  return fromSupabaseSingle(
    supabase.from("facturas").update(input).eq("id", id).eq("empresa_id", empresaId).select("*").single()
  );
}

export async function eliminarFactura(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("facturas").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Detalles de Factura ----

export async function listarDetalles(facturaId: string): Promise<DetalleFactura[]> {
  return fromSupabaseList(
    supabase
      .from("detalles_factura")
      .select("*")
      .eq("factura_id", facturaId)
      .order("created_at")
  );
}

export async function crearDetalle(input: DetalleFacturaInput): Promise<DetalleFactura> {
  const total = input.cantidad * input.precio_unitario;
  return fromSupabaseSingle(
    supabase
      .from("detalles_factura")
      .insert({ ...input, total })
      .select("*")
      .single()
  );
}

export async function eliminarDetalle(id: string): Promise<void> {
  const { error } = await supabase.from("detalles_factura").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Pagos ----

export async function listarPagos(empresaId: string, facturaId?: string): Promise<PagoConFactura[]> {
  let query = supabase
    .from("pagos")
    .select("*, facturas(numero, total)")
    .eq("empresa_id", empresaId)
    .order("fecha_pago", { ascending: false });

  if (facturaId) {
    query = query.eq("factura_id", facturaId);
  }

  return fromSupabaseList(query);
}

export async function crearPago(empresaId: string, input: PagoInput): Promise<Pago> {
  return fromSupabaseSingle(
    supabase.from("pagos").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function eliminarPago(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("pagos").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- POS / Helpers ----

export async function obtenerClientePorDefecto(empresaId: string): Promise<Cliente | null> {
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("nombre", "Consumidor Final")
    .single();

  if (data) return data;

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      empresa_id: empresaId,
      nombre: "Consumidor Final",
      rnc_cedula: "000000000",
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear cliente por defecto: ${error.message}`);
  return cliente;
}

interface DetallePOS {
  producto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export async function crearFacturaConDetalles(
  empresaId: string,
  data: {
    cliente_id: string;
    subtotal: number;
    impuesto: number;
    total: number;
    detalles: DetallePOS[];
  }
): Promise<Factura> {
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

  let factura: Factura | null = null;

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
      if (result.error.code === "23505" && result.error.message.includes("facturas_numero_key")) {
        continue;
      }
      throw new Error(`Error al crear factura: ${result.error.message}`);
    }

    factura = result.data;
    break;
  }

  if (!factura) {
    throw new Error("No se pudo generar un número único después de 3 intentos");
  }

  const detalles = data.detalles.map((d) => ({
    factura_id: factura.id,
    descripcion: d.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    total: d.total,
  }));

  const { error: detError } = await supabase.from("detalles_factura").insert(detalles);
  if (detError) throw new Error(`Error al crear detalles: ${detError.message}`);

  return factura;
}
