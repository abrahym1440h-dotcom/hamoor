export async function POST(request) {
  try {
    const { idea, city, budget } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const prompt = `حلل هذه الفكرة الاستثمارية في السوق السعودي وأجب فقط بـ JSON صحيح بدون أي نص آخر.

الفكرة: ${idea}
المدينة: ${city}
الميزانية: ${budget} ريال

أجب بهذا الشكل بالضبط (JSON فقط):
{
  "score": 75,
  "decision": "فرصة واعدة",
  "decision_type": "positive",
  "market_demand": "مرتفع",
  "competition": "متوسطة",
  "cost_level": "متوسط",
  "risk_level": "منخفض",
  "summary": "ملخص في جملة",
  "market_insight": "تحليل السوق",
  "financial_insight": "التحليل المالي",
  "risk_insight": "تحليل المخاطر",
  "best_location": {"name": "حي العليا — الرياض", "score": 86},
  "worst_location": {"name": "حي بعيد", "score": 30},
  "costs": {"rent": 14000, "operations": 9000, "salaries": 21000, "total": 44000},
  "risks": ["خطر 1", "خطر 2", "خطر 3"],
  "alternative_idea": "فكرة بديلة",
  "alternative_city": "جدة",
  "monthly_data": [40, 45, 52, 48, 61, 74],
  "strengths": ["نقطة 1", "نقطة 2", "نقطة 3"]
}

ملاحظات:
- decision_type: "positive" إذا الفرصة جيدة، "negative" إذا غير مجدية
- جميع الأرقام بالريال السعودي
- البيانات واقعية للسوق السعودي`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await res.json();
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "لم يرجع JSON صحيح" }, { status: 500 });
    }

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
