import { CITIES_DATA, SALARIES, LICENSES, detectSector, getCityBrief, getSectorBrief, getFinancialBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { idea, sector: userSector, city, budget } = await req.json();
    console.log("Request:", { idea, userSector, city, budget });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;

    // القطاع: نعتمد اختيار المستخدم إن وُجد، وإلا نكتشفه تلقائياً
    const isCustomSector = userSector === "أخرى / غير مدرج";
    const sector = (userSector && !isCustomSector) ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);

    const systemPrompt = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية داخل السوق السعودي. عملت على مئات المشاريع الحقيقية وتعرف أرقامها بالريال والهللة.

شخصيتك: صارم، صادق تماماً، لا تجامل أبداً. تتكلم بلغة عربية واضحة ومهنية يفهمها صاحب المشروع ويثق فيها. أنت لست متفائلاً ولست متشائماً - أنت واقعي.

منهجيتك في التحليل (اتبعها بالترتيب قبل كتابة النتيجة):
1. حدّد التكاليف الفعلية بناءً على الأرقام المرجعية المعطاة، وعدّلها حسب المدينة والحي.
2. احسب مجموع بنود التأسيس، وتأكد أنه يساوي الإجمالي تماماً.
3. احسب مجموع البنود الشهرية، وتأكد أنه يساوي الإجمالي تماماً.
4. قدّر الإيرادات بتحفّظ (الأغلب يبدأ ضعيفاً).
5. احسب نقطة التعادل = إجمالي التأسيس ÷ (الإيراد الشهري - التكلفة الشهرية).
6. احسب العائد على الاستثمار = (الربح السنوي ÷ رأس المال) × 100.
7. راجع: هل كل الأرقام متسقة منطقياً مع بعضها؟ صحّح أي تناقض قبل الإخراج.

مبدؤك الأساسي: الأرقام المالية المعطاة لك مستخرجة من دراسات جدوى حقيقية - استخدمها كأساس إلزامي ولا تخترع أرقاماً من خيالك. كل رقم تكتبه يجب أن يكون قابلاً للتبرير وناتجاً عن حساب واضح.

ترجع JSON صحيح فقط، بدون أي نص قبله أو بعده.`;

    const userPrompt = `حلّل هذا المشروع بصرامة وواقعية تامة كأنك تكتب دراسة جدوى حقيقية سيبني عليها المستخدم قراراً بأمواله:

المشروع: ${idea}
القطاع: ${sector}${isCustomSector ? ' (المستخدم اختار "غير مدرج" - حلّل الفكرة كما هي بناءً على طبيعتها وأقرب قطاع شبيه)' : ' (محدد من المستخدم)'}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${budgetNum.toLocaleString()} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}
التراخيص: سجل تجاري ${LICENSES.commercial_register}، رخصة بلدية ${LICENSES.municipal_license}

═══ قواعد التحليل الصارمة ═══

1. واقعية الأرقام (الأهم): كل رقم مالي يجب أن يكون واقعياً ودقيقاً كأنه من السوق الفعلي. الأرقام تُحسب بدقة وليست تقديرات عشوائية - اجعل المجاميع متطابقة (مجموع بنود التأسيس = total، ومجموع البنود الشهرية = total). استخدم الأرقام المعطاة أعلاه كأساس إلزامي وعدّلها حسب:
   - حجم المدينة: ${cityName} (مدينة كبيرة = الحد الأعلى من النطاق، صغيرة = الحد الأدنى)
   - الحي إن وُجد (حي راقٍ = إيجار أعلى)
   - لا تخترع أرقاماً خارج النطاقات المعطاة إلا بسبب واضح ومذكور

2. مطابقة الميزانية مع التكلفة:
   - إذا ميزانية المستخدم أقل من الحد الأدنى للتأسيس = سكور أقل من 35 + توضيح صريح بالأرقام كم ينقصه بالضبط
   - إذا كافية = حلل بالتفصيل الكامل

3. لغة تبني الثقة: اكتب بلغة واضحة وعملية وصادقة. اشرح "لماذا" وراء كل رقم وكل توصية باختصار، لا تكتفِ بالنتيجة. تجنّب العبارات الفضفاضة والعامة. كل جملة يجب أن تعطي المستخدم معلومة حقيقية يقدر يتصرف بناءً عليها. لا تبالغ في التفاؤل ولا في التخويف.

4. الإيرادات: استخدم السيناريو المناسب (ضعيف/متوسط/قوي) حسب واقعية المشروع والموقع. كن متحفظاً - الأغلب يبدأ ضعيفاً ثم ينمو تدريجياً.

5. نقطة التعادل والـ ROI: احسبها من الأرقام الفعلية المذكورة في تحليلك، واسترشد بنقطة التعادل النموذجية المعطاة. يجب أن تكون متسقة مع التكاليف والإيرادات التي ذكرتها.

6. المنافسون (مهم جداً): اذكر 5 منافسين حقيقيين من نفس نوع المشروع بالضبط، وليس من القطاع العام. المنافس الحقيقي هو من يقدّم نفس المنتج تقريباً لنفس العميل. أمثلة توضيحية:
   - مشروع "مطعم شاورما" → منافسوه مطاعم شاورما ومشاوي (مثل: شاورمر، شاورما هاوس، مطاعم شاورما محلية في ${cityName})، وليس ماكدونالدز أو KFC.
   - مشروع "كوفي مختص" → منافسوه محامص ومقاهي قهوة مختصة، وليس مقهى وجبات.
   - مشروع "محل عبايات" → منافسوه محلات العبايات، وليس محلات الأزياء العامة.
   اختر منافسين فعليين موجودين في ${cityName} أو قريبين منها، من نفس فئة المشروع تحديداً. إذا كان السوق يغلب عليه محلات محلية صغيرة بلا أسماء شهيرة، قل ذلك بصراحة واذكرها كـ "محلات محلية في الحي".

7. الأحياء: استخدم أحياء حقيقية من قائمة ${cityName} فقط.

8. التعامل مع الأفكار غير التقليدية: بعض المستخدمين سيقدمون أفكاراً مبتكرة أو غير مألوفة أو "خارج الصندوق". لا ترفضها لمجرد غرابتها ولا تجاملها لمجرد جدّتها - حلّلها بنفس الصرامة: ابحث عن أقرب قطاع شبيه لها، قدّر أرقامها بمنطق واضح، واذكر بصراحة إن كانت سابقة لوقتها أو السوق غير جاهز لها. الفكرة المبتكرة الناجحة والفكرة المبتكرة الفاشلة كلاهما وارد - مهمتك التمييز بينهما بالأرقام والمنطق.

9. البدائل: 5 مشاريع حقيقية محددة بأسماء واضحة (مثل: محمصة قهوة مع توصيل، مغسلة سيارات متنقلة) - ممنوع أوصاف عامة. كل بديل مناسب لـ ${cityName}${neighborhood ? ` وحي ${neighborhood}` : ''} وميزانية قريبة من ${budgetNum.toLocaleString()} ريال.

10. لا مجاملة إطلاقاً: لو الفكرة ضعيفة أو الميزانية غير كافية أو الموقع غير مناسب، قلها بوضوح وصراحة في decision و summary. صاحب المشروع يثق فيك لأنك صادق، لا لأنك مشجّع.

أرجع JSON صحيح فقط:

{
  "score": <0-100 واقعي>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص واقعي 5-6 أسطر بلغة واضحة وصادقة: الميزانية كافية أو لا؟ كم المطلوب فعلياً بالريال؟ أبرز المخاطر؟ ما الذي يحدد نجاح أو فشل هذا المشروع تحديداً؟>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق لـ ${cityName}>",
    "target_audience": "<الجمهور في ${cityName}>",
    "buying_patterns": "<أنماط الشراء>",
    "seasonality": "<الموسمية>",
    "expected_market_share": "<النسبة الواقعية>",
    "growth_potential": "<النمو على 5 سنوات>",
    "competitors": [
      {"name": "<منافس في ${cityName}>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {"rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0, "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0},
    "monthly_costs": {"rent": 0, "salaries": 0, "utilities": 0, "materials": 0, "marketing": 0, "maintenance": 0, "other": 0, "total": 0},
    "revenue_projection": {"month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0, "year_2_monthly": 0, "year_3_monthly": 0},
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
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"},
    {"risk": "<مخاطرة>", "description": "<شرح>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة>"}
  ],
  "alternatives": [
    {"idea": "<مشروع حقيقي محدد مناسب لـ ${cityName}>", "score": <0-100>, "reason": "<لماذا مناسب>", "budget_needed": "<مبلغ بالريال>"},
    {"idea": "<مشروع حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<مشروع حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<مشروع حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"},
    {"idea": "<مشروع حقيقي محدد>", "score": <0-100>, "reason": "<السبب>", "budget_needed": "<مبلغ>"}
  ],
  "alternative_idea": "",
  "alternative_city": "",
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  }
}`;

    console.log("Calling Groq...");

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
        temperature: 0.3,
        max_tokens: 6000,
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

    console.log("Got response, length:", text.length);

    try {
      const result = JSON.parse(text);
      const validated = validateFinancials(result);
      return Response.json(validated);
    } catch (parseErr) {
      console.error("Parse Error:", parseErr.message);
      return Response.json({ error: "خطأ في معالجة النتيجة" }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ error: "خطأ في الخادم: " + error.message }, { status: 500 });
  }
}

// ═══ طبقة التحقق الرياضي ═══
// تفحص أرقام التحليل وتصحّح أي تناقض حسابي تلقائياً
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    // 1. تصحيح مجموع تكاليف التأسيس
    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      const sum = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                  (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                  (sc.working_capital||0);
      // إذا الإجمالي مختلف عن المجموع الفعلي بأكثر من 1%، نصحّحه
      if (sum > 0 && Math.abs((sc.total||0) - sum) / sum > 0.01) {
        sc.total = sum;
      }
    }

    // 2. تصحيح مجموع التكاليف الشهرية
    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      const sum = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                  (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                  (mc.other||0);
      if (sum > 0 && Math.abs((mc.total||0) - sum) / sum > 0.01) {
        mc.total = sum;
      }
    }

    // 3. التحقق من نقطة التعادل والربح السنوي
    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rev12 = fa.revenue_projection?.month_12 || 0;

    if (rev12 > 0 && monthlyTotal > 0) {
      const monthlyProfit = rev12 - monthlyTotal;
      // الربح السنوي للسنة الأولى (تقدير متحفظ: متوسط نمو تدريجي)
      const rev1 = fa.revenue_projection?.month_1 || 0;
      const rev3 = fa.revenue_projection?.month_3 || 0;
      const rev6 = fa.revenue_projection?.month_6 || 0;
      const avgMonthlyRev = (rev1 + rev3*2 + rev6*3 + rev12*6) / 12;
      const estAnnualProfit = Math.round((avgMonthlyRev - monthlyTotal) * 12);

      // إذا الربح السنوي المذكور بعيد جداً عن المحسوب، نصحّحه
      if (fa.annual_profit_year1 != null) {
        const stated = fa.annual_profit_year1;
        if (estAnnualProfit !== 0 && Math.abs(stated - estAnnualProfit) / Math.abs(estAnnualProfit) > 0.25) {
          fa.annual_profit_year1 = estAnnualProfit;
        }
      }

      // تصحيح نقطة التعادل إذا كانت غير منطقية
      if (monthlyProfit > 0 && setupTotal > 0) {
        const estBreakEven = Math.ceil(setupTotal / monthlyProfit);
        if (fa.break_even_months != null && estBreakEven > 0 && estBreakEven <= 120) {
          const stated = fa.break_even_months;
          if (Math.abs(stated - estBreakEven) / estBreakEven > 0.4) {
            fa.break_even_months = estBreakEven;
          }
        }
      }

      // تصحيح ROI إذا كان غير متسق (ROI = ربح سنوي / رأس المال × 100)
      if (setupTotal > 0 && fa.annual_profit_year1 != null) {
        const estROI = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
        if (fa.roi_percentage != null) {
          if (Math.abs(fa.roi_percentage - estROI) > 15) {
            fa.roi_percentage = estROI;
          }
        }
      }
    }

    return result;
  } catch (e) {
    console.error("Validation error:", e.message);
    return result; // عند أي خطأ، نرجّع النتيجة الأصلية بدون تعديل
  }
}
