// ============================================================
// Facturación - Tipos del módulo de Facturación
// ============================================================

// ---- Clientes ----
export interface Cliente {
  id: string;
  empresa_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  rnc_cedula: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClienteInput {
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  rnc_cedula?: string | null;
}

// ---- Facturas ----
export type EstadoFactura = "pendiente" | "pagada" | "vencida" | "cancelada";

export interface Factura {
  id: string;
  empresa_id: string;
  numero: string;
  cliente_id: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: EstadoFactura;
  fecha_emision: string;
  fecha_vencimiento: string;
  created_at: string;
  updated_at: string;
}

export interface FacturaInput {
  cliente_id: string;
  numero: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado?: EstadoFactura;
  fecha_emision: string;
  fecha_vencimiento: string;
}

export interface FacturaConCliente extends Factura {
  clientes: { nombre: string; rnc_cedula: string | null } | null;
  detalles_factura?: DetalleFactura[];
}

// ---- Detalles de Factura ----
export interface DetalleFactura {
  id: string;
  factura_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  created_at: string;
}

export interface DetalleFacturaInput {
  factura_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

// ---- Pagos ----
export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "cheque";

export interface Pago {
  id: string;
  empresa_id: string;
  factura_id: string;
  monto: number;
  metodo: MetodoPago;
  referencia: string | null;
  fecha_pago: string;
  created_at: string;
  updated_at: string;
}

export interface PagoInput {
  factura_id: string;
  monto: number;
  metodo: MetodoPago;
  referencia?: string | null;
  fecha_pago: string;
}

export interface PagoConFactura extends Pago {
  facturas: { numero: string; total: number } | null;
}