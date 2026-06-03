import { SECTOR_FINANCIALS, SUCCESS_RATES, SALARIES, getCityBrief, getFinancialBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

function _nfmt(n){ return (Number(n)||0).toLocaleString("en-US"); }

// متوسط هامش الربح من نص مثل "15-25%"
function marginMid(str){
  const nums = (String(str||"").match(/\d+/g) || []).map(Number);
  if (!nums.length) return 0.18;
  const avg = nums.length >= 2 ? (nums[0]+nums[1])/2 : nums[0];
  return avg / 100;
}

export async function POST(req) {
  try {
    const { budget, city, sector, target_profit } = await req.json();
    console.log("Suggestions Request:", { budget, city, sector, target_profit });

    if (!budget) {
      return Response.json({ error: "الميزانية مطلوبة" }, { status: 400 });
    }

    if (!process.env.CEREBRAS_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return Response.json({ error: "إعدادات الخدمة غير مكتملة - تأكد من مفاتيح API" }, { status: 500 });
    }

    // ميزانية وقت تحت حد Vercel
    const DEADLINE_MS = 54000;
    const _startTime = Date.now();
    const remaining = () => DEADLINE_MS - (Date.now() - _startTime);

    const budgetNum = parseInt(budget);
    const targetNum = target_profit ? parseInt(String(target_profit).replace(/\D/g, "")) : 0;
    const cityName = city ? city.trim() : null;
    const cityBrief = cityName ? (getCityBrief(cityName) || "") : "";

    // ═══ فلترة القطاعات حسب الميزانية + اشتقاق ربح واقعي من الأرقام الحقيقية ═══
    const allKeys = Object.keys(SECTOR_FINANCIALS);
    const affordable = allKeys.filter(s => SECTOR_FINANCIALS[s].setup_total.min <= budgetNum);
    const usableKeys = affordable.length ? affordable : allKeys; // لو الميزانية أقل من كل القطاعات، نمرّر الكل مع التنبيه

    function refLine(s){
      const f = SECTOR_FINANCIALS[s];
      const sr = SUCCESS_RATES[s] || { success: 50 };
      const realisticProfit = Math.round(f.revenue.medium * marginMid(f.profit_margin));
      const fits = f.setup_total.min <= budgetNum;
      return `- ${s}: تأسيس ${_nfmt(f.setup_total.min)}-${_nfmt(f.setup_total.max)} ريال، تكلفة شهرية ~${_nfmt(f.monthly_costs.mid)}، إيراد متوسط ~${_nfmt(f.revenue.medium)}، هامش ${f.profit_margin}، ربح شهري واقعي ~${_nfmt(realisticProfit)} ريال، نجاح القطاع ${sr.success}%${fits ? "" : " (الحد الأدنى للتأسيس أعلى من الميزانية)"}`;
    }

    let sectorContext;
    if (sector && sector !== "أخرى / غير مدرج" && SECTOR_FINANCIALS[sector]) {
      sectorContext = `القطاع المطلوب من المستخدم: ${sector}\n${getFinancialBrief(sector)}\n\nأرقام مرجعية مشتقّة:\n${refLine(sector)}`;
    } else {
      sectorContext = `القطاعات المتاحة وأرقامها المرجعية المشتقّة (مرتّبة حسب ملاءمة الميزانية):\n${usableKeys.map(refLine).join("\n")}`;
    }

    // ═══ كتلة الربح المستهدف ═══
    let targetBlock = "";
    if (targetNum > 0) {
      targetBlock = `

═══ الربح الشهري المستهدف من المستخدم: ${_nfmt(targetNum)} ريال ═══
مهمتك أن تكون صادقاً 100% بشأن واقعية هذا الهدف مقابل الميزانية المتاحة (${_nfmt(budgetNum)} ريال):
- إن كان الهدف واقعياً ضمن هذه الميزانية، رشّح المشاريع التي يقترب ربحها الواقعي من الهدف.
- إن كانت الفجوة كبيرة (الهدف أعلى بكثير مما تسمح به الميزانية)، قُلها بوضوح تام في budget_assessment، واشرح كم تحتاج فعلياً من رأس مال للوصول للهدف، ثم اقترح أقرب المسارات الواقعية: نماذج عالية الهامش، أو قابلة للتوسّع تدريجياً، أو رقمية منخفضة التكلفة. لا تَعِد المستخدم بأرباح وهمية لإرضائه.
- في كل اقتراح، اجعل monthly_profit_estimate رقماً واقعياً مشتقاً من الأرقام المرجعية، حتى لو كان أقل من الهدف.`;
    }

    const systemPrompt = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. مهمتك اقتراح مشاريع واقعية ومربحة تناسب ميزانية المستخدم بالضبط.

شخصيتك: صادق تماماً، واقعي، لا تجامل. تقترح فقط مشاريع حقيقية قابلة للتنفيذ فعلاً في السوق السعودي بالميزانية المعطاة.

مبدؤك: كل اقتراح يجب أن تكون تكلفة تأسيسه ضمن قدرة المستخدم المالية، وأرقامه مستندة إلى الأرقام المرجعية المعطاة لك (لا تخترع أرقاماً). لا تقترح مشاريع تتجاوز الميزانية، ولا مشاريع وهمية أو عامة.

ترجع JSON صحيح فقط، بدون أي نص قبله أو بعده، بدون علامات markdown.`;

    const userPrompt = `اقترح مشاريع استثمارية واقعية بناءً على المعطيات التالية:

الميزانية المتاحة: ${_nfmt(budgetNum)} ريال${cityName ? `\nالمدينة: ${cityName}` : '\nالمدينة: غير محددة (اقترح مشاريع تصلح لأغلب المدن السعودية)'}

${cityBrief}

${sectorContext}
${targetBlock}

الرواتب المرجعية: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}

═══ قواعد الاقتراح الصارمة ═══

1. اقترح 6 مشاريع محددة بأسماء واضحة وعملية (مثل: محمصة قهوة مختصة مع توصيل، مغسلة سيارات متنقلة، مركز دورات تدريبية أونلاين) — ممنوع الأوصاف العامة الفضفاضة.

2. كل مشروع يجب أن تكون تكلفة تأسيسه ضمن ${_nfmt(budgetNum)} ريال أو قريبة جداً منها. ممنوع اقتراح مشاريع تحتاج ضعف الميزانية. اعتمد على الأرقام المرجعية للقطاعات لتحديد ما يناسب الميزانية.

3. نوّع الاقتراحات: مشاريع آمنة مستقرة، ومشاريع نمو أعلى مخاطرة، وفكرة أو فكرتين مبتكرتين "خارج الصندوق" لكن قابلتين للتنفيذ فعلاً ضمن الميزانية.

4. الأرقام (التأسيس، الربح الشهري، التعادل) واقعية ومشتقّة من الأرقام المرجعية المعطاة. الربح الشهري = إيراد واقعي × هامش القطاع. كن متحفظاً.

5. لكل مشروع اذكر بصدق: لماذا يناسب هذه الميزانية، ومستوى المخاطرة، وأبرز تحدٍّ، ونصيحة نجاح عملية واحدة.

6. ${cityName ? `راعِ خصائص ${cityName} (حجمها، إيجاراتها، جمهورها) في اقتراحاتك وأرقامك.` : 'اقترح مشاريع مرنة تصلح لمدن متعددة.'}

أرجع JSON صحيح فقط بهذا الشكل:

{
  "budget_assessment": "<تقييم صريح 2-4 أسطر: هل هذه الميزانية جيدة؟ ما نوع المشاريع التي تفتحها؟ ما حدودها؟${targetNum>0 ? ' وهل الربح المستهدف واقعي مقابلها؟ وكم تحتاج فعلياً للوصول له؟' : ''}>",
  "suggestions": [
    {
      "name": "<اسم المشروع المحدد>",
      "sector": "<القطاع>",
      "type": "<آمن / نمو / مبتكر>",
      "setup_cost": "<التكلفة التقديرية بالريال - رقم أو نطاق>",
      "monthly_profit_estimate": "<تقدير الربح الشهري الواقعي بالريال>",
      "break_even": "<نقطة التعادل التقديرية بالأشهر>",
      "risk_level": "<منخفض / متوسط / عالي>",
      "why_fits": "<لماذا يناسب الميزانية - جملة واقعية>",
      "main_challenge": "<أبرز تحدٍّ يواجه هذا المشروع>",
      "success_tip": "<نصيحة عملية واحدة لنجاحه>"
    }
  ]
}

ملاحظة: مصفوفة suggestions يجب أن تحتوي 6 مشاريع بالضبط.`;

    // ═══ دوال الاستدعاء (سلسلة Cerebras → Groq → Gemini) ═══
    async function callCerebras() {
      const key = process.env.CEREBRAS_API_KEY;
      if (!key) throw new Error("CEREBRAS_NO_KEY");
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(22000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let res;
      try {
        res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.5, max_tokens: 5000, response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("CEREBRAS_FAIL_" + res.status);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("CEREBRAS_FAIL_PARSE");
      return parsed;
    }

    async function callGroq() {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error("GROQ_NO_KEY");
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(18000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.5, max_tokens: 5000, response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("GROQ_FAIL_" + res.status);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("GROQ_FAIL_PARSE");
      return parsed;
    }

    async function callGemini() {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_NO_KEY");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(18000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 5000, responseMimeType: "application/json" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("GEMINI_FAIL_" + res.status);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("GEMINI_FAIL_PARSE");
      return parsed;
    }

    async function callAI() {
      if (process.env.CEREBRAS_API_KEY && remaining() > 6000) {
        try { return await callCerebras(); }
        catch (e1) { console.log("Cerebras suggest failed (" + e1.message + ")"); }
      }
      if (process.env.GROQ_API_KEY && remaining() > 6000) {
        try { return await callGroq(); }
        catch (e2) { console.log("Groq suggest failed (" + e2.message + ")"); }
      }
      if (process.env.GEMINI_API_KEY && remaining() > 6000) {
        return await callGemini();
      }
      throw new Error("timeout_budget");
    }

    console.log("═══ توليد الاقتراحات ═══");
    const result = await callAI();
    return Response.json(result);

  } catch (error) {
    console.error("Suggest Server Error:", error.message);
    let userMsg = "تعذّر إعداد الاقتراحات، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("FAIL_PARSE")) userMsg = "تعذّرت معالجة النتيجة - حاول مرة أخرى بعد لحظات";
    else if (msg.includes("aborted") || msg.includes("timeout")) userMsg = "العملية أخذت وقتاً أطول من المتوقع - حاول مرة أخرى";
    else if (msg.includes("429") || msg.includes("rate")) userMsg = "الخدمة مزدحمة الآن - حاول بعد دقيقة";
    return Response.json({ error: userMsg, debug: msg }, { status: 500 });
  }
}

// استخراج JSON من نص قد يحتوي زوائد
function extractJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) {}
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) { try { return JSON.parse(cleaned.substring(start, i + 1)); } catch (e) { return null; } } }
  }
  return null;
}
