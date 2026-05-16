export async function POST(request) {
  try {
    const { name } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const prompt = `أنت محلل قطاعات في السوق السعودي. أرجع JSON فقط بدون أي نص قبله أو بعده.

القطاع: ${name}

أرجع هذا JSON بالضبط:
{"overview":"نظرة عامة في جملتين","opportunity":"الفرصة الاستثمارية في جملة","challenges":"أبرز التحديات في جملة","top_cities":["الرياض","جدة","الدمام"],"tips":["نصيحة 1","نصيحة 2","نصيحة 3"],"avg_investment":"200,000 ريال","roi_period":"18-24 شهراً"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: "لم يرجع JSON" }, { status: 500 });

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
