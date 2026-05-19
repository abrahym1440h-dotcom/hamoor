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
        console.log(`⚠️ Attempt ${attempt}: API busy, retrying in ${attempt * 2}s...`);
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
      console.log(`⚠️ Attempt ${attempt} failed:`, err.message);
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
      return Response.json({ error: "مفتاح Gemini غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);

    const prompt = `أنت خبير اقتصادي ومستشار أعمال سعودي بخبرة 25 سنة في تأسيس وتقييم المشاريع في السوق السعودي. لديك معرفة دقيقة بالأسعار، الإيجارات، الرواتب، التراخيص، والمنافسة في كل مدينة سعودية.

🎯 مهمتك: تحليل المشروع التالي بصرامة شديدة وواقعية تامة.

⛔ القواعد الصارمة (التزم بها بدقة):

1. ❌ ممنوع المجاملة أو التفاؤل غير المبرر
2. ❌ ممنوع إعطاء سكور عالي لمشروع غير منطقي حتى لو كان حجمه كبير
3. ✅ إذا كانت الميزانية أقل من الحد الأدنى الواقعي، اذكر ذلك صراحة وحدد المبلغ المطلوب فعلياً
4. ✅ إذا كانت الفكرة غير عملية (مثلاً: نادي كرة قدم بـ 2 مليون، أو فندق بـ 500 ألف)، ارفضها بصراحة واقترح بدائل
5. ✅ استخدم أرقام واقعية من السوق السعودي 2025-2026:
   - إيجار محل صغير في الرياض (العليا/الياسمين): 80,000-200,000 ريال سنوياً
   - إيجار محل صغير في الباحة/جازان: 30,000-70,000 ريال سنوياً
   - راتب موظف سعودي: 5,000-12,000 ريال
   - راتب موظف غير سعودي: 2,500-5,000 ريال
   - تكلفة السجل التجاري: 1,200 ريال
   - تكلفة الرخصة البلدية: 2,000-10,000 ريال
6. ✅ اذكر منافسين حقيقيين بأسماء معروفة سعودياً (ستاربكس، البيك، كودو، هرفي، نون، إكسترا، جرير، إلخ)
7. ✅ احسب المدينة المحددة بدقة:
   - الرياض: سوق ضخم، إيجارات مرتفعة، منافسة شرسة
   - جدة: سياحة وسوق متنوع، إيجارات متوسطة-عالية
   - الباحة: سوق صغير، إيجارات منخفضة، فرص في السياحة الجبلية
   - تبوك: نمو سريع بسبب نيوم، فرص استثنائية
   - الدمام/الخبر: قوة شرائية عالية، شركات نفطية
   - مكة/المدينة: موسمية الحج والعمرة
   - أبها: مصيف، موسمية صيفية
   - القصيم: تجارة وزراعة
8. ✅ كل نقطة قوة أو ضعف يجب أن تشرح "لماذا" و"كيف"
9. ✅ المخاطر يجب أن تكون محددة بأرقام أو سيناريوهات واقعية
10. ✅ التوصيات يجب أن تكون عملية وقابلة للتنفيذ فوراً

📊 معايير التقييم (السكور 0-100):
- 85-100: مشروع ممتاز، الميزانية كافية، الفكرة واضحة، السوق واعد
- 70-84: مشروع جيد جداً، يحتاج تعديلات صغيرة
- 55-69: مشروع متوسط، يحتاج تعديلات مهمة قبل البدء
- 40-54: مشروع ضعيف، مخاطر عالية، يحتاج إعادة دراسة
- 20-39: مشروع غير مناسب، الميزانية أو الفكرة فيها خلل
- 0-19: مشروع فاشل، لا تنفذه

🚨 قواعد السكور الإجبارية:
- ميزانية أقل من 50% من الحد الأدنى الواقعي = سكور تلقائي أقل من 35
- فكرة غير منطقية (مثل نادي كرة قدم بميزانية مشروع صغير) = سكور أقل من 25
- مشروع في موقع غير مناسب تماماً = خصم 15-20 نقطة

📋 بيانات المشروع:
- المشروع: ${idea}
- الموقع: ${city}
- الميزانية: ${budgetNum.toLocaleString()} ريال سعودي

⚠️ هام: أرجع JSON فقط بدون أي نص قبله أو بعده، بهذا الشكل بالضبط:

{
  "score": <رقم 0-100>,
  "decision": "<عنوان واضح 6-10 كلمات يلخص القرار>",
  "decision_type": "<positive إذا السكور >= 60 وإلا negative>",
  "summary": "<ملخص مفصل 4-5 أسطر يحدد الواقع بصراحة كاملة، اذكر إذا كانت الميزانية كافية أم لا، وهل الفكرة منطقية>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق بالأرقام في المدينة المحددة، مثلاً: 850 مليون ريال سنوياً في الرياض>",
    "target_audience": "<وصف تفصيلي للجمهور: الأعمار، الدخل، السلوك>",
    "buying_patterns": "<أنماط الشراء والسلوك الاستهلاكي>",
    "seasonality": "<متى الذروة ومتى التراجع مع شرح>",
    "expected_market_share": "<النسبة الواقعية المتوقعة>",
    "growth_potential": "<وصف النمو على 3-5 سنوات مع أرقام>",
    "competitors": [
      {"name": "<اسم منافس حقيقي معروف>", "strength": "<نقطة قوة محددة>", "weakness": "<نقطة ضعف يمكن استغلالها>"},
      {"name": "<اسم منافس حقيقي معروف>", "strength": "<نقطة قوة محددة>", "weakness": "<نقطة ضعف يمكن استغلالها>"},
      {"name": "<اسم منافس حقيقي معروف>", "strength": "<نقطة قوة محددة>", "weakness": "<نقطة ضعف يمكن استغلالها>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {
      "rent_deposit": <رقم - عادة 3 أشهر إيجار>,
      "renovation": <رقم - تجهيز وديكور>,
      "equipment": <رقم - معدات>,
      "licenses": <رقم - السجل التجاري + رخص بلدية>,
      "initial_inventory": <رقم - مخزون أولي>,
      "marketing_launch": <رقم - تسويق الإطلاق>,
      "working_capital": <رقم - 3 أشهر تشغيل>,
      "total": <مجموع الأرقام السابقة>
    },
    "monthly_costs": {
      "rent": <رقم>,
      "salaries": <رقم - رواتب الموظفين>,
      "utilities": <رقم - كهرباء وماء وإنترنت>,
      "materials": <رقم - مواد خام>,
      "marketing": <رقم - تسويق شهري>,
      "maintenance": <رقم - صيانة>,
      "other": <رقم - مصاريف متفرقة>,
      "total": <مجموع>
    },
    "revenue_projection": {
      "month_1": <رقم - واقعي للشهر الأول>,
      "month_3": <رقم - بعد استقرار>,
      "month_6": <رقم - نضوج جزئي>,
      "month_12": <رقم - نهاية السنة الأولى>,
      "year_2_monthly": <رقم - متوسط شهري سنة 2>,
      "year_3_monthly": <رقم - متوسط شهري سنة 3>
    },
    "break_even_months": <رقم الأشهر للوصول لنقطة التعادل>,
    "roi_percentage": <رقم نسبة العائد السنوي>,
    "annual_profit_year1": <رقم صافي ربح السنة الأولى>,
    "annual_profit_year3": <رقم صافي ربح السنة الثالثة>
  },
  "swot": {
    "strengths": ["<نقطة قوة 1 مع شرح لماذا>", "<نقطة قوة 2 مع شرح>", "<نقطة قوة 3 مع شرح>", "<نقطة قوة 4 مع شرح>"],
    "weaknesses": ["<نقطة ضعف 1 مع شرح>", "<نقطة ضعف 2 مع شرح>", "<نقطة ضعف 3 مع شرح>"],
    "opportunities": ["<فرصة 1 محددة>", "<فرصة 2 محددة>", "<فرصة 3 محددة>"],
    "threats": ["<تهديد 1 مع شرح>", "<تهديد 2 مع شرح>", "<تهديد 3 مع شرح>"]
  },
  "recommendations": [
    "<توصية استراتيجية مفصلة وعملية 1>",
    "<توصية استراتيجية مفصلة 2>",
    "<توصية استراتيجية مفصلة 3>",
    "<توصية استراتيجية مفصلة 4>",
    "<توصية استراتيجية مفصلة 5>"
  ],
  "kpis": [
    {"name": "<اسم المؤشر>", "target": "<قيمة مستهدفة محددة>", "description": "<شرح أهمية المؤشر>"},
    {"name": "<اسم المؤشر>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم المؤشر>", "target": "<قيمة>", "description": "<شرح>"},
    {"name": "<اسم المؤشر>", "target": "<قيمة>", "description": "<شرح>"}
  ],
  "risk_analysis": [
    {"risk": "<اسم المخاطرة>", "description": "<شرح تفصيلي>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة التخفيف بالتفصيل>"},
    {"risk": "<اسم>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<اسم>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<اسم>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"}
  ],
  "alternative_idea": "<اقترح فكرة بديلة أفضل إذا كانت الفكرة الحالية ضعيفة، أو اتركه فارغ إذا كانت ممتازة>",
  "alternative_city": "<اقترح مدينة بديلة أفضل إذا كانت المدينة غير مناسبة، أو اتركه فارغ>",
  "locations": {
    "best": {
      "name": "<اسم حي محدد في المدينة>",
      "score": <نسبة 0-100>,
      "reason": "<شرح مفصل لماذا هذا الحي الأفضل: الديموغرافية، القوة الشرائية، حركة المرور>"
    },
    "worst": {
      "name": "<اسم حي محدد>",
      "score": <نسبة 0-100>,
      "reason": "<شرح مفصل لماذا هذا الحي غير مناسب>"
    }
  }
}

⚠️ تذكير نهائي:
- لا مجاملة على الإطلاق
- الواقعية هي الأولوية
- لو الميزانية صغيرة، قل ذلك بوضوح
- لو الفكرة غير منطقية، ارفضها مع التوضيح
- استخدم بيانات حقيقية من السوق السعودي
- أرجع JSON فقط بدون أي نص آخر`;

    console.log("🚀 Calling Gemini API...");
    const text = await callGemini(apiKey, prompt);
    console.log("✅ Gemini responded, length:", text.length);

    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const result = JSON.parse(jsonStr);
      return Response.json(result);
    } catch (parseErr) {
      console.error("Parse Error:", parseErr.message);
      console.error("Raw text:", text.substring(0, 500));
      return Response.json({ 
        error: "خطأ في معالجة النتيجة، حاول مرة أخرى",
        details: parseErr.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ 
      error: error.message.includes("API busy") 
        ? "الخدمة مزدحمة حالياً، حاول بعد دقيقة"
        : "خطأ في الخادم، حاول مرة أخرى"
    }, { status: 500 });
  }
}
