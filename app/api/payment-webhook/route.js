import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';
export const maxDuration = 30;

// ═══════════════════════════════════════════════════════════
// Webhook — يستقبل تأكيد الدفع من البوابة ويفعّل الاشتراك
// يدعم: تاب، ميسر
// ═══════════════════════════════════════════════════════════

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function activate(userId, days, ref) {
  const db = admin();
  if (!db) {
    console.error("Supabase admin client unavailable");
    return false;
  }

  const now = new Date();
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { error } = await db.from("profiles").update({
    is_premium: true,
    subscription_expires_at: expires.toISOString(),
    subscription_started_at: now.toISOString(),
    last_payment_ref: ref || null
  }).eq("id", userId);

  if (error) {
    console.error("Activation failed:", error.message);
    return false;
  }

  console.log(`Activated ${userId} for ${days} days (ref: ${ref})`);
  return true;
}

export async function POST(req) {
  try {
    const provider = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
    const body = await req.json();

    // ═══ تاب ═══
    if (provider === "tap") {
      const status = body?.status;
      const meta = body?.metadata || {};
      const userId = meta.user_id;
      const days = parseInt(meta.days) || 30;

      if (status !== "CAPTURED") {
        console.log("Tap webhook: status =", status, "— تجاهل");
        return Response.json({ received: true });
      }
      if (!userId) {
        console.error("Tap webhook: user_id مفقود في metadata");
        return Response.json({ received: true });
      }

      await activate(userId, days, body.id);
      return Response.json({ received: true });
    }

    // ═══ ميسر ═══
    if (provider === "moyasar") {
      const p = body?.data || body;
      const status = p?.status;
      const meta = p?.metadata || {};
      const userId = meta.user_id;
      const days = parseInt(meta.days) || 30;

      if (status !== "paid") {
        console.log("Moyasar webhook: status =", status, "— تجاهل");
        return Response.json({ received: true });
      }
      if (!userId) {
        console.error("Moyasar webhook: user_id مفقود في metadata");
        return Response.json({ received: true });
      }

      await activate(userId, days, p.id);
      return Response.json({ received: true });
    }

    console.log("Webhook: مزوّد غير معروف");
    return Response.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error.message);
    // نُرجع 200 دائماً حتى لا تعيد البوابة الإرسال بلا نهاية
    return Response.json({ received: true });
  }
}
