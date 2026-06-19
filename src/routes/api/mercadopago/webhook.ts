import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const MP_STATUS_MAP: Record<string, string> = {
  approved: "processando",
  pending: "pendente",
  in_process: "pendente",
  authorized: "processando",
  rejected: "cancelado",
  cancelled: "cancelado",
  refunded: "cancelado",
  charged_back: "cancelado",
};

export const Route = createFileRoute("/api/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!token || !supabaseUrl || !serviceKey) {
          console.error("MP webhook: variáveis de ambiente faltando");
          return Response.json({ received: true });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ received: true });
        }

        // MP envia type=payment para notificações de pagamento
        if (body.type !== "payment" || !body.data?.id) {
          return Response.json({ received: true });
        }

        const paymentId = body.data.id;

        const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!paymentRes.ok) {
          console.error("MP webhook: erro ao buscar pagamento", paymentId);
          return Response.json({ received: true });
        }

        const payment = await paymentRes.json() as any;
        const orderId: string | undefined = payment.external_reference;

        if (!orderId) {
          return Response.json({ received: true });
        }

        const newStatus = MP_STATUS_MAP[payment.status as string] ?? "pendente";
        const paymentMethod: string = payment.payment_type_id ?? "mercadopago";

        const supabase = createClient(supabaseUrl, serviceKey);
        const { error } = await supabase
          .from("orders")
          .update({
            status: newStatus,
            mp_payment_id: String(paymentId),
            payment_method: paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("MP webhook: erro ao atualizar pedido", orderId, error);
        }

        return Response.json({ received: true });
      },
    },
  },
});
