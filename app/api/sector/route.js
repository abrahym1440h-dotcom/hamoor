export async function POST(request) {
  try {
    const { name } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const prompt = `حلل قطاع "${name}" في السوق السعودي. أجب فقط بـ JSON بدون نص آخر:
{
  "overview": "نظرة عامة على القطاع في جملتين",
  "opportunity": "الفرصة الاستثمارية في جملة",
  "challenges": "أبرز التحديات في جملة",
  "top_cities": ["الرياض", "جدة", "الدمام"],
  "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"],
  "avg_investment": "200,000 ريال",
  "roi_period": "18-24 شهراً"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      }
    );

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: "لم يرجع JSON" }, { status: 500 });

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
