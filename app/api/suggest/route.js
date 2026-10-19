import { SECTOR_FINANCIALS, SUCCESS_RATES, getCityBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════
//  فلسفة هذا الملف:
//  - الذكاء الاصطناعي يقترح «الأفكار» فقط (الاسم، الشرح، الابتكار).
//  - كل رقم مالي (التأسيس، رأس المال التشغيلي، الربح، التعادل) يحسبه الكود
//    من جداول القطاعات في data.js، فلا يخترع الموديل أرقاماً ولا تتناقض.
//  - الأفكار التي لا تناسب الميزانية بأرقام واقعية تُحذف، والعدد يتغير حسب الميزانية.
// ═══════════════════════════════════════════════════════════════

const nf = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");
const KEYS = Object.keys(SECTOR_FINANCIALS);
const TIERS = ["lean", "standard", "premium"];
const TIER_LABEL = { lean: "نسخة مصغّرة", standard: "تجهيز عادي", premium: "تجهيز كامل" };
const RESERVE_MONTHS = 2;      // رأس مال تشغيلي يكفي شهرين
const MAX_RESULTS = 6;
const lerp = (a, b, t) => a + (b - a) * t;
const ideasWord = (n) => n === 1 ? "فكرة واحدة" : n === 2 ? "فكرتين" : `${n} أفكار`;
const sectorsWord = (n) => n === 1 ? "قطاع واحد" : n === 2 ? "قطاعين" : n <= 10 ? `${n} قطاعات` : `${n} قطاعاً`;

function firstNums(str, n = 2) {
  return (String(str || "").match(/\d+(?:\.\d+)?/g) || []).slice(0, n).map(Number);
}
function marginMid(str) {
  const nums = firstNums(str, 2);
  if (!nums.length) return 0.18;
  const avg = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
  return avg / 100;
}
function tableBE(str) {
  const nums = firstNums(str, 2);
  if (nums.length >= 2) return [nums[0], nums[1]];
  if (nums.length === 1) return [nums[0], nums[0]];
  return null;
}
function niceRound(n) {
  const step = n >= 100000 ? 5000 : n >= 20000 ? 1000 : 500;
  return Math.round(n / step) * step;
}
// «80,000 إلى 95,000» — تُقرأ صح داخل الواجهة العربية (بدون شرطة تنعكس)
function rangeStr(a, b) {
  const x = niceRound(a), y = niceRound(b);
  return x === y ? nf(x) : `${nf(x)} إلى ${nf(y)}`;
}

// ═══ المستويات الثلاثة لكل قطاع (مصغّر / عادي / كامل) من أرقام الجدول نفسه ═══
function tierDefs(f) {
  const s = f.setup_total, r = f.revenue, c = f.monthly_costs;
  return {
    lean:     { setup: [s.min, lerp(s.min, s.mid, 0.3)],        cost: c.min,                    rev: [r.weak, lerp(r.weak, r.medium, 0.5)] },
    standard: { setup: [lerp(s.min, s.mid, 0.5), s.mid],        cost: lerp(c.min, c.mid, 0.5),   rev: [lerp(r.weak, r.medium, 0.5), r.medium] },
    premium:  { setup: [s.mid, lerp(s.mid, s.max, 0.5)],        cost: c.mid,                    rev: [r.medium, lerp(r.medium, r.strong, 0.5)] }
  };
}

function evaluate(sector, tier, budget) {
  const f = SECTOR_FINANCIALS[sector];
  const t = tierDefs(f)[tier];
  const workingCapital = RESERVE_MONTHS * t.cost;
  const m = marginMid(f.profit_margin);
  let setupLo = t.setup[0], setupHi = t.setup[1];
  let profitLo = t.rev[0] * m, profitHi = t.rev[1] * m;

  // مريح: الحد الأعلى للتأسيس + رأس المال التشغيلي داخل الميزانية
  // ضيّق: الحد الأدنى فقط يناسب → نقصّ نطاق التأسيس على ما تسمح به الميزانية ونخفّض سقف الربح للتحفّظ
  let fit = null;
  if (setupHi + workingCapital <= budget) fit = "comfortable";
  else if (setupLo + workingCapital <= budget) {
    fit = "tight";
    setupHi = Math.max(setupLo, budget - workingCapital);
    profitHi = lerp(profitLo, profitHi, 0.5);
  }

  const setupMid = (setupLo + setupHi) / 2;
  const totalNeeded = setupHi + workingCapital;
  let beLo = profitHi > 0 ? setupMid / profitHi : Infinity;
  let beHi = profitLo > 0 ? setupMid / profitLo : Infinity;
  const tbe = tableBE(f.break_even_months);
  if (tbe) { beLo = Math.max(beLo, tbe[0]); beHi = Math.max(beHi, tbe[0]); } // لا نتفاءل أكثر من الجدول
  if (beHi < beLo) beHi = beLo;

  return { sector, tier, setupLo, setupHi, setupMid, workingCapital, totalNeeded, profitLo, profitHi, beLo, beHi, fit, margin: m };
}

function riskFor(sector, bump) {
  const sr = SUCCESS_RATES[sector] && Number(SUCCESS_RATES[sector].success);
  let level = 1;                                    // 0 منخفض، 1 متوسط، 2 عالي
  if (Number.isFinite(sr)) level = sr >= 65 ? 0 : sr >= 50 ? 1 : 2;
  level = Math.min(2, level + (bump ? 1 : 0));
  return ["منخفض", "متوسط", "عالي"][level];
}

function cleanStr(v, max = 420) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}
function matchSector(name) {
  const n = cleanStr(name, 60);
  if (!n) return null;
  if (SECTOR_FINANCIALS[n]) return n;
  return KEYS.find(k => n.includes(k) || k.includes(n)) || null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { budget, city, sector, target_profit, operator, premises } = body;
    console.log("Suggestions Request:", { budget, city, sector, target_profit, operator, premises });

    if (!budget) return Response.json({ error: "الميزانية مطلوبة" }, { status: 400 });
    const budgetNum = parseInt(String(budget).replace(/\D/g, ""));
    if (!budgetNum || budgetNum < 1000) {
      return Response.json({ error: "أدخل ميزانية صحيحة (1,000 ريال على الأقل)" }, { status: 400 });
    }

    if (!process.env.CEREBRAS_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY &&
        !process.env.OPENROUTER_API_KEY && !process.env.ZAI_API_KEY) {
      return Response.json({ error: "إعدادات الخدمة غير مكتملة - تأكد من مفاتيح API" }, { status: 500 });
    }

    const DEADLINE_MS = 54000;
    const _startTime = Date.now();
    const remaining = () => DEADLINE_MS - (Date.now() - _startTime);

    const targetNum = target_profit ? parseInt(String(target_profit).replace(/\D/g, "")) || 0 : 0;
    const cityName = city ? String(city).trim() : null;
    const cityBrief = cityName ? (getCityBrief(cityName) || "") : "";
    const filterSector = sector && SECTOR_FINANCIALS[sector] ? sector : null;
    const opHint = operator === "self"
      ? "صاحب المشروع سيديره بنفسه (يفضّل مشاريع يقدر يشغّلها وحده أو بفريق صغير جداً)."
      : operator === "staff" ? "صاحب المشروع سيعتمد على موظفين ومدير (مشاريع قابلة للإدارة عن بعد مقبولة)." : "";
    const premHint = premises === "own"
      ? "يملك موقعاً/محلاً جاهزاً (يوفّر الإيجار؛ لم نخصمه من الأرقام تحفّظاً)."
      : premises === "rent" ? "سيستأجر موقعاً."
      : premises === "online" ? "لا يريد موقعاً مادياً: فضّل المشاريع الرقمية أو المنزلية أو المتنقلة." : "";

    // ═══ أي القطاعات/المستويات تناسب الميزانية بأرقام الجدول ═══
    function feasibleMap(allowTight, scope) {
      const out = {};
      scope.forEach(s => {
        const list = TIERS.map(t => evaluate(s, t, budgetNum))
          .filter(ev => ev.fit === "comfortable" || (allowTight && ev.fit === "tight"));
        if (list.length) out[s] = list;
      });
      return out;
    }

    function tierLine(ev) {
      return `${ev.tier} (${TIER_LABEL[ev.tier]}): تأسيس ${nf(niceRound(ev.setupLo))}-${nf(niceRound(ev.setupHi))}، ربح شهري ${nf(niceRound(ev.profitLo))}-${nf(niceRound(ev.profitHi))}`;
    }

    // ═══ برومبت الأفكار ═══
    const systemPrompt = `أنت مستشار ابتكار ودراسات جدوى سعودي، معروف بإيجاد فرص ذكية قبل غيره. وظيفتك اقتراح أفكار مشاريع فقط؛ أما كل الأرقام المالية فيحسبها النظام آلياً من بيانات القطاعات، فلا تكتب أي مبلغ بالريال ولا نسب ربح ولا مدة تعادل داخل النصوص. صادق وواقعي، ولا تجامل. ترجع JSON صحيحاً فقط بدون أي نص قبله أو بعده وبدون markdown.`;

    function buildIdeasPrompt(fm, allowTight, rejectedNote) {
      const sectorsTxt = Object.keys(fm).map(s => `- ${s}\n   ${fm[s].map(tierLine).join("\n   ")}`).join("\n");
      const nAsk = 9;
      const nGlobal = 5;
      return `ميزانية المستخدم: ${nf(budgetNum)} ريال${cityName ? `\nالمدينة: ${cityName}` : "\nالمدينة: غير محددة (أفكار تصلح لأغلب المدن)"}
${cityBrief ? cityBrief + "\n" : ""}${opHint ? opHint + "\n" : ""}${premHint ? premHint + "\n" : ""}${targetNum > 0 ? `الربح الشهري الذي يطمح له: ${nf(targetNum)} ريال (اختر أفكاراً قد تقترب منه فعلاً، ولا تَعِد بما لا يناسب الميزانية).\n` : ""}
القطاعات المتاحة لهذه الميزانية والمستويات المناسبة لها (المستوى = حجم المشروع، والأرقام تقريبية من بيانات السوق):
${sectorsTxt}
${allowTight ? "\nملاحظة: بعض المستويات أعلاه تستهلك أغلب الميزانية وتترك رأس مال تشغيل محدود، فاختر منها بحذر." : ""}
${rejectedNote ? "\n" + rejectedNote + "\n" : ""}
${filterSector && scope.length === 1 ? `المستخدم اختار قطاع «${filterSector}»: كل الأفكار يجب أن تكون ضمنه (closest_sector = ${filterSector}) لكن بنماذج عمل مختلفة.\n` : ""}المطلوب: اقترح ${nAsk} أفكار مختلفة، منها ${nGlobal} على الأقل من النوع global.

النوع global = ابتكار ناجح فعلاً في دولة أخرى (اليابان، كوريا، أمريكا، أوروبا، الصين، تركيا، الهند، أستراليا، الإمارات…) ولا يزال غير منتشر في السعودية بحسب علمك، ويُكيَّف مع السوق والثقافة والأنظمة السعودية. فكرة تجعل القارئ يقول «ما سمعت بها من قبل». ممنوع اختراع شركات أو دول: اذكر البلد الذي تعرفه فعلاً، ولا تذكر اسم شركة إلا إذا كنت متأكداً تماماً. ولا تدّعِ أنها غير موجودة إطلاقاً في السعودية (قل «غير منتشرة»).
النوع proven = مشروع مجرّب ومستقر لكن بلمسة تميّز واضحة (ليس الفكرة المكررة المعتادة).

قواعد صارمة:
1. كل فكرة ترتبط بقطاع واحد من القائمة أعلاه فقط (closest_sector) وبمستوى scale من المستويات المذكورة لذلك القطاع فقط. الأفكار يمكن أن تشترك في القطاع نفسه.
2. أفكار مشروعة نظاماً وشرعاً في السعودية (لا كحول، لا قمار، لا ربا، لا شي مخالف)، وراعِ التراخيص والثقافة.
3. أسماء محددة وعملية، وممنوع الأوصاف العامة الفضفاضة.
4. لا تكتب أي رقم مالي في النصوص.

أرجع JSON بهذا الشكل فقط:
{
  "ideas": [
    {
      "name": "<اسم الفكرة المحدد>",
      "kind": "global أو proven",
      "closest_sector": "<اسم قطاع من القائمة بالضبط>",
      "scale": "lean أو standard أو premium",
      "origin_country": "<للنوع global فقط: الدولة التي نجحت فيها>",
      "origin_note": "<للنوع global فقط: جملة واحدة كيف تعمل هناك>",
      "why_new_in_saudi": "<للنوع global فقط: لماذا هي جديدة أو غير منتشرة في السعودية>",
      "saudi_adaptation": "<للنوع global فقط: كيف تتكيف مع السوق السعودي>",
      "why_fits": "<لماذا تناسب هذا المستخدم وميزانيته - جملة واحدة>",
      "main_challenge": "<أبرز تحدٍّ>",
      "success_tip": "<نصيحة عملية واحدة>"
    }
  ]
}`;
    }

    // ═══ أدوات الاستدعاء (نفس سلسلة المزودات السابقة مع إعادة المحاولة) ═══
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const errors = [];

    async function withRetry(fn, tries = 2, delayMs = 800) {
      let lastErr;
      for (let i = 0; i < tries; i++) {
        try { return await fn(); }
        catch (e) {
          lastErr = e;
          const retryable = /_FAIL_(429|500|502|503|504|PARSE)$/.test(e.message || "");
          if (!retryable || i === tries - 1 || remaining() < 9000) break;
          await sleep(delayMs * (i + 1));
        }
      }
      throw lastErr;
    }

    async function callOpenAICompat({ name, url, key, model, capMs, sys, usr, extraBody = {} }) {
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(capMs, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
            temperature: 0.8, max_tokens: 6000,
            response_format: { type: "json_object" },
            ...extraBody
          }),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`${name}_FAIL_${res.status}`);
        const data = await res.json();
        const parsed = extractJSON(data.choices?.[0]?.message?.content);
        if (!parsed || !Array.isArray(parsed.ideas) || !parsed.ideas.length) throw new Error(`${name}_FAIL_PARSE`);
        return parsed;
      } finally { clearTimeout(timer); }
    }

    async function callGeminiModel(model, sys, usr) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_NO_KEY");
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(18000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: sys + "\n\n" + usr }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 6000, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } }
          }),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error("GEMINI_FAIL_" + res.status);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
        const parsed = extractJSON(text);
        if (!parsed || !Array.isArray(parsed.ideas) || !parsed.ideas.length) throw new Error("GEMINI_FAIL_PARSE");
        return parsed;
      } finally { clearTimeout(timer); }
    }

    async function callGemini(sys, usr) {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_NO_KEY");
      let lastErr;
      for (const m of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
        if (remaining() < 6000) break;
        try { return await withRetry(() => callGeminiModel(m, sys, usr)); }
        catch (e) { lastErr = e; console.log(`Gemini ${m} failed (${e.message})`); }
      }
      throw lastErr || new Error("GEMINI_FAIL_NO_TIME");
    }

    async function callAI(sys, usr) {
      const providers = [
        { name: "Cerebras", enabled: !!process.env.CEREBRAS_API_KEY, run: () => withRetry(() => callOpenAICompat({ name: "CEREBRAS", url: "https://api.cerebras.ai/v1/chat/completions", key: process.env.CEREBRAS_API_KEY, model: process.env.CEREBRAS_MODEL || "gpt-oss-120b", capMs: 20000, sys, usr, extraBody: { reasoning_effort: "low" } })) },
        { name: "Groq", enabled: !!process.env.GROQ_API_KEY, run: () => withRetry(() => callOpenAICompat({ name: "GROQ", url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", capMs: 18000, sys, usr, extraBody: { reasoning_effort: "low" } })) },
        { name: "Gemini", enabled: !!process.env.GEMINI_API_KEY, run: () => callGemini(sys, usr) },
        { name: "OpenRouter", enabled: !!process.env.OPENROUTER_API_KEY, run: () => withRetry(() => callOpenAICompat({ name: "OPENROUTER", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b", capMs: 25000, sys, usr })) },
        { name: "Zai", enabled: !!process.env.ZAI_API_KEY, run: () => withRetry(() => callOpenAICompat({ name: "ZAI", url: "https://api.z.ai/api/paas/v4/chat/completions", key: process.env.ZAI_API_KEY, model: process.env.ZAI_MODEL || "glm-4.5-flash", capMs: 25000, sys, usr, extraBody: { thinking: { type: "disabled" } } })) }
      ];
      for (const p of providers) {
        if (!p.enabled) continue;
        if (remaining() < 6000) { errors.push(p.name + "_SKIPPED_NO_TIME"); break; }
        try { return await p.run(); }
        catch (e) { const m = e.message || String(e); errors.push(m); console.log(p.name + " suggest failed (" + m + ")"); }
      }
      throw new Error("ALL_PROVIDERS_FAILED: " + errors.join(" | "));
    }

    // ═══ تحويل فكرة من الموديل إلى اقتراح كامل بأرقام الكود ═══
    function buildSuggestion(raw, fm, allowTight) {
      const name = cleanStr(raw.name, 120);
      if (!name) return null;
      const sec = matchSector(raw.closest_sector || raw.sector);
      if (!sec || !fm[sec]) return null;
      const isGlobal = String(raw.kind || "").toLowerCase() === "global";
      let tier = TIERS.includes(String(raw.scale || "").toLowerCase()) ? String(raw.scale).toLowerCase() : "lean";
      const feasibleTiers = fm[sec].map(e => e.tier);
      let scaleAdjusted = false;
      if (!feasibleTiers.includes(tier)) {
        // المستوى المطلوب أكبر من الميزانية: ننزل لأعلى مستوى يناسبها بدل ما نحذف الفكرة
        const idx = TIERS.indexOf(tier);
        const lower = TIERS.slice(0, idx).reverse().find(t => feasibleTiers.includes(t));
        if (!lower) return null;
        tier = lower; scaleAdjusted = true;
      }
      const ev = fm[sec].find(e => e.tier === tier);
      if (!ev || ev.profitLo <= 0) return null;
      if (ev.beHi > 36) return null; // استرداد أطول من 3 سنوات: ليست فكرة قوية

      const beLo = Math.max(1, Math.ceil(ev.beLo)), beHi = Math.max(beLo, Math.ceil(ev.beHi));
      const globalFields = isGlobal ? {
        origin_country: cleanStr(raw.origin_country, 60),
        origin_note: cleanStr(raw.origin_note, 260),
        why_new_in_saudi: cleanStr(raw.why_new_in_saudi, 260),
        saudi_adaptation: cleanStr(raw.saudi_adaptation, 260)
      } : {};
      if (isGlobal && (!globalFields.origin_country || !globalFields.why_new_in_saudi)) return null; // ابتكار بلا مصدر ولا سبب = غير موثوق

      let targetFit = null;
      if (targetNum > 0) targetFit = ev.profitLo >= targetNum ? "meets" : ev.profitHi >= targetNum ? "possible" : "below";

      return {
        name,
        sector: sec,
        type: isGlobal ? "ابتكار عالمي" : (tier === "lean" ? "آمن" : "نمو"),
        is_global: isGlobal,
        ...globalFields,
        scale: tier,
        scale_label: TIER_LABEL[tier],
        scale_adjusted: scaleAdjusted,
        setup_cost: rangeStr(ev.setupLo, ev.setupHi),
        monthly_profit_estimate: rangeStr(ev.profitLo, ev.profitHi),
        break_even: beLo === beHi ? `حوالي ${beLo} شهر` : `${beLo} إلى ${beHi} شهر`,
        risk_level: riskFor(sec, isGlobal),
        reality_check: {
          setup: rangeStr(ev.setupLo, ev.setupHi),
          working_capital: nf(niceRound(ev.workingCapital)),
          total_needed: nf(niceRound(ev.totalNeeded)),
          budget: nf(budgetNum),
          left_over: nf(Math.max(0, niceRound(budgetNum - ev.totalNeeded))),
          fit: ev.fit
        },
        basis: "sector_data",
        basis_label: isGlobal ? `تقدير على أقرب قطاع (${sec})` : `من بيانات قطاع ${sec}`,
        target_fit: targetFit,
        why_fits: cleanStr(raw.why_fits),
        main_challenge: cleanStr(raw.main_challenge),
        success_tip: cleanStr(raw.success_tip),
        _profitHi: ev.profitHi
      };
    }

    // ═══ حالة الميزانية الصغيرة جداً (أقل من الحد الأدنى لكل القطاعات) ═══
    async function microSuggestions() {
      const sys2 = `أنت مستشار مشاريع صغيرة سعودي. صادق وواقعي، وتقدّم أفكاراً لميزانيات صغيرة جداً. ترجع JSON صحيحاً فقط بدون markdown.`;
      const usr2 = `ميزانية المستخدم صغيرة جداً: ${nf(budgetNum)} ريال${cityName ? `، المدينة: ${cityName}` : ""}. ${premHint} ${opHint}
لا توجد بيانات قطاعات بهذا الحجم، لذلك قدّم تقديراتك بحذر شديد.
اقترح 4 أفكار صغيرة (مشاريع منزلية/رقمية/متنقلة/خدمية)، منها فكرتان على الأقل من النوع global (ابتكار ناجح خارج السعودية وغير منتشر فيها بحسب علمك، بدون اختراع دول أو شركات)، ومشروعة نظاماً وشرعاً في السعودية.
الأرقام (setup, profit_low, profit_high) بالريال كأرقام صحيحة: التأسيس لا يتجاوز 80% من الميزانية، والربح الشهري متحفظ جداً.
أرجع JSON فقط:
{"ideas":[{"name":"","kind":"global أو proven","origin_country":"","origin_note":"","why_new_in_saudi":"","saudi_adaptation":"","setup":0,"profit_low":0,"profit_high":0,"why_fits":"","main_challenge":"","success_tip":""}]}`;
      const parsed = await callAI(sys2, usr2);
      const out = [];
      for (const raw of parsed.ideas) {
        const name = cleanStr(raw.name, 120);
        const setup = Math.min(Number(raw.setup) || 0, budgetNum * 0.8);
        let pLo = Number(raw.profit_low) || 0, pHi = Number(raw.profit_high) || 0;
        if (!name || setup <= 0 || pHi <= 0) continue;
        pHi = Math.min(pHi, setup * 0.15);          // سقف تحفّظي: لا ربح شهري يتجاوز 15% من التأسيس
        pLo = Math.min(Math.max(pLo, pHi * 0.4), pHi);
        const isGlobal = String(raw.kind || "").toLowerCase() === "global";
        const beLo = Math.max(6, Math.ceil(setup / pHi)), beHi = Math.max(beLo, Math.ceil(setup / pLo));
        if (beHi > 36) continue;
        out.push({
          name, sector: "مشاريع صغيرة", type: isGlobal ? "ابتكار عالمي" : "آمن", is_global: isGlobal,
          ...(isGlobal ? { origin_country: cleanStr(raw.origin_country, 60), origin_note: cleanStr(raw.origin_note, 260), why_new_in_saudi: cleanStr(raw.why_new_in_saudi, 260), saudi_adaptation: cleanStr(raw.saudi_adaptation, 260) } : {}),
          scale: "micro", scale_label: "مشروع صغير", scale_adjusted: false,
          setup_cost: nf(niceRound(setup)),
          monthly_profit_estimate: rangeStr(pLo, pHi),
          break_even: beLo === beHi ? `حوالي ${beLo} شهر` : `${beLo} إلى ${beHi} شهر`,
          risk_level: "عالي",
          reality_check: { setup: nf(niceRound(setup)), working_capital: nf(niceRound(Math.max(0, budgetNum - setup) * 0.5)), total_needed: nf(niceRound(setup)), budget: nf(budgetNum), left_over: nf(niceRound(budgetNum - setup)), fit: "estimate" },
          basis: "estimate", basis_label: "تقدير عام (لا توجد بيانات قطاع بهذه الميزانية)",
          target_fit: targetNum > 0 ? (pLo >= targetNum ? "meets" : pHi >= targetNum ? "possible" : "below") : null,
          why_fits: cleanStr(raw.why_fits), main_challenge: cleanStr(raw.main_challenge), success_tip: cleanStr(raw.success_tip),
          _profitHi: pHi
        });
      }
      return out;
    }

    // ═══ التنفيذ ═══
    console.log("═══ توليد الاقتراحات ═══");
    const scopeAll = KEYS;
    let scope = filterSector ? [filterSector] : scopeAll;
    let sectorFallback = false;
    const survivors = [];
    const seen = new Set();
    let usedTight = false;
    let passes = 0;

    for (let pass = 0; pass < 2; pass++) {
      const allowTight = pass === 1;
      let fm = feasibleMap(allowTight, scope);
      if (!Object.keys(fm).length && allowTight && filterSector && scope !== scopeAll) {   // القطاع المطلوب لا تكفيه الميزانية
        scope = scopeAll; sectorFallback = true; fm = feasibleMap(allowTight, scope);
      }
      if (!Object.keys(fm).length) continue;                                 // نجرّب المرحلة الثانية (تسمح بالضيّق)
      passes++;
      const rejectedNote = pass === 1
        ? "الأفكار السابقة لم تتجاوز الفحص الآلي. التزم حرفياً بالقطاعات والمستويات أعلاه، ونوّع الأفكار."
        : "";
      let parsed;
      try { parsed = await callAI(systemPrompt, buildIdeasPrompt(fm, allowTight, rejectedNote)); }
      catch (e) { if (survivors.length) break; throw e; }
      for (const raw of parsed.ideas) {
        const s = buildSuggestion(raw, fm, allowTight);
        if (!s) continue;
        const k = s.name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        if (s.reality_check.fit === "tight") usedTight = true;
        survivors.push(s);
      }
      if (survivors.length >= 3 || remaining() < 20000) break;
    }

    let micro = false;
    if (survivors.length === 0 && passes === 0) {
      // لا يوجد أي قطاع تكفيه هذه الميزانية بأرقام الجداول
      const m = await microSuggestions();
      m.forEach(s => survivors.push(s));
      micro = true;
    }

    // ═══ الترتيب والاختيار: ابتكار عالمي + مجرّب بالتناوب، والأقوى ربحاً أولاً ═══
    const byProfit = (a, b) => b._profitHi - a._profitHi;
    const globals = survivors.filter(s => s.is_global).sort(byProfit);
    const proven = survivors.filter(s => !s.is_global).sort(byProfit);
    const picked = [];
    let gi = 0, pi = 0;
    while (picked.length < MAX_RESULTS && (gi < globals.length || pi < proven.length)) {
      if (gi < globals.length && (picked.length % 2 === 0 || pi >= proven.length)) picked.push(globals[gi++]);
      else if (pi < proven.length) picked.push(proven[pi++]);
      else if (gi < globals.length) picked.push(globals[gi++]);
    }
    picked.forEach(s => { delete s._profitHi; });

    // ═══ تقييم الميزانية (يبنيه الكود من الأرقام، لا الموديل) ═══
    const sectorNeeds = KEYS.map(k => ({ k, ev: evaluate(k, "lean", budgetNum) }))
      .map(x => ({ k: x.k, entry: x.ev.setupLo + x.ev.workingCapital }))
      .sort((a, b) => a.entry - b.entry);
    const openCount = sectorNeeds.filter(x => x.entry <= budgetNum).length;
    const parts = [];
    if (micro) {
      parts.push(`ميزانيتك ${nf(budgetNum)} ريال أقل من الحد الأدنى الواقعي لكل القطاعات عندنا (أقلها يبدأ من نحو ${nf(niceRound(sectorNeeds[0].entry))} ريال شاملة رأس مال تشغيل).`);
      parts.push("لذلك هذه أفكار صغيرة بتقديرات عامة أقل دقة من بقية الاقتراحات، ويلزم التحقق منها بنفسك قبل البدء.");
    } else {
      parts.push(`ميزانيتك ${nf(budgetNum)} ريال تناسب فعلياً ${sectorsWord(openCount)} من ${KEYS.length}؛ أرخصها ${sectorNeeds[0].k} ويبدأ من نحو ${nf(niceRound(sectorNeeds[0].entry))} ريال شاملة رأس مال تشغيل.`);
      parts.push(`حسبنا لكل فكرة التأسيس مع رأس مال تشغيلي يكفي شهرين، فلا تتجاوز أي فكرة ميزانيتك.`);
      const above = sectorNeeds.filter(x => x.entry > budgetNum).slice(0, 3).map(x => `${x.k} (من ${nf(niceRound(x.entry))})`);
      if (above.length) parts.push(`قطاعات أعلى من ميزانيتك حالياً: ${above.join("، ")}.`);
      if (sectorFallback && filterSector) {
        parts.push(`القطاع الذي اخترته (${filterSector}) لا تكفيه ميزانيتك بأرقام واقعية، فعرضنا أقرب البدائل المناسبة لك.`);
      }
    }
    if (targetNum > 0) {
      const best = picked.reduce((m, s) => {
        const hi = Number(String(s.monthly_profit_estimate).split(" إلى ").pop().replace(/,/g, "")) || 0;
        return hi > m ? hi : m;
      }, 0);
      if (best >= targetNum) parts.push(`هدفك ${nf(targetNum)} ريال شهرياً ممكن مع بعض الأفكار أدناه في الحالة الجيدة، وليس مضموناً.`);
      else parts.push(`هدفك ${nf(targetNum)} ريال شهرياً أعلى من أفضل ربح واقعي وجدناه لميزانيتك (≈ ${nf(niceRound(best))}). للوصول له غالباً تحتاج رأس مال أكبر أو توسعاً تدريجياً.`);
    }

    const notes = [];
    if (!micro && picked.length < MAX_RESULTS) notes.push(`عرضنا ${ideasWord(picked.length)} فقط لأن غيرها لا يناسب ميزانيتك فعلاً بأرقام من بيانات القطاعات؛ لم نملأ العدد بأفكار لا تناسبك.`);
    if (usedTight) notes.push("بعض الأفكار تستهلك أغلب ميزانيتك وتترك رأس مال تشغيل محدوداً، وهي موسومة بذلك.");
    if (picked.some(s => s.is_global)) notes.push("الابتكارات العالمية «غير منتشرة في السعودية» بحسب معلومات الذكاء الاصطناعي وليست تحققاً من السوق؛ تأكد من الواقع المحلي والتراخيص قبل البدء، وأرقامها مبنية على أقرب قطاع فهي أقل دقة.");

    if (!picked.length) {
      return Response.json({ error: "تعذّر إيجاد أفكار تناسب ميزانيتك بأرقام موثوقة. جرّب رفع الميزانية أو إلغاء اختيار القطاع." }, { status: 200 });
    }

    return Response.json({
      budget_assessment: parts.join(" "),
      suggestions: picked,
      count: picked.length,
      notes,
      micro
    });

  } catch (error) {
    console.error("Suggest Server Error:", error.message);
    let userMsg = "تعذّر إعداد الاقتراحات، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("ALL_PROVIDERS_FAILED")) userMsg = "الخدمة مزدحمة الآن - حاول بعد لحظات";
    else if (msg.includes("FAIL_PARSE")) userMsg = "تعذّرت معالجة النتيجة - حاول مرة أخرى بعد لحظات";
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
