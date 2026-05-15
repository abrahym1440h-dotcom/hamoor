export async function POST(request) {
  try {
    const { title } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const prompt = `اكتب مقالة عربية تعليمية بعنوان "${title}" لرواد الأعمال السعوديين. المقالة من 4-5 فقرات، كل فقرة 3-4 جمل. ابدأ مباشرة بالمقالة بدون عنوان أو مقدمة.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return Response.json({ content: text.trim() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
