export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req) {
  try {
    const { idea, city, budget } = await req.json();

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);

    const systemPrompt = `أنت خبير اقتصادي ومستشار أعمال متخصص في السوق السعودي بخبرة 20+ سنة. 

🎯 مهمتك: تحليل المشاريع بصرامة ووضوح وواقعية تامة.

⛔ قواعد صارمة:
1. ممنوع المجاملة أو التفاؤل الزائف.
2. إذا كانت الميزانية غير كافية للمشروع، قل ذلك بصراحة وحدد الحد الأدنى الواقعي.
3. إذا كانت الفكرة سيئة أو غير قابلة للتطبيق، ارفضها واقترح بدائل.
4. استخدم أرقام واقعية من السوق السعودي (إيجارات، رواتب، تكاليف).
5. اذكر منافسين حقيقيين بأسماء معروفة في السعودية.
6. خذ بعين الاعتبار خصائص المدينة المحددة (الرياض ≠ الباحة ≠ تبوك).
7. كن مفصّلاً جداً - كل نقطة يجب أن تشرح "لماذا" و"كيف".
8. التحليل يجب أن يكون كافياً لاتخاذ قرار حقيقي.

📊 معايير التقييم (السكور /100):
- 80-100: مشروع ممتاز قابل للتنفيذ
- 60-79: مشروع جيد لكن يحتاج تعديلات
- 40-59: مشروع متوسط مع مخاطر عالية
- 20-39: مشروع ضعيف يحتاج إعادة نظر
- 0-19: مشروع فاشل أو غير قابل للتنفيذ

🚨 مهم جداً: 
- ميزانية أقل من الحد الأدنى الواقعي = سكور تلقائي أقل من 40
- فكرة غير منطقية (مثل نادي كرة قدم بميزانية صغيرة) = سكور أقل من 30 + توضيح صريح

أرجع الإجابة بصيغة JSON صحيحة 100% بدون أي نص قبلها أو بعدها.`;

    const userPrompt = `حلّل هذا المشروع تحليلاً مفصلاً جداً:

📋 المشروع: ${idea}
📍 الموقع: ${city}
💰 الميزانية: ${budgetNum.toLocaleString()} ريال سعودي

أرجع JSON بهذا الشكل بالضبط:

{
  "score": <رقم من 0-100>,
  "decision": "<عنوان قرار واضح في 5-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص مفصل في 3-4 أسطر يحدد الواقع بصراحة>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق بالأرقام، مثلاً: 2.3 مليار ريال سنوياً>",
    "target_audience": "<وصف مفصل للجمهور المستهدف مع الأعمار والدخل>",
    "buying_patterns": "<أنماط الشراء والسلوك>",
    "seasonality": "<متى الذروة ومتى التراجع>",
    "expected_market_share": "<النسبة المتوقعة، مثلاً: 0.5% - 2%>",
    "growth_potential": "<وصف إمكانية النمو على 3-5 سنوات>",
    "competitors": [
      {"name": "<اسم منافس حقيقي>", "strength": "<نقطة قوته>", "weakness": "<نقطة ضعفه>"},
      {"name": "<اسم منافس حقيقي>", "strength": "<نقطة قوته>", "weakness": "<نقطة ضعفه>"},
      {"name": "<اسم منافس حقيقي>", "strength": "<نقطة قوته>", "weakness": "<نقطة ضعفه>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": <رقم>,
      "renovation": <رقم>,
      "equipment": <رقم>,
      "licenses": <رقم>,
      "initial_inventory": <رقم>,
      "marketing_launch": <رقم>,
      "working_capital": <رقم>,
      "total": <مجموع>
    },
    "monthly_costs": {
      "rent": <رقم>,
      "salaries": <رقم>,
      "utilities": <رقم>,
      "materials": <رقم>,
      "marketing": <رقم>,
      "maintenance": <رقم>,
      "other": <رقم>,
      "total": <مجموع>
    },
    "revenue_projection": {
      "month_1": <رقم>,
      "month_3": <رقم>,
      "month_6": <رقم>,
      "month_12": <رقم>,
      "year_2_monthly": <رقم>,
      "year_3_monthly": <رقم>
    },
    "break_even_months": <رقم>,
    "roi_percentage": <رقم>,
    "annual_profit_year1": <رقم>,
    "annual_profit_year3": <رقم>
  },
  "swot": {
    "strengths": ["<نقطة قوة 1 مع شرح>", "<نقطة قوة 2 مع شرح>", "<نقطة قوة 3 مع شرح>"],
    "weaknesses": ["<نقطة ضعف 1 مع شرح>", "<نقطة ضعف 2 مع شرح>", "<نقطة ضعف 3 مع شرح>"],
    "opportunities": ["<فرصة 1 مع شرح>", "<فرصة 2 مع شرح>", "<فرصة 3 مع شرح>"],
    "threats": ["<تهديد 1 مع شرح>", "<تهديد 2 مع شرح>", "<تهديد 3 مع شرح>"]
  },
  "recommendations": [
    "<توصية استراتيجية مفصلة 1>",
    "<توصية استراتيجية مفصلة 2>",
    "<توصية استراتيجية مفصلة 3>",
    "<توصية استراتيجية مفصلة 4>",
    "<توصية استراتيجية مفصلة 5>"
  ],
  "kpis": [
    {"name": "<اسم المؤشر>", "target": "<القيمة المستهدفة>", "description": "<شرح المؤشر>"},
    {"name": "<اسم المؤشر>", "target": "<القيمة المستهدفة>", "description": "<شرح المؤشر>"},
    {"name": "<اسم المؤشر>", "target": "<القيمة المستهدفة>", "description": "<شرح المؤشر>"},
    {"name": "<اسم المؤشر>", "target": "<القيمة المستهدفة>", "description": "<شرح المؤشر>"}
  ],
  "risk_analysis": [
    {
      "risk": "<اسم المخاطرة>",
      "description": "<شرح المخاطرة بالتفصيل>",
      "probability": "<منخفض/متوسط/عالي>",
      "impact": "<طفيف/متوسط/شديد>",
      "mitigation": "<خطة التخفيف بالتفصيل>"
    },
    {
      "risk": "<اسم المخاطرة>",
      "description": "<شرح المخاطرة بالتفصيل>",
      "probability": "<منخفض/متوسط/عالي>",
      "impact": "<طفيف/متوسط/شديد>",
      "mitigation": "<خطة التخفيف بالتفصيل>"
    },
    {
      "risk": "<اسم المخاطرة>",
      "description": "<شرح المخاطرة بالتفصيل>",
      "probability": "<منخفض/متوسط/عالي>",
      "impact": "<طفيف/متوسط/شديد>",
      "mitigation": "<خطة التخفيف بالتفصيل>"
    },
    {
      "risk": "<اسم المخاطرة>",
      "description": "<شرح المخاطرة بالتفصيل>",
      "probability": "<منخفض/متوسط/عالي>",
      "impact": "<طفيف/متوسط/شديد>",
      "mitigation": "<خطة التخفيف بالتفصيل>"
    }
  ],
  "alternative_idea": "<فكرة بديلة محتملة إذا كانت الفكرة الحالية غير مجدية، أو فارغ إذا كانت الفكرة جيدة>",
  "alternative_city": "<مدينة بديلة إذا كانت المدينة الحالية غير مناسبة، أو فارغ إذا كانت المدينة مناسبة>",
  "locations": {
    "best": {
      "name": "<اسم الموقع/الحي الأفضل>",
      "score": <نسبة من 0-100>,
      "reason": "<شرح مفصل لماذا هذا الموقع الأفضل>"
    },
    "worst": {
      "name": "<اسم الموقع/الحي الأسوأ>",
      "score": <نسبة من 0-100>,
      "reason": "<شرح مفصل لماذا هذا الموقع الأسوأ>"
    }
  }
}

⚠️ تذكير نهائي: 
- لا مجاملة. 
- الواقعية أولاً. 
- لو الميزانية صغيرة جداً، قل ذلك صراحة. 
- لو الفكرة غريبة، ارفضها مع التوضيح.
- أرجع JSON فقط بدون أي نص آخر.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API Error:", errText);
      return Response.json({ error: "خطأ في خدمة التحليل، حاول مرة أخرى" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // استخراج JSON من النص
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const result = JSON.parse(jsonStr);
      return Response.json(result);
    } catch (parseErr) {
      console.error("Parse Error:", parseErr);
      console.error("Raw text:", text);
      return Response.json({ error: "خطأ في معالجة النتيجة" }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "خطأ في الخادم: " + error.message }, { status: 500 });
  }
}
