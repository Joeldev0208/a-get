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

// ============================================================
// Servicio: Facturación
// CRUD: Clientes, Facturas, Detalles, Pagos
// ============================================================

// ---- Clientes ----

export async function listarClientes(): Promise<Cliente[]> {
  return fromSupabaseList(
    supabase.from("clientes").select("*").order("nombre")
  );
}

export async function obtenerCliente(id: string): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").select("*").eq("id", id).single()
  );
}

export async function crearCliente(input: ClienteInput): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").insert(input).select("*").single()
  );
}

export async function actualizarCliente(
  id: string,
  input: Partial<ClienteInput>
): Promise<Cliente> {
  return fromSupabaseSingle(
    supabase.from("clientes").update(input).eq("id", id).select("*").single()
  );
}

export async function eliminarCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Facturas ----

export async function listarFacturas(): Promise<FacturaConCliente[]> {
  return fromSupabaseList(
    supabase
      .from("facturas")
      .select("*, clientes(nombre, rnc_cedula)")
      .order("fecha_emision", { ascending: false })
  );
}

export async function obtenerFactura(id: string): Promise<FacturaConCliente> {
  return fromSupabaseSingle(
    supabase
      .from("facturas")
      .select("*, clientes(nombre, rnc_cedula)")
      .eq("id", id)
      .single()
  );
}

export async function crearFactura(input: FacturaInput): Promise<Factura> {
  return fromSupabaseSingle(
    supabase.from("facturas").insert(input).select("*").single()
  );
}

export async function actualizarFactura(
  id: string,
  input: Partial<FacturaInput>
): Promise<Factura> {
  return fromSupabaseSingle(
    supabase.from("facturas").update(input).eq("id", id).select("*").single()
  );
}

export async function eliminarFactura(id: string): Promise<void> {
  const { error } = await supabase.from("facturas").delete().eq("id", id);
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

export async function listarPagos(facturaId?: string): Promise<PagoConFactura[]> {
  let query = supabase
    .from("pagos")
    .select("*, facturas(numero, total)")
    .order("fecha_pago", { ascending: false });

  if (facturaId) {
    query = query.eq("factura_id", facturaId);
  }

  return fromSupabaseList(query);
}

export async function crearPago(input: PagoInput): Promise<Pago> {
  return fromSupabaseSingle(
    supabase.from("pagos").insert(input).select("*").single()
  );
}

export async function eliminarPago(id: string): Promise<void> {
  const { error } = await supabase.from("pagos").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}