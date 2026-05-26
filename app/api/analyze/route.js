import { CITIES_DATA, SALARIES, LICENSES, detectSector, getCityBrief, getSectorBrief, getFinancialBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

function numWithCommas(n){
  const s = String(Math.round(Number(n)||0));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export async function POST(req) {
  try {
    const { idea, sector: userSector, city, budget, extras } = await req.json();
    console.log("Request:", { idea, userSector, city, budget, extras });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;

    const sector = userSector ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);

    // ═══ معلومات إضافية من المستخدم ═══
    let extraInfo = "";
    if (extras) {
      const lines = [];
      if (extras.area) lines.push(`مساحة المحل: ${extras.area} متر مربع`);
      if (extras.actual_rent) lines.push(`الإيجار السنوي الفعلي (أكّده المستخدم): ${numWithCommas(parseInt(extras.actual_rent))} ريال — استخدم هذا الرقم كما هو في التحليل المالي`);
      if (extras.staff_count) lines.push(`عدد الموظفين المتوقع: ${extras.staff_count}`);
      if (extras.shop_state) lines.push(`حالة المحل: ${extras.shop_state}`);
      if (extras.experience) lines.push(`خبرة صاحب المشروع في هذا المجال: ${extras.experience}`);
      if (lines.length) extraInfo = "\n\nمعلومات إضافية مهمة قدّمها صاحب المشروع (استخدمها لرفع دقة التحليل):\n" + lines.join("\n");
    }

    // ═══ معطيات المشروع المشتركة ═══
    const projectContext = `المشروع: ${idea}
القطاع: ${sector}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${numWithCommas(budgetNum)} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب التقريبية: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}
التراخيص: سجل تجاري ${LICENSES.commercial_register}، رخصة بلدية ${LICENSES.municipal_license}${extraInfo}`;

    // ═══ تعليمات الأسلوب ═══
    const styleGuide = `أسلوب الكتابة: اكتب كأنك مستشار خبير تجلس مع صاحب المشروع وتنصحه بصدق. لغة عربية طبيعية وإنسانية، خاطبه مباشرة ("مشروعك"، "ميزانيتك"، "أنصحك"). تجنّب العبارات الآلية. اشرح "لماذا" وراء كل رقم. لا مجاملة - كن صادقاً وواقعياً.`;

    // ═══ تعليمات البحث ═══
    const searchInstructions = `استخدم معرفتك العميقة بالسوق السعودي ومعطيات المشروع المعطاة لك. اعتمد على الأرقام في المعطيات كأساس، وعدّلها بدقة حسب المدينة والحي والمعلومات الإضافية التي قدّمها صاحب المشروع.`;

    const baseRules = `قاعدة لغة إلزامية: اكتب كل النصوص باللغة العربية الفصحى فقط. ممنوع منعاً تاماً استخدام أي كلمة أو حرف من لغة أخرى. الأرقام تُكتب بالأرقام العادية.

قواعد الدقة:
- استخدم أرقاماً واقعية مبنية على بحثك الفعلي، عدّلها حسب حجم المدينة والحي بدقة.
- المجاميع يجب أن تتطابق (مجموع البنود = الإجمالي).
- إذا الميزانية أقل من الحد الأدنى للتأسيس = score أقل من 35 + توضيح صريح كم ينقص.
- المنافسون: اذكر 5 منافسين بأسماء شركات وسلاسل حقيقية معروفة فعلياً في السوق السعودي تنافس في نفس نوع المشروع. مثال: لمشروع برجر اذكر سلاسل مثل (هرفي، كودو، البيك، ماكدونالدز، شيك شاك) حسب ما يناسب. لمشروع قهوة اذكر (دانكن، ستاربكس، بارنز، دوز) وهكذا. استخدم أسماء سلاسل حقيقية معروفة فقط. ممنوع منعاً تاماً الأسماء الوهمية أو المرقّمة مثل "كوفي شوب 1" أو الأوصاف العامة مثل "مطاعم شاورما". يجب أن يكون كل منافس اسم شركة أو سلسلة حقيقية معروفة.
- نقطة التعادل = إجمالي التأسيس ÷ (الإيراد الشهري - التكلفة الشهرية). الـ ROI = (الربح السنوي ÷ رأس المال) × 100.
- الأحياء يجب أن تكون حقيقية من ${cityName}.`;

    // ═══ الاستدعاء الأول: التحليل الأساسي ═══
    const promptCore = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. حلّل هذا المشروع بصرامة وواقعية تامة كدراسة جدوى حقيقية مبنية على بحث فعلي.

${projectContext}

${searchInstructions}

${styleGuide}

${baseRules}

بعد بحثك، أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

{
  "score": <0-100 واقعي>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص 5-6 أسطر بأسلوب إنساني مباشر: هل ميزانيتك تكفي؟ كم تحتاج فعلياً؟ ما يقلقني؟ ما الذي يحدد نجاحك؟>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق لـ ${cityName} بأرقام وتقدير قيمته>",
    "target_audience": "<وصف تفصيلي للجمهور: من هم، أعمارهم، دخلهم، سلوكهم>",
    "buying_patterns": "<أنماط الشراء: متى يشترون، كم مرة، كم ينفقون>",
    "seasonality": "<الموسمية: أشهر الذروة وأشهر الركود ولماذا>",
    "expected_market_share": "<النسبة الواقعية مع تبرير>",
    "growth_potential": "<النمو على 5 سنوات مع تبرير>",
    "demand_drivers": ["<عامل يرفع الطلب>", "<عامل آخر>", "<عامل ثالث>"],
    "market_gaps": ["<فجوة في السوق تقدر تستغلها>", "<فجوة أخرى>"],
    "competitors": [
      {"name": "<اسم سلسلة حقيقية معروفة>", "market_position": "<موقعها في السوق: رائدة/قوية/متوسطة>", "strength": "<أبرز قوة>", "weakness": "<ثغرة تقدر تستغلها>", "price_range": "<فئة أسعارها: اقتصادية/متوسطة/مرتفعة>"},
      {"name": "<اسم سلسلة حقيقية>", "market_position": "<موقعها>", "strength": "<قوة>", "weakness": "<ثغرة>", "price_range": "<فئة الأسعار>"},
      {"name": "<اسم سلسلة حقيقية>", "market_position": "<موقعها>", "strength": "<قوة>", "weakness": "<ثغرة>", "price_range": "<فئة الأسعار>"},
      {"name": "<اسم سلسلة حقيقية>", "market_position": "<موقعها>", "strength": "<قوة>", "weakness": "<ثغرة>", "price_range": "<فئة الأسعار>"},
      {"name": "<اسم سلسلة حقيقية>", "market_position": "<موقعها>", "strength": "<قوة>", "weakness": "<ثغرة>", "price_range": "<فئة الأسعار>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {"rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0, "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0},
    "setup_costs_notes": "<شرح من سطرين: ما أكبر بند ولماذا، وأين يمكن توفير التكاليف>",
    "monthly_costs": {"rent": 0, "salaries": 0, "utilities": 0, "materials": 0, "marketing": 0, "maintenance": 0, "other": 0, "total": 0},
    "monthly_costs_notes": "<شرح من سطرين: أثقل بند شهري وكيف تتحكم فيه>",
    "salary_breakdown": [
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>},
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>}
    ],
    "revenue_projection": {"month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0, "year_2_monthly": 0, "year_3_monthly": 0},
    "revenue_notes": "<شرح من سطرين: كيف ينمو الدخل ولماذا، وما الافتراض الأساسي>",
    "break_even_months": 0,
    "roi_percentage": 0,
    "annual_profit_year1": 0,
    "annual_profit_year3": 0,
    "daily_target": {"customers_per_day": <عدد العملاء المطلوب يومياً للربح>, "average_ticket": <متوسط فاتورة العميل>}
  },
  "swot": {
    "strengths": ["<قوة 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": [
    {"title": "<عنوان التوصية>", "detail": "<شرح عملي من سطرين كيف تنفّذها ولماذا مهمة>", "priority": "<عالية/متوسطة>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"}
  ],
  "kpis": [
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"}
  ],
  "risk_analysis": [
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي للمخاطرة وكيف تظهر>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة عملية ملموسة لتفادي المخاطرة>", "warning_signs": "<علامات مبكرة تنذر بهذه المخاطرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"}
  ],
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  },
}`;

    // ═══ الاستدعاء الثاني: الخطة والتفاصيل ═══
    const promptPlan = `أنت خبير استثماري سعودي تكمل دراسة جدوى لهذا المشروع. ركّز على الخطة التنفيذية والتفاصيل العملية، مبنية على بحث فعلي.

${projectContext}

اعتمد على معرفتك بالتراخيص والتصاريح المطلوبة لهذا النوع من المشاريع في السعودية وجهات إصدارها، وأسعار السوق للمنتجات والخدمات المشابهة.

${styleGuide}

قواعد:
- الخطة التنفيذية: 3 مراحل واقعية (1-30، 31-60، 61-90 يوم)، كل مرحلة مهام عملية ملموسة.
- التسعير: 4 منتجات/خدمات رئيسية، لكل واحد سعر بيع وتكلفة وهامش ربح، أسعار واقعية مبنية على بحثك.
- العميل المثالي: صفه بدقة (العمر، الدخل، السلوك، أين تجده).
- التراخيص: التصاريح الفعلية الحديثة المطلوبة في السعودية مع جهة الإصدار، من بحثك.
- التميّز: 3 طرق عملية ملموسة للتميّز عن المنافسين.
- اكتب بالعربية فقط.

أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

{
  "action_plan": [
    {"phase": "اليوم 1-30", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 31-60", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 61-90", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]}
  ],
  "pricing": {
    "items": [
      {"name": "<منتج/خدمة>", "price": "<سعر البيع بالريال>", "cost": "<التكلفة بالريال>", "margin": "<هامش الربح %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"}
    ],
    "note": "<ملاحظة عن استراتيجية التسعير بأسلوب إنساني>"
  },
  "break_even_detail": {
    "months": <عدد الأشهر>,
    "explanation": "<شرح إنساني مبسّط: متى يبدأ المشروع يغطّي تكاليفه ولماذا>"
  },
  "ideal_customer": {
    "age_group": "<الفئة العمرية>",
    "income_level": "<مستوى الدخل>",
    "behavior": "<نمط الحياة والسلوك الشرائي>",
    "where_to_reach": "<أين تجده وكيف توصل له تسويقياً>"
  },
  "licenses_needed": [
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"}
  ],
  "differentiation": [
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>"
  ]
}`;

    // ═══ دالة استدعاء Gemini (النموذج الأساسي) ═══
    async function callGemini(userPrompt) {
      const model = "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 22000);
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 6000, responseMimeType: "application/json" }
          }),
          signal: ctrl.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini Error:", response.status, errText.substring(0, 200));
        throw new Error("GEMINI_FAIL_" + response.status);
      }
      const data = await response.json();
      const cand = data.candidates?.[0];
      const text = cand?.content?.parts?.map(p => p.text || "").join("") || "";
      if (!text) throw new Error("GEMINI_FAIL_EMPTY");
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("GEMINI_FAIL_PARSE");
      return parsed;
    }

    // ═══ دالة استدعاء Groq (الاحتياطي) ═══
    async function callGroq(userPrompt, attempt = 1) {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error("لا يوجد مفتاح احتياطي");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 24000);
      let response;
      try {
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: userPrompt }],
            temperature: 0.35,
            max_tokens: 3200,
            response_format: { type: "json_object" }
          }),
          signal: ctrl.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        if (response.status === 429 && attempt < 3) {
          await new Promise(r => setTimeout(r, 4000 * attempt));
          return callGroq(userPrompt, attempt + 1);
        }
        throw new Error("الخدمة مزدحمة حالياً، حاول بعد دقيقة");
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("لا يوجد رد من المحلّل");
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("تعذّر تحليل الرد");
      return parsed;
    }

    // ═══ استدعاء ذكي: Groq أولاً (أسرع وأثبت)، وعند فشله Gemini ═══
    async function callAI(userPrompt) {
      try {
        return await callGroq(userPrompt);
      } catch (e) {
        console.log("Groq failed (" + e.message + "), switching to Gemini backup...");
        return await callGemini(userPrompt);
      }
    }

    console.log("Analyzing (Groq primary, Gemini backup)...");

    const coreData = await callAI(promptCore);
    await new Promise(r => setTimeout(r, 400));
    const planData = await callAI(promptPlan);

    const merged = { ...coreData, ...planData };
    const validated = validateFinancials(merged);

    console.log("Analysis complete");
    return Response.json(validated);

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ error: error.message || "خطأ في الخادم" }, { status: 500 });
  }
}

// ═══ استخراج JSON من نص قد يحتوي على زوائد ═══
function extractJSON(text) {
  // محاولة 1: تحليل مباشر
  try { return JSON.parse(text); } catch (e) {}

  // محاولة 2: إزالة علامات markdown
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}

  // محاولة 3: استخراج أول كتلة { ... } متوازنة
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
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const block = cleaned.substring(start, i + 1);
        try { return JSON.parse(block); } catch (e) { return null; }
      }
    }
  }
  return null;
}

// ═══ طبقة التحقق الرياضي ═══
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      const sum = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                  (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                  (sc.working_capital||0);
      if (sum > 0 && Math.abs((sc.total||0) - sum) / sum > 0.01) {
        sc.total = sum;
      }
    }

    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      const sum = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                  (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                  (mc.other||0);
      if (sum > 0 && Math.abs((mc.total||0) - sum) / sum > 0.01) {
        mc.total = sum;
      }
    }

    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rev12 = fa.revenue_projection?.month_12 || 0;

    if (rev12 > 0 && monthlyTotal > 0) {
      const monthlyProfit = rev12 - monthlyTotal;
      const rev1 = fa.revenue_projection?.month_1 || 0;
      const rev3 = fa.revenue_projection?.month_3 || 0;
      const rev6 = fa.revenue_projection?.month_6 || 0;
      const avgMonthlyRev = (rev1 + rev3*2 + rev6*3 + rev12*6) / 12;
      const estAnnualProfit = Math.round((avgMonthlyRev - monthlyTotal) * 12);

      if (fa.annual_profit_year1 != null) {
        const stated = fa.annual_profit_year1;
        if (estAnnualProfit !== 0 && Math.abs(stated - estAnnualProfit) / Math.abs(estAnnualProfit) > 0.25) {
          fa.annual_profit_year1 = estAnnualProfit;
        }
      }

      if (monthlyProfit > 0 && setupTotal > 0) {
        const estBreakEven = Math.ceil(setupTotal / monthlyProfit);
        if (fa.break_even_months != null && estBreakEven > 0 && estBreakEven <= 120) {
          const stated = fa.break_even_months;
          if (Math.abs(stated - estBreakEven) / estBreakEven > 0.4) {
            fa.break_even_months = estBreakEven;
          }
        }
        if (result.break_even_detail && estBreakEven > 0 && estBreakEven <= 120) {
          if (Math.abs((result.break_even_detail.months||0) - fa.break_even_months) > 3) {
            result.break_even_detail.months = fa.break_even_months;
          }
        }
      }

      if (setupTotal > 0 && fa.annual_profit_year1 != null) {
        const estROI = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
        if (fa.roi_percentage != null) {
          if (Math.abs(fa.roi_percentage - estROI) > 15) {
            fa.roi_percentage = estROI;
          }
        }
      }
    }

    return result;
  } catch (e) {
    console.error("Validation error:", e.message);
    return result;
  }
}
