export const runtime = 'nodejs';
export const maxDuration = 30;

// ═══════════════════════════════════════════════════════════
// إنشاء دفعة — محايد تجاه بوابة الدفع
// يقرأ المزوّد من PAYMENT_PROVIDER: "tap" أو "moyasar"
// ═══════════════════════════════════════════════════════════

const PLANS = {
  monthly: { amount: 1999, days: 30,  label: "اشتراك هامور الشهري" },
  yearly:  { amount: 19999, days: 365, label: "اشتراك هامور السنوي" }
};

export async function POST(req) {
  try {
    const { plan, userId, email } = await req.json();

    if (!plan || !PLANS[plan]) {
      return Response.json({ error: "الباقة غير صحيحة" }, { status: 400 });
    }
    if (!userId) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const provider = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
    const selected = PLANS[plan];

    // الأصل الظاهر للمستخدم (لبناء روابط العودة)
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
    const callbackUrl = `${origin}/payment-result`;

    if (!provider) {
      return Response.json({
        error: "الدفع الإلكتروني غير مفعّل بعد",
        code: "GATEWAY_NOT_CONFIGURED"
      }, { status: 503 });
    }

    // ═══ تاب ═══
    if (provider === "tap") {
      const key = process.env.TAP_SECRET_KEY;
      if (!key) {
        return Response.json({ error: "الدفع غير مهيأ", code: "GATEWAY_NOT_CONFIGURED" }, { status: 503 });
      }

      const res = await fetch("https://api.tap.company/v2/charges", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: selected.amount / 100,
          currency: "SAR",
          customer_initiated: true,
          threeDSecure: true,
          save_card: false,
          description: selected.label,
          metadata: { user_id: userId, plan, days: String(selected.days) },
          receipt: { email: true, sms: false },
          customer: {
            first_name: "مشترك",
            email: email || undefined
          },
          source: { id: "src_all" },
          redirect: { url: callbackUrl }
        })
      });

      const data = await res.json();
      if (!res.ok || !data?.transaction?.url) {
        console.error("Tap charge failed:", JSON.stringify(data).substring(0, 300));
        return Response.json({ error: "تعذّر إنشاء عملية الدفع" }, { status: 502 });
      }

      console.log("Tap charge created:", data.id);
      return Response.json({
        provider: "tap",
        paymentId: data.id,
        redirectUrl: data.transaction.url
      });
    }

    // ═══ ميسر ═══
    if (provider === "moyasar") {
      const key = process.env.MOYASAR_SECRET_KEY;
      const pubKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY;
      if (!key && !pubKey) {
        return Response.json({ error: "الدفع غير مهيأ", code: "GATEWAY_NOT_CONFIGURED" }, { status: 503 });
      }

      // ميسر يعمل بنموذج واجهة أمامية: نُرجع المعطيات ليبنيها العميل
      return Response.json({
        provider: "moyasar",
        publishableKey: pubKey,
        amount: selected.amount,
        currency: "SAR",
        description: selected.label,
        callbackUrl,
        metadata: { user_id: userId, plan, days: String(selected.days) }
      });
    }

    return Response.json({ error: "مزوّد دفع غير مدعوم" }, { status: 400 });

  } catch (error) {
    console.error("Checkout error:", error.message);
    return Response.json({ error: "حدث خطأ، حاول مرة أخرى" }, { status: 500 });
  }
}
