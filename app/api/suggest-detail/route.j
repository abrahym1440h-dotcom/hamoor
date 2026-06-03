import { getCityBrief, getFinancialBrief, getSectorBrief, detectSector } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { name, sector: userSector, city, budget } = await req.json();
    if (!name) {
      return Response.json({ error: "اسم المشروع مطلوب" }, { status: 400 });
    }

    if (!process.env.CEREBRAS_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return Response.json({ error: "إعدادات الخدمة غير مكتملة" }, { status: 500 });
    }

    const DEADLINE_MS = 54000;
    const _startTime = Date.now();
    const remaining = () => DEADLINE_MS - (Date.now() - _startTime);

    const cityName = city ? String(city).split(" - ")[0].trim() : null;
    const sector = userSector || detectSector(name);
    const cityBrief = cityName ? (getCityBrief(cityName) || "") : "";
    const financialBrief = getFinancialBrief(sector) || "";
    const sectorBrief = getSectorBrief(sector) || "";
    const budgetLine = budget ? `الميزانية المتاحة: ${parseInt(budget).toLocaleString("en-US")} ريال` : "الميزانية: غير محددة";

    const systemPrompt = `أنت خبير استثماري ومدرّب أعمال سعودي. تكتب أدلّة تعليمية عملية بالعربية الفصحى لرواد الأعمال المبتدئين، بأسلوب إنساني واضح ومباشر، خطوة بخطوة. صادق وواقعي ولا تجامل. ترجع JSON صحيحاً فقط بدون أي نص قبله أو بعده وبدون markdown.`;

    const userPrompt = `اكتب دليلاً تعليمياً شاملاً ومفصّلاً ("بالتفصيل الممل") لشخص يريد أن يبدأ هذا المشروع في السوق السعودي. علّمه كيف ينفّذه فعلياً من الصفر.

المشروع: ${name}
القطاع: ${sector}
${cityName ? `المدينة: ${cityName}` : ''}
${budgetLine}

${cityBrief}

${sectorBrief}

${financialBrief}

اكتب بلغة عربية فصحى فقط (ممنوع أي حرف من لغة أخرى). كن عملياً وملموساً وواقعياً. اعتمد على الأرقام المرجعية أعلاه. لا تخترع أرقاماً تخالفها.

أرجع JSON صحيحاً فقط بهذا الشكل:

{
  "title": "<عنوان الدليل>",
  "summary": "<مقدمة 4-5 أسطر: ما هذا المشروع، لمن يصلح، وما الذي يحدد نجاحه أو فشله بصراحة>",
  "steps": [
    {"title": "<عنوان الخطوة>", "detail": "<شرح عملي مفصّل لما يفعله بالضبط في هذه الخطوة، من سطرين إلى أربعة>"},
    {"title": "<خطوة>", "detail": "<شرح مفصّل>"},
    {"title": "<خطوة>", "detail": "<شرح مفصّل>"},
    {"title": "<خطوة>", "detail": "<شرح مفصّل>"},
    {"title": "<خطوة>", "detail": "<شرح مفصّل>"},
    {"title": "<خطوة>", "detail": "<شرح مفصّل>"}
  ],
  "costs_breakdown": [
    {"item": "<بند تكلفة تأسيسية>", "amount": "<المبلغ التقديري بالريال>"},
    {"item": "<بند>", "amount": "<مبلغ>"},
    {"item": "<بند>", "amount": "<مبلغ>"},
    {"item": "<بند>", "amount": "<مبلغ>"}
  ],
  "licenses": [
    {"name": "<اسم الترخيص أو التصريح المطلوب>", "issuer": "<جهة الإصدار>"},
    {"name": "<ترخيص>", "issuer": "<جهة الإصدار>"}
  ],
  "marketing_plan": ["<خطوة تسويقية عملية>", "<خطوة>", "<خطوة>", "<خطوة>"],
  "tips": ["<نصيحة عملية من خبير>", "<نصيحة>", "<نصيحة>", "<نصيحة>"],
  "risks": [
    {"risk": "<مخاطرة حقيقية>", "mitigation": "<كيف يتعامل معها عملياً>"},
    {"risk": "<مخاطرة>", "mitigation": "<المعالجة>"},
    {"risk": "<مخاطرة>", "mitigation": "<المعالجة>"}
  ],
  "first_month_plan": "<خطة عملية واقعية لأول 30 يوماً: ماذا يفعل أسبوعاً بأسبوع>",
  "success_factors": ["<عامل نجاح حاسم>", "<عامل>", "<عامل>"],
  "honest_verdict": "<حكم صريح أخير: هل يستحق هذا المشروع المخاطرة؟ ولمن تنصح به ولمن لا تنصح؟>"
}`;

    async function callCerebras() {
      const key = process.env.CEREBRAS_API_KEY;
      if (!key) throw new Error("CEREBRAS_NO_KEY");
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(24000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let res;
      try {
        res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.5, max_tokens: 6000, response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("CEREBRAS_FAIL_" + res.status);
      const data = await res.json();
      const parsed = extractJSON(data.choices?.[0]?.message?.content);
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
            temperature: 0.5, max_tokens: 6000, response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new Error("GROQ_FAIL_" + res.status);
      const data = await res.json();
      const parsed = extractJSON(data.choices?.[0]?.message?.content);
      if (!parsed) throw new Error("GROQ_FAIL_PARSE");
      return parsed;
    }

    async function callGemini() {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_NO_KEY");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(20000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 6000, responseMimeType: "application/json" }
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
        catch (e1) { console.log("Cerebras detail failed (" + e1.message + ")"); }
      }
      if (process.env.GROQ_API_KEY && remaining() > 6000) {
        try { return await callGroq(); }
        catch (e2) { console.log("Groq detail failed (" + e2.message + ")"); }
      }
      if (process.env.GEMINI_API_KEY && remaining() > 6000) {
        return await callGemini();
      }
      throw new Error("timeout_budget");
    }

    console.log("═══ توليد دليل التفاصيل: " + name + " ═══");
    const guide = await callAI();
    guide._project = name;
    return Response.json(guide);

  } catch (error) {
    console.error("Suggest-detail Error:", error.message);
    let userMsg = "تعذّر إعداد الدليل، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("FAIL_PARSE")) userMsg = "تعذّرت معالجة الدليل - حاول مرة أخرى بعد لحظات";
    else if (msg.includes("aborted") || msg.includes("timeout")) userMsg = "العملية أخذت وقتاً أطول من المتوقع - حاول مرة أخرى";
    else if (msg.includes("429") || msg.includes("rate")) userMsg = "الخدمة مزدحمة الآن - حاول بعد دقيقة";
    return Response.json({ error: userMsg, debug: msg }, { status: 500 });
  }
}

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
