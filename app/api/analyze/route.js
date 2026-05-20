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
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;
    
    const sector = detectSector(idea);
    console.log("🏪 Sector:", sector, "| City:", cityName, "| Neighborhood:", neighborhood);
    
    const cityBrief = getCityBrief(cityName) || `معلومات المدينة: ${cityName}`;
    const sectorBrief = getSectorBrief(sector);

    const systemPrompt = `أنت "أبو عبدالله الراجحي" - خبير استثماري سعودي بخبرة 30 سنة، صارم وصادق، لا تجامل أبداً. ترجع JSON صحيح فقط بدون أي نص إضافي.

⛔ قواعدك:
1. لا مجاملة - لو الفكرة سيئة قلها مباشرة
2. ميزانية أقل من 60% من المطلوب = سكور أقل من 30
3. فكرة غير منطقية = سكور أقل من 25
4. استخدم البيانات المعطاة بدقة
5. **5 بدائل واقعية مختلفة جداً** (وليست متشابهة)
6. اذكر المنافسين الأشهر في ${cityName} تحديداً`;

    const userPrompt = `📋 المشروع:
- الفكرة: ${idea}
- المدينة: ${cityName}${neighborhood ? `\n- الحي: ${neighborhood}` : ''}
- الميزانية: ${budgetNum.toLocaleString()} ريال
- القطاع: ${sector}

${cityBrief}

${sectorBrief}

💼 الرواتب: 
- موظف سعودي: ${SALARIES.emp_saudi}
- خبرة عربية: ${SALARIES.exp_arab}
- عمالة آسيوية: ${SALARIES.worker_asian}

📜 التراخيص:
- سجل تجاري: ${LICENSES.commercial_register}
- رخصة بلدية: ${LICENSES.municipal_license}
- ضريبة قيمة مضافة: ${LICENSES.vat}

⚠️ تعليمات مهمة جداً:

1. **المنافسون**: اذكر 5 منافسين **معروفين وموجودين في ${cityName}** تحديداً. ركّز على:
   - السلاسل الكبيرة اللي عندها فروع في ${cityName}
   - منافسين محليين معروفين في ${cityName}${neighborhood ? ` وخاصة في حي ${neighborhood} والأحياء المحيطة` : ''}
   - استخدم القائمة العامة كمرجع لكن اختر الأنسب لـ ${cityName}

2. **الأحياء**: استخدم الأحياء الحقيقية من القائمة أعلاه فقط${neighborhood ? `. الحي المختار: ${neighborhood}` : ''}

3. **5 بدائل مختلفة كلياً**:
   - بديل 1: تطوير من نفس الفكرة (نفس القطاع)
   - بديل 2: مشروع مختلف كلياً في قطاع آخر
   - بديل 3: مشروع متخصص أصغر بنفس الميزانية
   - بديل 4: مشروع موسمي مناسب لـ ${cityName}
   - بديل 5: مشروع إبداعي مبتكر
   - كل بديل بميزانية مناسبة للمستخدم

4. **الإيجارات**: استخدم النطاق الواقعي لـ ${cityName}

5. **الموقع الأفضل**: اقترح حي حقيقي في ${cityName} مع تفسير

أرجع JSON صحيح فقط:

{
  "score": <0-100>,
  "decision": "<قرار 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص 5-6 أسطر صريح>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق لـ ${cityName}>",
    "target_audience": "<جمهور ${cityName}>",
    "buying_patterns": "<أنماط الشراء>",
    "seasonality": "<الموسمية>",
    "expected_market_share": "<النسبة المتوقعة>",
    "growth_potential": "<النمو على 5 سنوات>",
    "competitors": [
      {"name": "<منافس معروف في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {"rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0, "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0},
    "monthly_costs": {"rent": 0, "salaries": 0, "utilities": 0, "materials": 0, "marketing": 0, "maintenance": 0, "other": 0, "total": 0},
    "revenue_projection": {"month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0, "year_2_monthly": 0, "year_3_monthly": 0},
    "break_even_months": 0,
    "roi_percentage": 0,
    "annual_profit_year1": 0,
    "annual_profit_year3": 0
  },
  "swot": {
    "strengths": ["<قوة 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": ["<توصية 1>", "<توصية 2>", "<توصية 3>", "<توصية 4>", "<توصية 5>"],
  "kpis": [
    {"name": "<اسم>", "target": "<قيمة>", "description": "<شرح>"},
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
    {"idea": "<بديل 1: تطوير من نفس الفكرة>", "score": <0-100>, "reason": "<لماذا أفضل>", "budget_needed": "<مبلغ بالريال>"},
    {"idea": "<بديل 2: قطاع آخر مختلف>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<بديل 3: مشروع متخصص أصغر>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<بديل 4: موسمي لـ ${cityName}>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<بديل 5: إبداعي مبتكر>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"}
  ],
  "alternative_idea": "<أفضل بديل>",
  "alternative_city": "<مدينة بديلة أو فارغ>",
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  }
}`;

    console.log("🚀 Calling Groq...");

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
      return Response.json({ error: "خطأ من Groq: " + response.status }, { status: 500 });
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
