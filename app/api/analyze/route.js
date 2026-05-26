import { CITIES_DATA, SALARIES, LICENSES, detectSector, getCityBrief, getSectorBrief, getFinancialBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { idea, sector: userSector, city, budget, extras } = await req.json();
    console.log("Request:", { idea, userSector, city, budget, extras });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;

    const sector = userSector ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);

    // ═══ معلومات إضافية من المستخدم ═══
    let extraInfo = "";
    if (extras) {
      const lines = [];
      if (extras.area) lines.push(`مساحة المحل: ${extras.area} متر مربع`);
      if (extras.actual_rent) lines.push(`الإيجار السنوي الفعلي (أكّده المستخدم): ${parseInt(extras.actual_rent).toLocaleString()} ريال — استخدم هذا الرقم كما هو في التحليل المالي`);
      if (extras.staff_count) lines.push(`عدد الموظفين المتوقع: ${extras.staff_count}`);
      if (extras.shop_state) lines.push(`حالة المحل: ${extras.shop_state}`);
      if (extras.experience) lines.push(`خبرة صاحب المشروع في هذا المجال: ${extras.experience}`);
      if (lines.length) extraInfo = "\n\nمعلومات إضافية مهمة قدّمها صاحب المشروع (استخدمها لرفع دقة التحليل):\n" + lines.join("\n");
    }

    // ═══ معطيات المشروع المشتركة ═══
    const projectContext = `المشروع: ${idea}
القطاع: ${sector}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${budgetNum.toLocaleString()} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب التقريبية: موظف سعودي ${SALARIES.emp_saudi}، خبرة عربية ${SALARIES.exp_arab}، عمالة آسيوية ${SALARIES.worker_asian}
التراخيص: سجل تجاري ${LICENSES.commercial_register}، رخصة بلدية ${LICENSES.municipal_license}${extraInfo}`;

    // ═══ تعليمات الأسلوب ═══
    const styleGuide = `أسلوب الكتابة: اكتب كأنك مستشار خبير تجلس مع صاحب المشروع وتنصحه بصدق. لغة عربية طبيعية وإنسانية، خاطبه مباشرة ("مشروعك"، "ميزانيتك"، "أنصحك"). تجنّب العبارات الآلية. اشرح "لماذا" وراء كل رقم. لا مجاملة - كن صادقاً وواقعياً.`;

    // ═══ تعليمات البحث ═══
    const searchInstructions = `مهم جداً - أنت متصل بالبحث الحي على الإنترنت:
ابحث فعلياً عن معلومات حديثة ودقيقة قبل أن تحلل. ابحث عن:
- متوسط أسعار إيجار المحلات التجارية في ${neighborhood ? `حي ${neighborhood} بـ` : ''}${cityName} حالياً
- تكاliف تأسيس مشاريع مشابهة لـ "${idea}" في السوق السعودي
- أسماء منافسين حقيقيين فعليين في ${cityName} لنفس نوع المشروع
- أرقام السوق الحديثة: حجم الطلب، اتجاهات النمو، الموسمية
- أي أنظمة أو تراخيص أو رسوم حكومية حديثة تخص هذا القطاع في السعودية
استخدم الأرقام التي تجدها من البحث كأساس. اربط كل رقم مهم بمصدره.`;

    const baseRules = `قاعدة لغة إلزامية: اكتب كل النصوص باللغة العربية الفصحى فقط. ممنوع منعاً تاماً استخدام أي كلمة أو حرف من لغة أخرى. الأرقام تُكتب بالأرقام العادية.

قواعد الدقة:
- استخدم أرقاماً واقعية مبنية على بحثك الفعلي، عدّلها حسب حجم المدينة والحي بدقة.
- المجاميع يجب أن تتطابق (مجموع البنود = الإجمالي).
- إذا الميزانية أقل من الحد الأدنى للتأسيس = score أقل من 35 + توضيح صريح كم ينقص.
- المنافسون: اذكر منافسين حقيقيين بأسماء فعلية وجدتها في بحثك. ممنوع الأسماء الوهمية أو المرقّمة مثل "كوفي شوب 1". إذا لم تجد أسماء محددة، اكتب أوصافاً واقعية دقيقة.
- نقطة التعادل = إجمالي التأسيس ÷ (الإيراد الشهري - التكلفة الشهرية). الـ ROI = (الربح السنوي ÷ رأس المال) × 100.
- الأحياء يجب أن تكون حقيقية من ${cityName}.`;

    // ═══ الاستدعاء الأول: التحليل الأساسي ═══
    const promptCore = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. حلّل هذا المشروع بصرامة وواقعية تامة كدراسة جدوى حقيقية مبنية على بحث فعلي.

${projectContext}

${searchInstructions}

${styleGuide}

${baseRules}

بعد بحثك، أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

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
    "market_size": "<حجم السوق لـ ${cityName} بأرقام من بحثك>",
    "target_audience": "<الجمهور>",
    "buying_patterns": "<أنماط الشراء>",
    "seasonality": "<الموسمية>",
    "expected_market_share": "<النسبة الواقعية>",
    "growth_potential": "<النمو على 5 سنوات>",
    "competitors": [
      {"name": "<منافس حقيقي>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس حقيقي>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس حقيقي>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس حقيقي>", "strength": "<قوة>", "weakness": "<ضعف>"},
      {"name": "<منافس حقيقي>", "strength": "<قوة>", "weakness": "<ضعف>"}
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
  },
  "data_freshness": "<جملة قصيرة: على ماذا اعتمدت من بحثك - مثلاً: اعتمدت على أسعار إيجارات حديثة ومعطيات السوق لعام 2026>"
}`;

    // ═══ الاستدعاء الثاني: الخطة والتفاصيل ═══
    const promptPlan = `أنت خبير استثماري سعودي تكمل دراسة جدوى لهذا المشروع. ركّز على الخطة التنفيذية والتفاصيل العملية، مبنية على بحث فعلي.

${projectContext}

ابحث على الإنترنت عن: التراخيص والتصاريح الحديثة المطلوبة لهذا النوع من المشاريع في السعودية وجهات إصدارها، وأسعار السوق الحالية للمنتجات/الخدمات المشابهة.

${styleGuide}

قواعد:
- الخطة التنفيذية: 3 مراحل واقعية (1-30، 31-60، 61-90 يوم)، كل مرحلة مهام عملية ملموسة.
- التسعير: 4 منتجات/خدمات رئيسية، لكل واحد سعر بيع وتكلفة وهامش ربح، أسعار واقعية مبنية على بحثك.
- العميل المثالي: صفه بدقة (العمر، الدخل، السلوك، أين تجده).
- التراخيص: التصاريح الفعلية الحديثة المطلوبة في السعودية مع جهة الإصدار، من بحثك.
- التميّز: 3 طرق عملية ملموسة للتميّز عن المنافسين.
- اكتب بالعربية فقط.

أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

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

    // ═══ دالة استدعاء Gemini مع البحث الحي ═══
    async function callGemini(userPrompt, attempt = 1) {
      const model = "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8000
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini Error:", response.status, errText.substring(0, 300));
        if ((response.status === 429 || response.status === 503) && attempt < 3) {
          console.log(`Retrying Gemini (attempt ${attempt + 1})...`);
          await new Promise(r => setTimeout(r, 4000 * attempt));
          return callGemini(userPrompt, attempt + 1);
        }
        if (response.status === 429) {
          throw new Error("الخدمة مزدحمة حالياً، حاول بعد دقيقة");
        }
        throw new Error("خطأ من المحلّل: " + response.status);
      }

      const data = await response.json();
      const cand = data.candidates?.[0];
      const text = cand?.content?.parts?.map(p => p.text || "").join("") || "";
      if (!text) throw new Error("لا يوجد رد من المحلّل");

      // استخراج المصادر من البحث
      const sources = [];
      const gm = cand?.groundingMetadata;
      if (gm?.groundingChunks) {
        for (const chunk of gm.groundingChunks) {
          if (chunk.web?.title) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri || "" });
          }
        }
      }

      // استخراج JSON من النص (قد يكون محاطاً بنص أو علامات markdown)
      const parsed = extractJSON(text);
      if (!parsed) {
        if (attempt < 3) {
          console.log(`JSON parse failed, retrying (attempt ${attempt + 1})...`);
          await new Promise(r => setTimeout(r, 1500));
          return callGemini(userPrompt, attempt + 1);
        }
        throw new Error("تعذّر تحليل رد المحلّل");
      }

      return { data: parsed, sources };
    }

    console.log("Calling Gemini with search (2 sequential requests)...");

    const coreCall = await callGemini(promptCore);
    await new Promise(r => setTimeout(r, 800));
    const planCall = await callGemini(promptPlan);

    // دمج النتيجتين + المصادر
    const allSources = [...coreCall.sources, ...planCall.sources];
    const uniqueSources = [];
    const seen = new Set();
    for (const s of allSources) {
      const key = s.title;
      if (!seen.has(key) && uniqueSources.length < 8) {
        seen.add(key);
        uniqueSources.push(s);
      }
    }

    const merged = { ...coreCall.data, ...planCall.data, sources: uniqueSources };
    const validated = validateFinancials(merged);

    console.log("Analysis complete, sources:", uniqueSources.length);
    return Response.json(validated);

  } catch (error) {
    console.error("Server Error:", error.message);
    return Response.json({ error: error.message || "خطأ في الخادم" }, { status: 500 });
  }
}

// ═══ استخراج JSON من نص قد يحتوي على زوائد ═══
function extractJSON(text) {
  // محاولة 1: تحليل مباشر
  try { return JSON.parse(text); } catch (e) {}

  // محاولة 2: إزالة علامات markdown
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}

  // محاولة 3: استخراج أول كتلة { ... } متوازنة
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const block = cleaned.substring(start, i + 1);
        try { return JSON.parse(block); } catch (e) { return null; }
      }
    }
  }
  return null;
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
