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

    const isCustomSector = userSector === "أخرى / غير مدرج";
    const sector = (userSector && !isCustomSector) ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);

    // ═══ معطيات المشروع المشتركة ═══
    const projectContext = `المشروع: ${idea}
القطاع: ${sector}${isCustomSector ? ' (المستخدم اختار "غير مدرج" - حلّل الفكرة حسب طبيعتها وأقرب قطاع شبيه)' : ''}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${budgetNum.toLocaleString()} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}
التراخيص: سجل تجاري ${LICENSES.commercial_register}، رخصة بلدية ${LICENSES.municipal_license}`;

    // ═══ تعليمات الأسلوب المشتركة ═══
    const styleGuide = `أسلوب الكتابة: اكتب كأنك مستشار خبير تجلس مع صاحب المشروع وتنصحه بصدق. لغة عربية طبيعية وإنسانية، خاطبه مباشرة ("مشروعك"، "ميزانيتك"، "أنصحك"). تجنّب العبارات الآلية ("يُعتبر"، "تجدر الإشارة"، "بشكل عام"). اشرح "لماذا" وراء كل رقم. لا مجاملة - كن صادقاً وواقعياً.`;

    const systemPrompt = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية داخل السوق السعودي. صارم، صادق، لا تجامل. الأرقام المالية المعطاة لك من دراسات جدوى حقيقية - استخدمها كأساس إلزامي ولا تخترع أرقاماً. اجعل المجاميع متطابقة (مجموع البنود = الإجمالي).

قاعدة لغة إلزامية: اكتب كل النصوص باللغة العربية الفصحى فقط. ممنوع منعاً تاماً استخدام أي كلمة أو حرف من لغة أخرى (صينية، إنجليزية، أو غيرها). الأرقام تُكتب بالأرقام العادية. أي حرف غير عربي يُعتبر خطأ فادحاً.

ترجع JSON صحيح فقط، بدون أي نص قبله أو بعده.`;

    // ═══ الاستدعاء الأول: التحليل الأساسي ═══
    const promptCore = `حلّل هذا المشروع بصرامة وواقعية تامة كدراسة جدوى حقيقية:

${projectContext}

${styleGuide}

قواعد مهمة:
- الأرقام واقعية ودقيقة، المجاميع متطابقة، عدّلها حسب حجم المدينة والحي.
- إذا الميزانية أقل من الحد الأدنى للتأسيس = score أقل من 35 + توضيح صريح كم ينقص.
- المنافسون: اذكر 5 منافسين حقيقيين بأسماء فعلية من نفس نوع المشروع بالضبط (مطعم شاورما → مطاعم شاورما حقيقية، وليس ماكدونالدز). ممنوع منعاً تاماً الأسماء الوهمية أو المرقّمة مثل "كوفي شوب 1" أو "منافس 2" - هذا خطأ فادح. إذا كنت لا تعرف أسماء محلات محددة في المدينة، اكتب أوصافاً واقعية بدل الأسماء (مثل: "مقهى محلي في الحي يقدم أسعاراً منافسة"، "سلسلة قهوة معروفة"). كل منافس يجب أن يكون إما اسماً حقيقياً معروفاً أو وصفاً واقعياً، لا رقماً.
- نقطة التعادل = إجمالي التأسيس ÷ (الإيراد الشهري - التكلفة الشهرية). الـ ROI = (الربح السنوي ÷ رأس المال) × 100.
- الأحياء حقيقية من ${cityName}.

أرجع JSON صحيح فقط:

{
  "score": <0-100 واقعي>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص 5-6 أسطر بأسلوب إنساني مباشر: هل ميزانيتك تكفي؟ كم تحتاج فعلياً؟ ما يقلقني؟ ما الذي يحدد نجاحك؟>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق لـ ${cityName}>",
    "target_audience": "<الجمهور>",
    "buying_patterns": "<أنماط الشراء>",
    "seasonality": "<الموسمية>",
    "expected_market_share": "<النسبة الواقعية>",
    "growth_potential": "<النمو على 5 سنوات>",
    "competitors": [
      {"name": "<منافس>", "strength": "<قوة>", "weakness": "<ضعف>"},
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
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  }
}`;

    // ═══ الاستدعاء الثاني: الخطة والتفاصيل ═══
    const promptPlan = `أنت تكمل دراسة جدوى لهذا المشروع. ركّز على الخطة التنفيذية والتفاصيل العملية:

${projectContext}

${styleGuide}

قواعد:
- الخطة التنفيذية: 3 مراحل واقعية (1-30، 31-60، 61-90 يوم)، كل مرحلة مهام عملية ملموسة.
- التسعير: 4 منتجات/خدمات رئيسية، لكل واحد سعر بيع وتكلفة وهامش ربح، أسعار واقعية للسوق السعودي.
- العميل المثالي: صفه بدقة (العمر، الدخل، السلوك، أين تجده).
- التراخيص: التصاريح الفعلية المطلوبة في السعودية مع جهة الإصدار.
- التميّز: 3 طرق عملية ملموسة للتميّز عن المنافسين، ليست شعارات.

أرجع JSON صحيح فقط:

{
  "action_plan": [
    {"phase": "اليوم 1-30", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 31-60", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 61-90", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]}
  ],
  "pricing": {
    "items": [
      {"name": "<منتج/خدمة>", "price": "<سعر البيع بالريال>", "cost": "<التكلفة بالريال>", "margin": "<هامش الربح %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"}
    ],
    "note": "<ملاحظة عن استراتيجية التسعير بأسلوب إنساني>"
  },
  "break_even_detail": {
    "months": <عدد الأشهر>,
    "explanation": "<شرح إنساني مبسّط: متى يبدأ المشروع يغطّي تكاليفه ولماذا>"
  },
  "ideal_customer": {
    "age_group": "<الفئة العمرية>",
    "income_level": "<مستوى الدخل>",
    "behavior": "<نمط الحياة والسلوك الشرائي>",
    "where_to_reach": "<أين تجده وكيف توصل له تسويقياً>"
  },
  "licenses_needed": [
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"}
  ],
  "differentiation": [
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>"
  ]
}`;

    // دالة استدعاء Groq
    async function callGroq(userPrompt, attempt = 1) {
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
          max_tokens: 3500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        // خطأ 429 = تجاوز حد الطلبات: ننتظر ونعيد المحاولة (حتى 3 مرات)
        if (response.status === 429 && attempt < 3) {
          console.log(`Rate limited, retrying (attempt ${attempt + 1})...`);
          await new Promise(r => setTimeout(r, 4000 * attempt));
          return callGroq(userPrompt, attempt + 1);
        }
        const errText = await response.text();
        console.error("Groq Error:", response.status, errText.substring(0, 300));
        if (response.status === 429) {
          throw new Error("الخدمة مزدحمة حالياً، حاول بعد دقيقة");
        }
        throw new Error("خطأ من Groq: " + response.status);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("لا يوجد رد من Groq");

      // فحص: إذا الرد فيه حروف صينية/يابانية/كورية = النموذج هلوس، نعيد المحاولة
      const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text);
      if (hasCJK && attempt < 3) {
        console.log(`Foreign characters detected, retrying (attempt ${attempt + 1})...`);
        await new Promise(r => setTimeout(r, 1000));
        return callGroq(userPrompt, attempt + 1);
      }

      return JSON.parse(text);
    }

    console.log("Calling Groq (2 sequential requests)...");

    // ═══ الاستدعاءان بالتتابع (واحد بعد الثاني) ═══
    const coreResult = await callGroq(promptCore);
    // فاصل بسيط بين الاستدعاءين لتجنّب حد الطلبات
    await new Promise(r => setTimeout(r, 1500));
    const planResult = await callGroq(promptPlan);

    // دمج النتيجتين
    const merged = { ...coreResult, ...planResult };
    const validated = validateFinancials(merged);

    console.log("Analysis complete");
    return Response.json(validated);

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ error: error.message || "خطأ في الخادم" }, { status: 500 });
  }
}

// ═══ طبقة التحقق الرياضي ═══
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      const sum = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                  (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                  (sc.working_capital||0);
      if (sum > 0 && Math.abs((sc.total||0) - sum) / sum > 0.01) {
        sc.total = sum;
      }
    }

    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      const sum = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                  (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                  (mc.other||0);
      if (sum > 0 && Math.abs((mc.total||0) - sum) / sum > 0.01) {
        mc.total = sum;
      }
    }

    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rev12 = fa.revenue_projection?.month_12 || 0;

    if (rev12 > 0 && monthlyTotal > 0) {
      const monthlyProfit = rev12 - monthlyTotal;
      const rev1 = fa.revenue_projection?.month_1 || 0;
      const rev3 = fa.revenue_projection?.month_3 || 0;
      const rev6 = fa.revenue_projection?.month_6 || 0;
      const avgMonthlyRev = (rev1 + rev3*2 + rev6*3 + rev12*6) / 12;
      const estAnnualProfit = Math.round((avgMonthlyRev - monthlyTotal) * 12);

      if (fa.annual_profit_year1 != null) {
        const stated = fa.annual_profit_year1;
        if (estAnnualProfit !== 0 && Math.abs(stated - estAnnualProfit) / Math.abs(estAnnualProfit) > 0.25) {
          fa.annual_profit_year1 = estAnnualProfit;
        }
      }

      if (monthlyProfit > 0 && setupTotal > 0) {
        const estBreakEven = Math.ceil(setupTotal / monthlyProfit);
        if (fa.break_even_months != null && estBreakEven > 0 && estBreakEven <= 120) {
          const stated = fa.break_even_months;
          if (Math.abs(stated - estBreakEven) / estBreakEven > 0.4) {
            fa.break_even_months = estBreakEven;
          }
        }
        // مزامنة break_even_detail مع نقطة التعادل المحسوبة
        if (result.break_even_detail && estBreakEven > 0 && estBreakEven <= 120) {
          if (Math.abs((result.break_even_detail.months||0) - fa.break_even_months) > 3) {
            result.break_even_detail.months = fa.break_even_months;
          }
        }
      }

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
    return result;
  }
}
