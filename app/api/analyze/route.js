export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function callGemini(apiKey, prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      });

      if (response.status === 503 || response.status === 429) {
        console.log(`⚠️ Attempt ${attempt}: API busy, retrying...`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error:", errText);
        throw new Error(`Gemini API: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("No response from Gemini");
      
      return text;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
}

export async function POST(req) {
  try {
    const { idea, city, budget } = await req.json();

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ GEMINI_API_KEY not found");
      return Response.json({ error: "مفتاح Gemini غير موجود" }, { status: 500 });
    }

    console.log("✅ GEMINI_API_KEY found");
    const budgetNum = parseInt(budget);

    const prompt = `أنت خبير اقتصادي ومستشار أعمال سعودي بخبرة 25 سنة في تأسيس وتقييم المشاريع في السوق السعودي.

🎯 مهمتك: تحليل المشروع التالي بصرامة شديدة وواقعية تامة.

⛔ القواعد الصارمة:
1. ❌ ممنوع المجاملة أو التفاؤل غير المبرر
2. ❌ ممنوع إعطاء سكور عالي لمشروع غير منطقي
3. ✅ إذا كانت الميزانية أقل من الحد الأدنى، اذكر ذلك صراحة
4. ✅ إذا كانت الفكرة غير عملية، ارفضها واقترح بدائل
5. ✅ استخدم أرقام واقعية من السوق السعودي 2025-2026
6. ✅ اذكر منافسين حقيقيين بأسماء معروفة سعودياً
7. ✅ احسب المدينة المحددة بدقة

📊 معايير التقييم (السكور 0-100):
- 85-100: ممتاز، 70-84: جيد جداً، 55-69: متوسط
- 40-54: ضعيف، 20-39: غير مناسب، 0-19: فاشل

📋 بيانات المشروع:
- المشروع: ${idea}
- الموقع: ${city}
- الميزانية: ${budgetNum.toLocaleString()} ريال

أرجع JSON فقط بهذا الشكل:

{
  "score": 0,
  "decision": "عنوان القرار",
  "decision_type": "positive أو negative",
  "summary": "ملخص مفصل 4-5 أسطر",
  "market_demand": "عالي",
  "competition": "متوسطة",
  "cost_level": "متوسط",
  "risk_level": "متوسط",
  "market_analysis": {
    "market_size": "حجم السوق بالأرقام",
    "target_audience": "وصف الجمهور",
    "buying_patterns": "أنماط الشراء",
    "seasonality": "الموسمية",
    "expected_market_share": "النسبة المتوقعة",
    "growth_potential": "وصف النمو",
    "competitors": [
      {"name": "منافس", "strength": "قوة", "weakness": "ضعف"},
      {"name": "منافس", "strength": "قوة", "weakness": "ضعف"},
      {"name": "منافس", "strength": "قوة", "weakness": "ضعف"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": 0,
      "renovation": 0,
      "equipment": 0,
      "licenses": 0,
      "initial_inventory": 0,
      "marketing_launch": 0,
      "working_capital": 0,
      "total": 0
    },
    "monthly_costs": {
      "rent": 0,
      "salaries": 0,
      "utilities": 0,
      "materials": 0,
      "marketing": 0,
      "maintenance": 0,
      "other": 0,
      "total": 0
    },
    "revenue_projection": {
      "month_1": 0,
      "month_3": 0,
      "month_6": 0,
      "month_12": 0,
      "year_2_monthly": 0,
      "year_3_monthly": 0
    },
    "break_even_months": 0,
    "roi_percentage": 0,
    "annual_profit_year1": 0,
    "annual_profit_year3": 0
  },
  "swot": {
    "strengths": ["قوة 1", "قوة 2", "قوة 3", "قوة 4"],
    "weaknesses": ["ضعف 1", "ضعف 2", "ضعف 3"],
    "opportunities": ["فرصة 1", "فرصة 2", "فرصة 3"],
    "threats": ["تهديد 1", "تهديد 2", "تهديد 3"]
  },
  "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4", "توصية 5"],
  "kpis": [
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"},
    {"name": "اسم", "target": "قيمة", "description": "شرح"}
  ],
  "risk_analysis": [
    {"risk": "مخاطرة", "description": "شرح", "probability": "متوسط", "impact": "شديد", "mitigation": "خطة"},
    {"risk": "مخاطرة", "description": "شرح", "probability": "عالي", "impact": "متوسط", "mitigation": "خطة"},
    {"risk": "مخاطرة", "description": "شرح", "probability": "متوسط", "impact": "متوسط", "mitigation": "خطة"},
    {"risk": "مخاطرة", "description": "شرح", "probability": "منخفض", "impact": "متوسط", "mitigation": "خطة"}
  ],
  "alternative_idea": "فكرة بديلة أو فارغ",
  "alternative_city": "مدينة بديلة أو فارغ",
  "locations": {
    "best": {"name": "اسم الحي", "score": 85, "reason": "شرح"},
    "worst": {"name": "اسم الحي", "score": 25, "reason": "شرح"}
  }
}

⚠️ لا مجاملة. الواقعية أولاً. JSON فقط بدون نص آخر.`;

    console.log("🚀 Calling Gemini...");
    const text = await callGemini(apiKey, prompt);
    console.log("✅ Gemini responded");

    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const result = JSON.parse(jsonStr);
      return Response.json(result);
    } catch (parseErr) {
      console.error("Parse Error:", parseErr.message);
      return Response.json({ error: "خطأ في معالجة النتيجة" }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ 
      error: error.message.includes("busy") ? "الخدمة مزدحمة، حاول بعد دقيقة" : "خطأ في الخادم"
    }, { status: 500 });
  }
}
