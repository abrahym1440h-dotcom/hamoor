import { SECTOR_FINANCIALS, detectSector } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

function numWithCommas(n){
  const s = String(Math.round(Number(n)||0));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export async function POST(req) {
  try {
    const { original, edits } = await req.json();

    if (!original || !edits) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const idea = original.idea || "";
    const city = original.city || "";
    const sector = original.sector || detectSector(idea);
    const oldBudget = parseInt(original.budget) || 0;
    const newBudget = edits.budget ? parseInt(edits.budget) : oldBudget;

    console.log("═══ إعادة حساب ═══");
    console.log("Edits:", edits);

    const f = original.financial_analysis || {};
    const sc = f.setup_costs || {};
    const mc = f.monthly_costs || {};
    const rp = f.revenue_projection || {};

    // ═══ بناء وصف التعديلات للنموذج ═══
    const changes = [];
    if (edits.rent && parseInt(edits.rent) > 0) {
      changes.push(`الإيجار السنوي الفعلي: ${numWithCommas(edits.rent)} ريال (كان التقدير ${numWithCommas((mc.rent||0)*12)} ريال سنوياً)`);
    }
    if (edits.budget && parseInt(edits.budget) !== oldBudget) {
      changes.push(`الميزانية الفعلية: ${numWithCommas(newBudget)} ريال (كانت ${numWithCommas(oldBudget)} ريال)`);
    }
    if (edits.staff_count) {
      changes.push(`عدد الموظفين الفعلي: ${edits.staff_count}`);
    }
    if (edits.equipment && parseInt(edits.equipment) > 0) {
      changes.push(`تكلفة المعدات الفعلية: ${numWithCommas(edits.equipment)} ريال (كان التقدير ${numWithCommas(sc.equipment||0)} ريال)`);
    }
    if (edits.note && edits.note.trim()) {
      changes.push(`ملاحظة من صاحب المشروع: ${edits.note.trim().substring(0, 150)}`);
    }

    if (changes.length === 0) {
      return Response.json({ error: "لم يتم تعديل أي شيء" }, { status: 400 });
    }

    const sectorData = SECTOR_FINANCIALS[sector];
    const sectorHint = sectorData
      ? `نطاقات القطاع المرجعية: تأسيس ${numWithCommas(sectorData.setup_total.min)} - ${numWithCommas(sectorData.setup_total.max)} ريال، هامش ${sectorData.profit_margin}.`
      : "";

    const prompt = `أنت خبير مالي سعودي. لديك دراسة جدوى سابقة لمشروع، وصاحب المشروع عدّل بعض الأرقام بناءً على الواقع الفعلي. أعد حساب الأرقام المالية فقط.

المشروع: ${idea}
المدينة: ${city}
القطاع: ${sector}
${sectorHint}

الأرقام السابقة:
- تكاليف التأسيس: ضمان إيجار ${numWithCommas(sc.rent_deposit||0)}، تجهيز وديكور ${numWithCommas(sc.renovation||0)}، معدات ${numWithCommas(sc.equipment||0)}، تراخيص ${numWithCommas(sc.licenses||0)}، مخزون أولي ${numWithCommas(sc.initial_inventory||0)}، تسويق إطلاق ${numWithCommas(sc.marketing_launch||0)}، رأس مال تشغيلي ${numWithCommas(sc.working_capital||0)}. الإجمالي ${numWithCommas(sc.total||0)}
- التكاليف الشهرية: إيجار ${numWithCommas(mc.rent||0)}، رواتب ${numWithCommas(mc.salaries||0)}، فواتير ${numWithCommas(mc.utilities||0)}، مواد ${numWithCommas(mc.materials||0)}، تسويق ${numWithCommas(mc.marketing||0)}، صيانة ${numWithCommas(mc.maintenance||0)}، أخرى ${numWithCommas(mc.other||0)}. الإجمالي ${numWithCommas(mc.total||0)}
- الإيرادات: شهر 1: ${numWithCommas(rp.month_1||0)}، شهر 3: ${numWithCommas(rp.month_3||0)}، شهر 6: ${numWithCommas(rp.month_6||0)}، شهر 12: ${numWithCommas(rp.month_12||0)}

التعديلات التي أدخلها صاحب المشروع:
${changes.map(c => "- " + c).join("\n")}

المطلوب:
1. عدّل البنود المتأثرة مباشرة بالتعديلات فقط. البنود غير المتأثرة اتركها كما هي.
2. إذا انخفض الإيجار، خفّض ضمان الإيجار بنفس النسبة (الضمان عادة 3-6 أشهر إيجار).
3. إذا تغيّر عدد الموظفين، عدّل بند الرواتب بما يتناسب.
4. الإيرادات لا تتغير إلا إذا كان التعديل يؤثر عليها منطقياً (مثل تغيّر عدد الموظفين يؤثر على الطاقة الاستيعابية).
5. اكتب جملة واحدة تشرح أثر التعديل.

قواعد صارمة:
- اللغة عربية فصحى فقط.
- مجموع بنود التأسيس = الإجمالي، ومجموع البنود الشهرية = الإجمالي. تحقق يدوياً.
- لا تخترع أرقاماً بعيدة عن الواقع.

أرجع JSON فقط بدون أي نص قبله أو بعده:
{
  "setup_costs": {"rent_deposit": <رقم>, "renovation": <رقم>, "equipment": <رقم>, "licenses": <رقم>, "initial_inventory": <رقم>, "marketing_launch": <رقم>, "working_capital": <رقم>, "total": <رقم>},
  "monthly_costs": {"rent": <رقم>, "salaries": <رقم>, "utilities": <رقم>, "materials": <رقم>, "marketing": <رقم>, "maintenance": <رقم>, "other": <رقم>, "total": <رقم>},
  "revenue_projection": {"month_1": <رقم>, "month_3": <رقم>, "month_6": <رقم>, "month_12": <رقم>, "year_2_monthly": <رقم>, "year_3_monthly": <رقم>},
  "impact_note": "<جملة واحدة عن أثر التعديل>"
}`;

    // ═══ استدعاء Cerebras ثم Groq ثم Gemini ═══
    async function callCerebras(p) {
      const key = process.env.CEREBRAS_API_KEY;
      if (!key) throw new Error("NO_KEY");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      let res;
      try {
        res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [{ role: "user", content: p }],
            temperature: 0.25,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("CEREBRAS_" + res.status);
      const d = await res.json();
      const t = d.choices?.[0]?.message?.content;
      if (!t) throw new Error("EMPTY");
      const parsed = extractJSON(t);
      if (!parsed) throw new Error("PARSE");
      return parsed;
    }

    async function callGroq(p) {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error("NO_KEY");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: p }],
            temperature: 0.25,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("GROQ_" + res.status);
      const d = await res.json();
      const t = d.choices?.[0]?.message?.content;
      if (!t) throw new Error("EMPTY");
      const parsed = extractJSON(t);
      if (!parsed) throw new Error("PARSE");
      return parsed;
    }

    let updated;
    try {
      updated = await callCerebras(prompt);
      console.log("Recalc via Cerebras");
    } catch (e1) {
      console.log("Cerebras failed (" + e1.message + "), trying Groq");
      updated = await callGroq(prompt);
      console.log("Recalc via Groq");
    }

    // ═══ دمج النتائج مع التحليل الأصلي ═══
    const result = JSON.parse(JSON.stringify(original));
    result.financial_analysis = result.financial_analysis || {};

    if (updated.setup_costs) result.financial_analysis.setup_costs = updated.setup_costs;
    if (updated.monthly_costs) result.financial_analysis.monthly_costs = updated.monthly_costs;
    if (updated.revenue_projection) result.financial_analysis.revenue_projection = updated.revenue_projection;

    result.budget = String(newBudget);
    result._edited = true;
    result._edit_note = updated.impact_note || "تم تحديث الأرقام بناءً على معطياتك الفعلية";
    result._budget = newBudget;
    result._sector = sector;

    const validated = validateFinancials(result);
    delete validated._budget;
    delete validated._sector;

    console.log("Recalc complete");
    return Response.json(validated);

  } catch (error) {
    console.error("Recalc Error:", error.message);
    let userMsg = "تعذّر إعادة الحساب، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("PARSE")) userMsg = "تعذّر قراءة النتيجة - حاول مرة أخرى";
    else if (msg.includes("aborted")) userMsg = "استغرقت العملية وقتاً طويلاً - حاول مرة أخرى";
    else if (msg.includes("429")) userMsg = "الخدمة مزدحمة الآن - حاول بعد دقيقة";
    return Response.json({ error: userMsg, debug: msg }, { status: 500 });
  }
}

// ═══ استخراج JSON من نص قد يحتوي على زوائد ═══
function extractJSON(text) {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) {
        const block = cleaned.substring(start, i + 1);
        try { return JSON.parse(block); } catch (e) { return null; }
      }
    }
  }
  return null;
}

// ═══ طبقة التحقق المالي (نفس منطق التحليل الأساسي) ═══
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      sc.total = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                 (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                 (sc.working_capital||0);
    }

    if (Array.isArray(result.equipment_breakdown) && result.equipment_breakdown.length && fa.setup_costs) {
      const breakdownSum = result.equipment_breakdown.reduce((s, x) => s + (x.cost || 0), 0);
      const equipmentValue = fa.setup_costs.equipment || 0;
      if (breakdownSum > 0 && equipmentValue > 0 && breakdownSum !== equipmentValue) {
        const ratio = equipmentValue / breakdownSum;
        result.equipment_breakdown.forEach(x => { x.cost = Math.round((x.cost || 0) * ratio); });
      }
    }

    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      mc.total = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                 (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                 (mc.other||0);
    }

    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rp = fa.revenue_projection || {};
    const rev12 = rp.month_12 || 0;

    if (setupTotal > 0 && rev12 > monthlyTotal) {
      const monthlyProfit = rev12 - monthlyTotal;
      const be = Math.ceil(setupTotal / monthlyProfit);
      fa.break_even_months = be;
      if (result.break_even_detail) result.break_even_detail.months = be;
    }

    const avgRevY1 = ((rp.month_1||0)*2 + (rp.month_3||0)*3 + (rp.month_6||0)*3 + rev12*4) / 12;
    fa.annual_profit_year1 = Math.round((avgRevY1 - monthlyTotal) * 12);
    const y3 = rp.year_3_monthly || rev12;
    fa.annual_profit_year3 = Math.round((y3 - monthlyTotal) * 12);

    if (setupTotal > 0) {
      fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);

      if (fa.roi_percentage > 150 && rev12 > 0) {
        const expectedAvgRatio = avgRevY1 / rev12;
        if (expectedAvgRatio > 0.75) {
          const newRev1 = Math.round(rev12 * 0.25);
          const newRev3 = Math.round(rev12 * 0.45);
          const newRev6 = Math.round(rev12 * 0.70);
          rp.month_1 = newRev1;
          rp.month_3 = newRev3;
          rp.month_6 = newRev6;
          const newAvgY1 = (newRev1*2 + newRev3*3 + newRev6*3 + rev12*4) / 12;
          fa.annual_profit_year1 = Math.round((newAvgY1 - monthlyTotal) * 12);
          fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
        }
      }
    }

    // تحديث القرار والنقاط حسب الميزانية الجديدة
    const budget = result._budget || 0;
    if (budget > 0 && setupTotal > 0) {
      const surplus = budget - setupTotal;
      if (surplus >= 0) {
        const surplusRatio = surplus / setupTotal;
        let bonus = 0;
        if (surplusRatio >= 1.5) bonus = 20;
        else if (surplusRatio >= 1.0) bonus = 15;
        else if (surplusRatio >= 0.5) bonus = 10;
        else if (surplusRatio >= 0.25) bonus = 6;
        else if (surplusRatio > 0) bonus = 3;
        const base = Math.min(70, result.score || 60);
        result.score = Math.min(90, base + bonus);
        result.decision_type = "positive";
        result.decision = "ميزانيتك كافية لتأسيس المشروع";
        result.summary = `ميزانيتك البالغة ${numWithCommas(budget)} ريال تكفي لتغطية تكلفة التأسيس المقدّرة بـ ${numWithCommas(setupTotal)} ريال، مع فائض قدره ${numWithCommas(surplus)} ريال يمكن استخدامه كرأس مال احتياطي يقوّي وضع مشروعك.`;
      } else {
        const shortage = Math.abs(surplus);
        result.score = Math.min(45, result.score || 40);
        result.decision_type = "negative";
        result.decision = "الميزانية لا تغطي تكلفة التأسيس";
        result.summary = `تكلفة التأسيس المقدّرة ${numWithCommas(setupTotal)} ريال تتجاوز ميزانيتك البالغة ${numWithCommas(budget)} ريال بمقدار ${numWithCommas(shortage)} ريال. تحتاج إلى تدبير هذا الفارق أو تقليص نطاق المشروع.`;
      }
    }

    return result;
  } catch (e) {
    console.error("validateFinancials error:", e.message);
    return result;
  }
}
