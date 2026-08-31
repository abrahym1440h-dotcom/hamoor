export const runtime = 'nodejs';
export const maxDuration = 40;

// ═══════════════════════════════════════════════════
// المستشار هامور — محادثة مبنية على DeepSeek v4-flash
// يستقبل: بيانات التحليل الأصلي + الأرقام الفعلية اللي أدخلها العميل + سؤاله
// ═══════════════════════════════════════════════════

function extractJSON(text) {
  if (!text) return null;
  let cleaned = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "");
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(cleaned.substring(start, i + 1)); } catch (e) { return null; }
      }
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const { analysis, financeEntries, history, message } = await req.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      return Response.json({ error: "المستشار غير مفعّل بعد" }, { status: 503 });
    }

    // ═══ بناء سياق المشروع من التحليل الأصلي ═══
    const idea = analysis?.idea || "غير محدد";
    const city = analysis?.city || "غير محددة";
    const budget = analysis?.budget || "0";
    const fa = analysis?.financial_analysis || {};
    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const breakEven = fa.break_even_months || "غير محسوبة";

    // ═══ بناء سياق الأرقام الفعلية اللي أدخلها العميل ═══
    let financeContext = "لم يُدخل صاحب المشروع أي أرقام فعلية بعد.";
    if (financeEntries && financeEntries.length > 0) {
      financeContext = "الأرقام الفعلية التي سجّلها صاحب المشروع بنفسه (الأحدث أولاً):\n";
      financeEntries.slice(0, 10).forEach(e => {
        financeContext += `- ${e.entry_date}: إيراد ${e.revenue||0} ريال، مصروفات ${e.expenses||0} ريال، ربح ${e.profit||0} ريال، رصيد نقدي ${e.cash_balance||0} ريال${e.note ? " — ملاحظة: " + e.note : ""}\n`;
      });
    }

    const systemPrompt = `أنت "المستشار هامور" — مستشار أعمال سعودي خبير، متابع مباشرة لمشروع تجاري صغير معيّن ويعرف تفاصيله بالكامل.

بيانات المشروع الأصلية (من دراسة الجدوى):
- الفكرة: ${idea}
- المدينة: ${city}
- الميزانية: ${budget} ريال
- إجمالي التأسيس المقدّر: ${setupTotal} ريال
- التكاليف الشهرية المقدّرة: ${monthlyTotal} ريال
- نقطة التعادل المقدّرة: ${breakEven}

${financeContext}

أسلوبك:
- عربي فصيح، مباشر، بدون حشو أو مجاملة زائدة
- تجاوب بالأرقام الفعلية التي أدخلها صاحب المشروع إن وُجدت، لا التقديرية فقط
- لو سأل عن حساب أو مقارنة، اعرض الأرقام بوضوح
- لو لاحظت مشكلة في أرقامه (خسارة متكررة، تجاوز ميزانية) نبّهه بصراحة واقترح حلاً عملياً
- ردودك مختصرة ومركّزة (3-6 أسطر عادة)، إلا لو طلب تفصيلاً أكبر
- لا تخترع أرقاماً غير معطاة لك`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10).map(m => ({ role: m.role === "advisor" ? "assistant" : "user", content: m.content })),
      { role: "user", content: message }
    ];

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 35000);
    let response;
    try {
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages,
          temperature: 0.4,
          max_tokens: 800
        }),
        signal: ctrl.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek Error:", response.status, errText.substring(0, 300));
      return Response.json({ error: "تعذّر الوصول للمستشار الآن، حاول مرة أخرى" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return Response.json({ error: "لم يصل رد من المستشار" }, { status: 502 });
    }

    return Response.json({ reply });

  } catch (error) {
    console.error("Advisor Error:", error.message);
    let userMsg = "حدث خطأ، حاول مرة أخرى";
    if (error.message?.includes("aborted")) userMsg = "استغرق الرد وقتاً طويلاً، حاول مرة أخرى";
    return Response.json({ error: userMsg }, { status: 500 });
  }
}
