export async function POST(request) {
  try {
    const { idea, city, budget } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const prompt = `أنت محلل استثماري للسوق السعودي. مهم: أرجع JSON فقط بدون أي نص قبله أو بعده، بدون markdown، بدون شرح.

الفكرة: ${idea}
المدينة: ${city}
الميزانية: ${budget} ريال

أرجع هذا JSON بالضبط:
{"score":75,"decision":"فرصة واعدة","decision_type":"positive","market_demand":"مرتفع","competition":"متوسطة","cost_level":"متوسط","risk_level":"منخفض","summary":"ملخص قصير","market_insight":"تحليل السوق في فقرة","financial_insight":"التحليل المالي في فقرة","risk_insight":"تحليل المخاطر في فقرة","best_location":{"name":"حي العليا","score":86},"worst_location":{"name":"حي بعيد","score":30},"costs":{"rent":14000,"operations":9000,"salaries":21000,"total":44000},"risks":["خطر 1","خطر 2","خطر 3"],"alternative_idea":"فكرة بديلة","alternative_city":"جدة","monthly_data":[40,45,52,48,61,74],"strengths":["نقطة 1","نقطة 2","نقطة 3"]}

decision_type يجب أن يكون "positive" أو "negative" فقط.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    const data = await res.json();
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "لم يرجع JSON صحيح: " + text.substring(0, 100) }, { status: 500 });
    }

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
