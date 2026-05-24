import { CITIES_DATA, SECTOR_FINANCIALS, SALARIES, getCityBrief, getFinancialBrief } from "../../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { budget, city, sector } = await req.json();
    console.log("Suggestions Request:", { budget, city, sector });

    if (!budget) {
      return Response.json({ error: "الميزانية مطلوبة" }, { status: 400 });
    }

    // مفتاح Groq منفصل خاص بقسم الاقتراحات
    const apiKey = process.env.GROQ_API_KEY_SUGGESTIONS;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    const cityName = city ? city.trim() : null;
    const cityBrief = cityName ? (getCityBrief(cityName) || "") : "";

    // إن حدد المستخدم قطاعاً، نمرر أرقامه. وإلا نمرر ملخص كل القطاعات
    let sectorContext = "";
    if (sector && sector !== "أخرى / غير مدرج" && SECTOR_FINANCIALS[sector]) {
      sectorContext = `القطاع المطلوب: ${sector}\n${getFinancialBrief(sector)}`;
    } else {
      const allSectors = Object.keys(SECTOR_FINANCIALS).map(s => {
        const f = SECTOR_FINANCIALS[s];
        return `- ${s}: تأسيس ${f.setup_total.min.toLocaleString()}-${f.setup_total.max.toLocaleString()} ريال، هامش ${f.profit_margin}`;
      }).join("\n");
      sectorContext = `القطاعات المتاحة وأرقامها المرجعية:\n${allSectors}`;
    }

    const systemPrompt = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. مهمتك اقتراح مشاريع واقعية ومربحة تناسب ميزانية المستخدم بالضبط.

شخصيتك: صادق تماماً، واقعي، لا تجامل. تقترح فقط مشاريع حقيقية قابلة للتنفيذ فعلاً في السوق السعودي بالميزانية المعطاة.

مبدؤك: كل اقتراح يجب أن تكون ميزانيته ضمن قدرة المستخدم المالية، وأرقامه مستندة إلى دراسات الجدوى المعطاة لك. لا تقترح مشاريع تتجاوز الميزانية بكثير، ولا مشاريع وهمية.

ترجع JSON صحيح فقط، بدون أي نص قبله أو بعده.`;

    const userPrompt = `اقترح مشاريع استثمارية واقعية بناءً على المعطيات التالية:

الميزانية المتاحة: ${budgetNum.toLocaleString()} ريال${cityName ? `\nالمدينة: ${cityName}` : '\nالمدينة: غير محددة (اقترح مشاريع تصلح لأغلب المدن السعودية)'}

${cityBrief}

${sectorContext}

الرواتب المرجعية: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}

═══ قواعد الاقتراح الصارمة ═══

1. اقترح 6 مشاريع محددة بأسماء واضحة وعملية (مثل: محمصة قهوة مختصة مع توصيل، مغسلة سيارات متنقلة، مركز دورات تدريبية أونلاين) - ممنوع الأوصاف العامة الفضفاضة.

2. كل مشروع يجب أن تكون تكلفة تأسيسه ضمن أو قريبة من ${budgetNum.toLocaleString()} ريال. لا تقترح مشاريع تحتاج ضعف الميزانية.

3. نوّع الاقتراحات: مشاريع آمنة مستقرة، ومشاريع نمو أعلى مخاطرة، وفكرة أو فكرتين مبتكرتين "خارج الصندوق" لكن قابلتين للتنفيذ فعلاً.

4. الأرقام واقعية ومستندة لدراسات الجدوى المعطاة. كن متحفظاً في تقدير الأرباح.

5. لكل مشروع اذكر بصدق: لماذا يناسب هذه الميزانية، ومستوى المخاطرة، وأبرز تحدٍّ.

6. ${cityName ? `راعِ خصائص ${cityName} في اقتراحاتك` : 'اقترح مشاريع مرنة تصلح لمدن متعددة'}.

أرجع JSON صحيح فقط بهذا الشكل:

{
  "budget_assessment": "<تقييم صريح 2-3 أسطر: هل هذه الميزانية جيدة؟ ما نوع المشاريع التي تفتحها؟ ما حدودها؟>",
  "suggestions": [
    {
      "name": "<اسم المشروع المحدد>",
      "sector": "<القطاع>",
      "type": "<آمن / نمو / مبتكر>",
      "setup_cost": "<التكلفة التقديرية بالريال - رقم أو نطاق>",
      "monthly_profit_estimate": "<تقدير الربح الشهري الواقعي بالريال>",
      "break_even": "<نقطة التعادل التقديرية بالأشهر>",
      "risk_level": "<منخفض / متوسط / عالي>",
      "why_fits": "<لماذا يناسب الميزانية - جملة واقعية>",
      "main_challenge": "<أبرز تحدٍّ يواجه هذا المشروع>",
      "success_tip": "<نصيحة عملية واحدة لنجاحه>"
    }
  ]
}

ملاحظة: مصفوفة suggestions يجب أن تحتوي 6 مشاريع بالضبط.`;

    console.log("Calling Groq for suggestions...");

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
        max_tokens: 5000,
        response_format: { type: "json_object" }
      })
    });

    console.log("Groq Status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq Error:", errText.substring(0, 400));
      return Response.json({ error: "خطأ من Groq: " + response.status }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return Response.json({ error: "لا يوجد رد" }, { status: 500 });
    }

    console.log("Got suggestions response, length:", text.length);

    try {
      const result = JSON.parse(text);
      return Response.json(result);
    } catch (parseErr) {
      console.error("Parse Error:", parseErr.message);
      return Response.json({ error: "خطأ في معالجة النتيجة" }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ error: "خطأ في الخادم: " + error.message }, { status: 500 });
  }
}
