import { createServerFn } from "@tanstack/react-start";

type ProcessInput = { order_code: string; formData: Record<string, any> };

export const processMpPayment = createServerFn({ method: "POST" })
  .inputValidator((input: ProcessInput) => {
    if (!input?.order_code || !input?.formData) throw new Error("dados incompletos");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const settingToken = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "mp_access_token")
      .maybeSingle();

    const accessToken =
      process.env["MP_ACCESS_TOKEN"] ||
      ((settingToken.data?.value as string | null) ?? "").trim();
    if (!accessToken) throw new Error("MP Access Token não configurado");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, code, total_cents, status, customer_email")
      .eq("code", data.order_code)
      .maybeSingle();
    if (!order) throw new Error("Pedido não encontrado");

    if (order.status === "confirmed") {
      return { status: "approved", already: true } as Record<string, any>;
    }

    const fd = data.formData;
    const body: Record<string, unknown> = {
      transaction_amount: Number(fd.transaction_amount ?? order.total_cents / 100),
      description: `Pedido ${order.code} - BODYOGA`,
      payment_method_id: fd.payment_method_id,
      payer: fd.payer ?? { email: order.customer_email },
      external_reference: order.id,
      notification_url: `${process.env["SUPABASE_URL"]}/functions/v1/mp-webhook`,
      metadata: { order_code: order.code },
    };
    if (fd.token) body["token"] = fd.token;
    if (fd.installments) body["installments"] = fd.installments;
    if (fd.issuer_id) body["issuer_id"] = fd.issuer_id;

    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${order.code}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });
    const payment: any = await resp.json();

    if (!resp.ok) {
      console.error("MP payment error:", payment);
      throw new Error(payment?.message ?? "Falha ao processar pagamento no Mercado Pago");
    }

    await supabaseAdmin
      .from("orders")
      .update({
        mp_payment_id: String(payment.id),
        mp_payment_status: payment.status,
        mp_payment_method: payment.payment_method_id,
        status: payment.status === "approved" ? "confirmed" : order.status,
      })
      .eq("id", order.id);

    const result: Record<string, any> = {
      status: payment.status,
      status_detail: payment.status_detail,
      id: payment.id,
    };
    const tx = payment.point_of_interaction?.transaction_data;
    if (tx) {
      result["pix"] = {
        qr_code: tx.qr_code,
        qr_base64: tx.qr_code_base64,
        ticket_url: tx.ticket_url,
      };
    }
    return result;
  });
