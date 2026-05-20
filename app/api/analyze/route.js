import { CITIES_DATA, COMPETITORS_BY_SECTOR, SALARIES, LICENSES, SUCCESS_RATES, detectSector, getCityBrief, getSectorBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { idea, city, budget } = await req.json();

    console.log("📥 Request:", { idea, city, budget });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    
    // 🎯 استخراج اسم المدينة (إذا كان فيه "حي" نحذفه)
    const cityName = city.split(" - ")[0].trim();
    
    // 🔍 كشف القطاع تلقائياً
    const sector = detectSector(idea);
    console.log("🏪 Detected sector:", sector);
    
    // 📊 جلب بيانات المدينة والقطاع
    const cityBrief = getCityBrief(cityName) || `معلومات المدينة: ${cityName}`;
    const sectorBrief = getSectorBrief(sector);
    
    console.log("🚀 Calling Groq...");

    const systemPrompt = `أنت "أبو عبدالله الراجحي" - خبير استثماري سعودي بخبرة 30 سنة، صارم وصادق، لا تجامل أبداً. ترجع JSON صحيح فقط بدون أي نص إضافي.

⛔ قواعدك:
1. لا مجاملة - حتى لو الفكرة سيئة قلها مباشرة
2. ميزانية أقل من 60% من المطلوب = سكور أقل من 30
3. فكرة غير منطقية = سكور أقل من 25
4. استخدم البيانات المعطاة لك بدقة
5. اقترح 5 بدائل واقعية على الأقل`;

    const userPrompt = `📋 المشروع المراد تحليله:
- الفكرة: ${idea}
- المدينة: ${cityName}
- الميزانية: ${budgetNum.toLocaleString()} ريال
- القطاع المكتشف: ${sector}

${cityBrief}

${sectorBrief}

💼 الرواتب الشهرية في السوق السعودي:
- موظف سعودي: ${SALARIES.emp_saudi}
- مدير سعودي: ${SALARIES.mgr_saudi}
- خبرة عربية: ${SALARIES.exp_arab}
- عمالة آسيوية: ${SALARIES.worker_asian}

📜 التراخيص:
- سجل تجاري: ${LICENSES.commercial_register}
- رخصة بلدية: ${LICENSES.municipal_license}
- تأمينات: ${LICENSES.social_insurance}
- ضريبة قيمة مضافة: ${LICENSES.vat}

⚠️ تعليمات صارمة:
1. استخدم الأحياء الحقيقية من القائمة أعلاه (لا تخترع أحياء)
2. استخدم المنافسين الحقيقيين من القائمة
3. الإيجارات يجب أن تكون من النطاق المذكور لـ ${cityName}
4. اقترح 5 بدائل واقعية متنوعة (مشاريع مختلفة كلياً، وأفكار مطوّرة من الفكرة الأصلية)
5. كل بديل يجب أن يكون مناسب للميزانية ${budgetNum.toLocaleString()} ريال

أرجع JSON صحيح فقط:

{
  "score": <0-100>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص واقعي 5-6 أسطر: هل الميزانية كافية؟ هل الفكرة منطقية؟ الحد الأدنى المطلوب؟ المخاطر؟>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق بالأرقام لـ ${cityName}>",
    "target_audience": "<وصف تفصيلي للجمهور في ${cityName}>",
    "buying_patterns": "<أنماط الشراء الفعلية>",
    "seasonality": "<متى الذروة والتراجع مع الأسباب>",
    "expected_market_share": "<النسبة الواقعية>",
    "growth_potential": "<النمو على 5 سنوات>",
    "competitors": [
      {"name": "<منافس حقيقي من القائمة>", "strength": "<قوة محددة>", "weakness": "<ضعف قابل للاستغلال>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": <3 أشهر إيجار حسب الحي>,
      "renovation": <واقعي>,
      "equipment": <واقعي>,
      "licenses": <سجل + رخصة + دفاع مدني>,
      "initial_inventory": <واقعي>,
      "marketing_launch": <واقعي>,
      "working_capital": <3 أشهر تشغيل>,
      "total": <مجموع>
    },
    "monthly_costs": {
      "rent": <إيجار شهري حسب ${cityName}>,
      "salaries": <رواتب واقعية>,
      "utilities": <كهرباء وماء>,
      "materials": <مواد>,
      "marketing": <تسويق>,
      "maintenance": <صيانة>,
      "other": <أخرى>,
      "total": <مجموع>
    },
    "revenue_projection": {
      "month_1": <واقعي>,
      "month_3": <واقعي>,
      "month_6": <واقعي>,
      "month_12": <واقعي>,
      "year_2_monthly": <واقعي>,
      "year_3_monthly": <واقعي>
    },
    "break_even_months": <عدد>,
    "roi_percentage": <نسبة>,
    "annual_profit_year1": <رقم>,
    "annual_profit_year3": <رقم>
  },
  "swot": {
    "strengths": ["<قوة مع شرح 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": [
    "<توصية عملية 1>",
    "<توصية 2>",
    "<توصية 3>",
    "<توصية 4>",
    "<توصية 5>"
  ],
  "kpis": [
    {"name": "<اسم>", "target": "<قيمة محددة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"}
  ],
  "risk_analysis": [
    {"risk": "<مخاطرة 1>", "description": "<شرح>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة 2>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة 3>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة 4>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"}
  ],
  "alternatives": [
    {"idea": "<بديل 1 مناسب للميزانية والمدينة>", "score": <سكور>, "reason": "<لماذا أفضل>", "budget_needed": "<المبلغ المطلوب>"},
    {"idea": "<بديل 2 مختلف كلياً>", "score": <سكور>, "reason": "<السبب>", "budget_needed": "<المبلغ>"},
    {"idea": "<بديل 3 تطوير من الفكرة>", "score": <سكور>, "reason": "<السبب>", "budget_needed": "<المبلغ>"},
    {"idea": "<بديل 4 من قطاع آخر>", "score": <سكور>, "reason": "<السبب>", "budget_needed": "<المبلغ>"},
    {"idea": "<بديل 5 إبداعي>", "score": <سكور>, "reason": "<السبب>", "budget_needed": "<المبلغ>"}
  ],
  "alternative_idea": "<أفضل بديل مختصر>",
  "alternative_city": "<مدينة بديلة أفضل أو فارغ>",
  "locations": {
    "best": {"name": "<اسم حي حقيقي من القائمة في ${cityName}>", "score": <0-100>, "reason": "<شرح: ديموغرافيا، حركة، قوة شرائية>"},
    "worst": {"name": "<اسم حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  }
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 6000,
        response_format: { type: "json_object" }
      })
    });

    console.log("📡 Groq Status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Groq Error:", errText.substring(0, 500));
      return Response.json({ 
        error: response.status === 413 ? "البيانات كبيرة، جاري التحسين" : "خطأ من Groq: " + response.status
      }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return Response.json({ error: "لا يوجد رد" }, { status: 500 });
    }

    console.log("✅ Got response, length:", text.length);

    try {
      const result = JSON.parse(text);
      console.log("✅ JSON parsed successfully");
      return Response.json(result);
    } catch (parseErr) {
      console.error("❌ Parse Error:", parseErr.message);
      return Response.json({ error: "خطأ في معالجة النتيجة" }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    return Response.json({ error: "خطأ في الخادم: " + error.message }, { status: 500 });
  }
}
