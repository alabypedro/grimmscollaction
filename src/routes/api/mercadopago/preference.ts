import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mercadopago/preference")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }, { status: 500 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Corpo inválido" }, { status: 400 });
        }

        const { orderId, items, payerEmail, siteUrl } = body;
        if (!orderId || !items?.length || !siteUrl) {
          return Response.json({ error: "Dados obrigatórios ausentes" }, { status: 400 });
        }

        const preference = {
          items: items.map((i: any) => ({
            id: i.id,
            title: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price,
            currency_id: "BRL",
          })),
          payer: payerEmail ? { email: payerEmail } : undefined,
          back_urls: {
            success: `${siteUrl}/pedido-confirmado?orderId=${orderId}`,
            failure: `${siteUrl}/checkout`,
            pending: `${siteUrl}/pedido-confirmado?orderId=${orderId}&payment_status=pending`,
          },
          auto_return: "approved",
          external_reference: orderId,
          notification_url: `${siteUrl}/api/mercadopago/webhook`,
          statement_descriptor: "GRIMMS COLLECTION",
        };

        const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preference),
        });

        const data = await res.json() as any;

        if (!res.ok) {
          console.error("Erro MP preference:", data);
          return Response.json({ error: data.message ?? "Erro ao criar preferência" }, { status: res.status });
        }

        return Response.json({
          preferenceId: data.id as string,
          initPoint: data.init_point as string,
          sandboxInitPoint: data.sandbox_init_point as string,
        });
      },
    },
  },
});
