import PagosClient from "@/components/ventas/PagosClient";
import { createClient } from "@/lib/supabase/server";
import type { PagoConFactura, Factura } from "@/lib/types/facturacion";

export default async function VentasPagosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-gray-500">No autenticado</div>;
  }

  const { data: perfil } = await supabase
    .from("perfiles_usuario")
    .select("*")
    .eq("user_id", user.id)
    .eq("activo", true)
    .single();

  if (!perfil) {
    return <div className="p-8 text-center text-gray-500">No se encontró perfil de usuario</div>;
  }

  const [pagosRes, facturasRes] = await Promise.all([
    supabase
      .from("pagos")
      .select("*, facturas(numero, total)")
      .eq("empresa_id", perfil.empresa_id)
      .order("fecha_pago", { ascending: false }),
    supabase
      .from("facturas")
      .select("*")
      .eq("empresa_id", perfil.empresa_id)
      .order("created_at", { ascending: false }),
  ]);

  const pagos = (pagosRes.data || []) as unknown as PagoConFactura[];
  const facturas = (facturasRes.data || []) as Factura[];

  return (
    <PagosClient
      initialData={pagos}
      initialFacturas={facturas}
      empresaId={perfil.empresa_id}
    />
  );
}
