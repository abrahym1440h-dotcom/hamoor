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
      console.log("❌ GROQ_API_KEY not found");
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    console.log("✅ API Key found");
    const budgetNum = parseInt(budget);

    const systemPrompt = `أنت خبير اقتصادي سعودي بخبرة 25 سنة في السوق السعودي. ترجع JSON صحيح فقط بدون أي نص إضافي، تحلل بصرامة وواقعية تامة بدون مجاملة.`;

    const userPrompt = `حلّل هذا المشروع بصرامة شديدة وواقعية تامة بدون أي مجاملة.

⛔ قواعد صارمة:
1. ممنوع المجاملة أو التفاؤل غير المبرر
2. إذا الميزانية غير كافية، اذكر ذلك صراحة
3. إذا الفكرة غير منطقية (مثل نادي كرة قدم بـ 2 مليون)، ارفضها واقترح بدائل
4. استخدم أرقام واقعية للسوق السعودي 2025-2026
5. اذكر منافسين حقيقيين بأسماء معروفة (ستاربكس، البيك، كودو، نون، إكسترا، جرير)
6. خصص التحليل للمدينة المحددة (الرياض ≠ الباحة ≠ تبوك)

📊 معايير السكور (0-100):
- ميزانية أقل من 50% من المطلوب = سكور أقل من 35
- فكرة غير منطقية = سكور أقل من 25
- 85-100 ممتاز، 70-84 جيد، 55-69 متوسط، 40-54 ضعيف، 0-39 فاشل

🏙️ خصائص المدن السعودية:
- الرياض: سوق ضخم، إيجارات عالية، منافسة شرسة
- جدة: سياحة وتجارة، إيجارات متوسطة-عالية
- الباحة: سوق صغير، إيجارات منخفضة، فرص في السياحة الجبلية
- تبوك: نمو سريع بسبب نيوم
- مكة/المدينة: موسمية الحج والعمرة
- الدمام/الخبر: قوة شرائية عالية

📋 المشروع:
- الفكرة: ${idea}
- المدينة: ${city}
- الميزانية: ${budgetNum.toLocaleString()} ريال

أرجع JSON صحيح فقط:

{
  "score": <0-100>,
  "decision": "<عنوان القرار>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص 4-5 أسطر صريح>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق بالأرقام>",
    "target_audience": "<وصف الجمهور>",
    "buying_patterns": "<أنماط الشراء>",
    "seasonality": "<الموسمية>",
    "expected_market_share": "<النسبة المتوقعة>",
    "growth_potential": "<النمو>",
    "competitors": [
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0,
      "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0
    },
    "monthly_costs": {
      "rent": 0, "salaries": 0, "utilities": 0, "materials": 0,
      "marketing": 0, "maintenance": 0, "other": 0, "total": 0
    },
    "revenue_projection": {
      "month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0,
      "year_2_monthly": 0, "year_3_monthly": 0
    },
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
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة>"}
  ],
  "alternative_idea": "<فكرة بديلة أو فارغ>",
  "alternative_city": "<مدينة بديلة أو فارغ>",
  "locations": {
    "best": {"name": "<حي>", "score": 85, "reason": "<شرح>"},
    "worst": {"name": "<حي>", "score": 25, "reason": "<شرح>"}
  }
}`;

    console.log("🚀 Calling Groq (Llama 3.3)...");

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
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" }
      })
    });

    console.log("📡 Groq Status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Groq Error:", errText.substring(0, 500));
      return Response.json({ 
        error: "خطأ من Groq: " + response.status
      }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error("❌ No response from Groq");
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
