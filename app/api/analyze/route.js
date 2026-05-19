export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { idea, city, budget } = body;

    console.log("📥 Request received:", { idea, city, budget });

    if (!idea || !city || !budget) {
      console.log("❌ Missing data");
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.log("❌ ANTHROPIC_API_KEY not found");
      return Response.json({ error: "مفتاح API غير موجود في الخادم" }, { status: 500 });
    }

    console.log("✅ API Key found, length:", apiKey.length);

    const budgetNum = parseInt(budget);

    const prompt = `أنت خبير اقتصادي ومستشار أعمال متخصص في السوق السعودي بخبرة 20+ سنة.

🎯 مهمتك: تحليل المشاريع بصرامة ووضوح وواقعية تامة.

⛔ قواعد صارمة:
1. ممنوع المجاملة أو التفاؤل الزائف
2. إذا كانت الميزانية غير كافية، قل ذلك بصراحة
3. إذا كانت الفكرة سيئة، ارفضها واقترح بدائل
4. استخدم أرقام واقعية من السوق السعودي
5. اذكر منافسين حقيقيين بأسماء معروفة
6. خذ بعين الاعتبار خصائص المدينة (الرياض ≠ الباحة ≠ تبوك)

📋 المشروع: ${idea}
📍 الموقع: ${city}
💰 الميزانية: ${budgetNum.toLocaleString()} ريال سعودي

أرجع JSON فقط بدون أي نص آخر بهذا الشكل بالضبط:

{
  "score": 65,
  "decision": "عنوان قرار واضح",
  "decision_type": "positive",
  "summary": "ملخص مفصل في 3-4 أسطر",
  "market_demand": "عالي",
  "competition": "متوسطة",
  "cost_level": "متوسط",
  "risk_level": "متوسط",
  "market_analysis": {
    "market_size": "2.3 مليار ريال سنوياً",
    "target_audience": "وصف الجمهور",
    "buying_patterns": "أنماط الشراء",
    "seasonality": "متى الذروة",
    "expected_market_share": "0.5% - 2%",
    "growth_potential": "وصف النمو",
    "competitors": [
      {"name": "اسم منافس", "strength": "نقطة قوة", "weakness": "نقطة ضعف"},
      {"name": "اسم منافس", "strength": "نقطة قوة", "weakness": "نقطة ضعف"},
      {"name": "اسم منافس", "strength": "نقطة قوة", "weakness": "نقطة ضعف"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": 30000,
      "renovation": 50000,
      "equipment": 40000,
      "licenses": 10000,
      "initial_inventory": 20000,
      "marketing_launch": 15000,
      "working_capital": 35000,
      "total": 200000
    },
    "monthly_costs": {
      "rent": 10000,
      "salaries": 25000,
      "utilities": 3000,
      "materials": 15000,
      "marketing": 5000,
      "maintenance": 2000,
      "other": 3000,
      "total": 63000
    },
    "revenue_projection": {
      "month_1": 30000,
      "month_3": 60000,
      "month_6": 90000,
      "month_12": 120000,
      "year_2_monthly": 150000,
      "year_3_monthly": 180000
    },
    "break_even_months": 14,
    "roi_percentage": 35,
    "annual_profit_year1": 200000,
    "annual_profit_year3": 600000
  },
  "swot": {
    "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
    "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3"],
    "opportunities": ["فرصة 1", "فرصة 2", "فرصة 3"],
    "threats": ["تهديد 1", "تهديد 2", "تهديد 3"]
  },
  "recommendations": [
    "توصية 1",
    "توصية 2",
    "توصية 3",
    "توصية 4",
    "توصية 5"
  ],
  "kpis": [
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"}
  ],
  "risk_analysis": [
    {"risk": "مخاطرة 1", "description": "شرح", "probability": "متوسط", "impact": "شديد", "mitigation": "خطة"},
    {"risk": "مخاطرة 2", "description": "شرح", "probability": "عالي", "impact": "متوسط", "mitigation": "خطة"},
    {"risk": "مخاطرة 3", "description": "شرح", "probability": "متوسط", "impact": "متوسط", "mitigation": "خطة"},
    {"risk": "مخاطرة 4", "description": "شرح", "probability": "منخفض", "impact": "متوسط", "mitigation": "خطة"}
  ],
  "alternative_idea": "فكرة بديلة أو فارغ",
  "alternative_city": "مدينة بديلة أو فارغ",
  "locations": {
    "best": {"name": "اسم", "score": 85, "reason": "شرح"},
    "worst": {"name": "اسم", "score": 25, "reason": "شرح"}
  }
}

⚠️ تذكير: لا مجاملة. الواقعية أولاً. أرجع JSON فقط.`;

    console.log("🚀 Calling Claude API...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    console.log("📡 Claude API Response Status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Claude API Error:", errText);
      return Response.json({ 
        error: "خطأ من Claude API: " + response.status,
        details: errText.substring(0, 500)
      }, { status: 500 });
    }

    const data = await response.json();
    console.log("✅ Claude responded successfully");
    
    const text = data.content[0].text;
    console.log("📝 Response length:", text.length);

    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const result = JSON.parse(jsonStr);
      console.log("✅ JSON parsed successfully");
      return Response.json(result);
    } catch (parseErr) {
      console.error("❌ Parse Error:", parseErr.message);
      console.error("Raw text first 500 chars:", text.substring(0, 500));
      return Response.json({ 
        error: "خطأ في معالجة النتيجة",
        details: parseErr.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    console.error("Stack:", error.stack);
    return Response.json({ 
      error: "خطأ في الخادم: " + error.message
    }, { status: 500 });
  }
}
