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
5. البدائل يجب أن تكون أسماء مشاريع حقيقية محددة وليست أوصاف عامة
6. اذكر المنافسين الأشهر في المدينة المحددة`;

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

⚠️ تعليمات صارمة جداً:

1. **المنافسون**: اذكر 5 منافسين معروفين وموجودين في ${cityName} تحديداً (سلاسل كبيرة لها فروع في ${cityName} + منافسين محليين معروفين)${neighborhood ? ` وخاصة قرب حي ${neighborhood}` : ''}

2. **الأحياء**: استخدم الأحياء الحقيقية من القائمة أعلاه فقط

3. **5 مشاريع بديلة حقيقية ومحددة** (مهم جداً):
   - لا تكتب وصف عام مثل "مشروع في قطاع آخر" أو "تطوير من نفس الفكرة"
   - اكتب اسم مشروع حقيقي ومحدد وواضح يقدر المستخدم ينفذه
   - مثال صحيح: "محمصة قهوة مختصة مع توصيل للمنازل" أو "عربة قهوة متنقلة في الكورنيش" أو "مغسلة سيارات VIP"
   - مثال خاطئ: "تطوير من نفس الفكرة" أو "مشروع موسمي"
   - نوّع البدائل: مشروع مشابه محسّن، مشروع من قطاع مختلف، مشروع أصغر وأبسط، مشروع موسمي مناسب لـ ${cityName}، مشروع مبتكر
   - كل بديل بميزانية مناسبة (غالباً أقل من أو يساوي ${budgetNum.toLocaleString()} ريال)

4. **الإيجارات**: استخدم النطاق الواقعي لـ ${cityName}

5. **الموقع الأفضل**: اقترح حي حقيقي في ${cityName} مع تفسير

أرجع JSON صحيح فقط:

{
  "score": <0-100>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص واقعي 5-6 أسطر: هل الميزانية كافية؟ هل الفكرة منطقية؟ المخاطر؟>",
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
      {"name": "<منافس معروف في ${cityName}>", "strength": "<قوة محددة>", "weakness": "<ضعف قابل للاستغلال>"},
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
    "strengths": ["<قوة مع شرح 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": ["<توصية عملية 1>", "<توصية 2>", "<توصية 3>", "<توصية 4>", "<توصية 5>"],
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
    {"idea": "<اسم مشروع حقيقي محدد - مثل: محمصة قهوة مختصة مع توصيل>", "score": <0-100>, "reason": "<لماذا هذا أفضل من الأصلي>", "budget_needed": "<مبلغ بالريال>"},
    {"idea": "<اسم مشروع حقيقي محدد من قطاع مختلف>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع حقيقي محدد أصغر وأبسط>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع موسمي حقيقي محدد مناسب لـ ${cityName}>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع مبتكر حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"}
  ],
  "alternative_idea": "<أفضل بديل مختصر>",
  "alternative_city": "<مدينة بديلة أفضل أو فارغ>",
  "locations": {
    "best": {"name": "<اسم حي حقيقي من القائمة في ${cityName}>", "score": <0-100>, "reason": "<شرح: ديموغرافيا، حركة، قوة شرائية>"},
    "worst": {"name": "<اسم حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
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
        temperature: 0.5,
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
5. البدائل يجب أن تكون أسماء مشاريع حقيقية محددة وليست أوصاف عامة
6. اذكر المنافسين الأشهر في المدينة المحددة`;

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

⚠️ تعليمات صارمة جداً:

1. **المنافسون**: اذكر 5 منافسين معروفين وموجودين في ${cityName} تحديداً (سلاسل كبيرة لها فروع في ${cityName} + منافسين محليين معروفين)${neighborhood ? ` وخاصة قرب حي ${neighborhood}` : ''}

2. **الأحياء**: استخدم الأحياء الحقيقية من القائمة أعلاه فقط

3. **5 مشاريع بديلة حقيقية ومحددة** (مهم جداً):
   - لا تكتب وصف عام مثل "مشروع في قطاع آخر" أو "تطوير من نفس الفكرة"
   - اكتب اسم مشروع حقيقي ومحدد وواضح يقدر المستخدم ينفذه
   - مثال صحيح: "محمصة قهوة مختصة مع توصيل للمنازل" أو "عربة قهوة متنقلة في الكورنيش" أو "مغسلة سيارات VIP"
   - مثال خاطئ: "تطوير من نفس الفكرة" أو "مشروع موسمي"
   - نوّع البدائل: مشروع مشابه محسّن، مشروع من قطاع مختلف، مشروع أصغر وأبسط، مشروع موسمي مناسب لـ ${cityName}، مشروع مبتكر
   - كل بديل بميزانية مناسبة (غالباً أقل من أو يساوي ${budgetNum.toLocaleString()} ريال)

4. **الإيجارات**: استخدم النطاق الواقعي لـ ${cityName}

5. **الموقع الأفضل**: اقترح حي حقيقي في ${cityName} مع تفسير

أرجع JSON صحيح فقط:

{
  "score": <0-100>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص واقعي 5-6 أسطر: هل الميزانية كافية؟ هل الفكرة منطقية؟ المخاطر؟>",
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
      {"name": "<منافس معروف في ${cityName}>", "strength": "<قوة محددة>", "weakness": "<ضعف قابل للاستغلال>"},
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
    "strengths": ["<قوة مع شرح 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": ["<توصية عملية 1>", "<توصية 2>", "<توصية 3>", "<توصية 4>", "<توصية 5>"],
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
    {"idea": "<اسم مشروع حقيقي محدد - مثل: محمصة قهوة مختصة مع توصيل>", "score": <0-100>, "reason": "<لماذا هذا أفضل من الأصلي>", "budget_needed": "<مبلغ بالريال>"},
    {"idea": "<اسم مشروع حقيقي محدد من قطاع مختلف>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع حقيقي محدد أصغر وأبسط>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع موسمي حقيقي محدد مناسب لـ ${cityName}>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<اسم مشروع مبتكر حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"}
  ],
  "alternative_idea": "<أفضل بديل مختصر>",
  "alternative_city": "<مدينة بديلة أفضل أو فارغ>",
  "locations": {
    "best": {"name": "<اسم حي حقيقي من القائمة في ${cityName}>", "score": <0-100>, "reason": "<شرح: ديموغرافيا، حركة، قوة شرائية>"},
    "worst": {"name": "<اسم حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
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
        temperature: 0.5,
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
