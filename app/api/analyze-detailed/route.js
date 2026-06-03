import { SALARIES, LICENSES, detectSector, getCityBrief, getSectorBrief, getFinancialBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

function numWithCommas(n){
  const s = String(Math.round(Number(n)||0));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export async function POST(req) {
  try {
    const { idea, sector: userSector, city, budget, detailed } = await req.json();
    console.log("Detailed Request:", { idea, userSector, city, budget });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    // التحليل التفصيلي يعتمد Gemini فقط (اختيار المستخدم)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح التحليل التفصيلي غير مهيّأ - تأكد من GEMINI_API_KEY" }, { status: 500 });
    }

    // ═══ ميزانية وقت عامة تحت حد Vercel (60 ثانية) ═══
    const DEADLINE_MS = 54000;
    const _startTime = Date.now();
    const remaining = () => DEADLINE_MS - (Date.now() - _startTime);

    const budgetNum = parseInt(budget);
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;

    const sector = userSector ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);

    // ═══ المعلومات التفصيلية التي أدخلها المستخدم (هي مصدر الحقيقة) ═══
    const d = detailed || {};
    const userLines = [];
    if (d.area) userLines.push(`مساحة المحل: ${d.area} متر مربع`);
    if (d.actual_rent) userLines.push(`الإيجار السنوي الفعلي (أكّده المستخدم): ${numWithCommas(parseInt(d.actual_rent))} ريال — استخدمه كما هو`);
    if (d.staff_count) userLines.push(`عدد الموظفين المتوقع: ${d.staff_count}`);
    if (d.shop_state) userLines.push(`حالة المحل: ${d.shop_state}`);
    if (d.experience) userLines.push(`خبرة صاحب المشروع: ${d.experience}`);
    if (d.setup_estimate) userLines.push(`تقدير صاحب المشروع لتكلفة التأسيس الإجمالية: ${numWithCommas(parseInt(d.setup_estimate))} ريال — اعتمده كمرجع أساسي ووزّعه على البنود`);
    if (d.monthly_estimate) userLines.push(`تقدير صاحب المشروع للتكاليف الشهرية الإجمالية: ${numWithCommas(parseInt(d.monthly_estimate))} ريال — اعتمده كمرجع أساسي ووزّعه على البنود`);
    if (d.avg_ticket) userLines.push(`متوسط سعر المنتج/الخدمة (متوسط الفاتورة): ${numWithCommas(parseInt(d.avg_ticket))} ريال — استخدمه في حساب الإيرادات`);
    if (d.customers_per_day) userLines.push(`عدد العملاء المتوقع يومياً (تقدير صاحب المشروع): ${d.customers_per_day} — استخدمه كأساس للإيراد المستقر مع تطبيق التدرّج الواقعي للسنة الأولى`);
    if (d.main_products) userLines.push(`أبرز المنتجات/الخدمات وأسعارها كما حدّدها صاحب المشروع: ${d.main_products}`);
    if (d.known_competitors) userLines.push(`المنافسون الفعليون في المنطقة كما يعرفهم صاحب المشروع (استخدم هذه الأسماء في تحليل المنافسين): ${d.known_competitors}`);
    if (d.differentiation) userLines.push(`ما يميّز المشروع عن المنافسين كما يراه صاحبه: ${d.differentiation}`);
    if (d.target_audience) userLines.push(`الجمهور المستهدف كما يصفه صاحب المشروع: ${d.target_audience}`);
    if (d.marketing_channels) userLines.push(`قنوات التسويق المخطّط لها: ${d.marketing_channels}`);
    if (d.extra_notes) userLines.push(`ملاحظات إضافية من صاحب المشروع: ${d.extra_notes}`);

    const userDetailBlock = userLines.length
      ? "\n\n═══════ معلومات تفصيلية أدخلها صاحب المشروع (مصدر الحقيقة) ═══════\n" +
        userLines.map(l => "• " + l).join("\n") +
        "\n══════════════════════════════════════\n"
      : "";

    // ═══ معطيات المشروع المشتركة ═══
    const projectContext = `المشروع: ${idea}
القطاع: ${sector}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${numWithCommas(budgetNum)} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب التقريبية (محدّثة لـ 2026): موظف سعودي ${SALARIES.emp_saudi}؛ مهن التسويق والمبيعات السعودية: ${SALARIES.emp_marketing_saudi}؛ مهن هندسية سعودية: ${SALARIES.eng_saudi}؛ تقني/مبرمج سعودي: ${SALARIES.emp_tech_saudi}؛ خبرة عربية ${SALARIES.exp_arab}؛ عمالة آسيوية ${SALARIES.worker_asian}
التراخيص والرسوم الحكومية: ${LICENSES.commercial_register}؛ ${LICENSES.municipal_license}؛ ${LICENSES.chamber_of_commerce}؛ ${LICENSES.ecommerce_note}${userDetailBlock}`;

    // ═══ تعليمات الأسلوب ═══
    const styleGuide = `أسلوب الكتابة: اكتب كأنك مستشار خبير تجلس مع صاحب المشروع وتنصحه بصدق. لغة عربية طبيعية وإنسانية، خاطبه مباشرة ("مشروعك"، "ميزانيتك"، "أنصحك"). تجنّب العبارات الآلية. اشرح "لماذا" وراء كل رقم. لا مجاملة - كن صادقاً وواقعياً.`;

    // ═══ محرّك التكييف الذكي حسب نوع المشروع ═══
    const adaptEngine = `التكييف الذكي: حدّد طبيعة المشروع أولاً (موقع فيزيائي، خدمة، رقمي/أونلاين، منتج، فكرة ابتكارية) وكيّف التحليل:
- مشروع رقمي بلا موقع: لا إيجار ولا ديكور؛ استخدم تكاليف تطوير واستضافة وتراخيص رقمية. البنود غير المنطبقة = 0.
- خدمة: احسب بالعملاء الشهريين أو عدد العقود، ومتوسط الفاتورة قد يكون قيمة عقد أو اشتراك.
- مشروع منزلي/صغير: قلّل التكاليف، لا تفرض تكاليف محل كامل.
- فكرة ابتكارية: حلّلها بمنطقها الخاص، اذكر الفرصة والغموض بصراحة.
البنود غير المنطبقة = 0 مع شرح في الملاحظات.`;

    // ═══ تعليمات التحليل التفصيلي (لا بحث - اعتماد على بيانات المستخدم) ═══
    const detailedInstructions = `هذا تحليل تفصيلي: صاحب المشروع زوّدك بمعلومات تفصيلية دقيقة عن مشروعه. مهمتك التحليل العميق لهذه المعلومات، وليس البحث عنها.
قواعد صارمة:
- كل رقم أو اسم أو معلومة قدّمها صاحب المشروع = حقيقة مؤكّدة، استخدمها كما هي ولا تغيّرها ولا تتجاهلها.
- لا تخترع منافسين أو أرقاماً تخالف ما قدّمه. لو أعطاك أسماء منافسين، استخدمها. لو أعطاك متوسط فاتورة أو عدد عملاء، ابنِ الإيرادات عليها.
- ما لم يقدّمه صاحب المشروع: قدّره بدقة اعتماداً على معرفتك العميقة بالسوق السعودي ومعطيات القطاع والمدينة أعلاه، واذكر بوضوح أنه تقدير منك.
- لا تقل "حسب البحث" — هذا تحليل لمعطيات معطاة، لا بحث.`;

    const baseRules = `لغة: عربية فصحى فقط، ممنوع أي حرف من لغة أخرى. أرقام عادية.

قواعد الدقة:
- أرقام واقعية معدّلة حسب حجم المدينة والحي والمعلومات التفصيلية. المجاميع تتطابق (مجموع البنود = الإجمالي).
- ميزانية أقل من الحد الأدنى للتأسيس = score تحت 35 + توضيح كم ينقص.
- المنافسون: استخدم الأسماء التي قدّمها صاحب المشروع أولاً. لو لم يقدّم، اذكر شركات وسلاسل سعودية حقيقية. ممنوع أسماء وهمية أو أوصاف عامة. حلّل قوة وثغرة كل واحد.
- نقطة التعادل = إجمالي التأسيس ÷ (الإيراد عند الاستقرار - التكلفة الشهرية). ROI = (صافي الربح السنوي ÷ رأس المال) × 100.
- اتساق مالي صارم: لو الميزانية ≥ إجمالي التأسيس فهي كافية. لا تقل "غير كافية" إلا لو فعلاً أقل.
- الميزانية الفائضة عامل قوة: لو ميزانية صاحب المشروع تتجاوز إجمالي التأسيس بنسبة كبيرة (50%+ فائض)، اعتبر ذلك عامل قوة يرفع النقاط لأنه يعطي مرونة مالية. مشروع بميزانية تعادل ضعف التأسيس مع فكرة منطقية وسوق نشط يستحق 70-85 نقطة.
- واقعية الإيرادات والربح (قاعدة صارمة): مشروع جديد لا يحقق إيرادات قصوى من السنة الأولى. التدرّج الواقعي: شهر 1 = 20-30٪، شهر 3 = 40-50٪، شهر 6 = 60-75٪، شهر 12 = 85-100٪ من الإيراد المستقر. ROI صحي للسنة الأولى عادة 15-50٪؛ فوق 100٪ مشكوك فيه؛ فوق 200٪ خطأ شبه مؤكد راجع الافتراضات.
- لا تبالغ في الربح: لازم يكون منطقياً مع نقطة التعادل.
- KPIs: مؤشرات تشغيلية واقعية قابلة للقياس. ممنوع نسب مزيّفة.
- equipment_breakdown: 3-5 بنود فرعية لـ"المعدات والأثاث" تناسب المشروع، مجموعها = قيمة equipment.
- الأحياء حقيقية من ${cityName}.
- تحليل المواقع: إذا كان المشروع لا يحتاج موقعاً فيزيائياً، اضبط is_physical_location = false واترك locations فارغة.`;

    // ═══ البرومبت الأول: التحليل الأساسي ═══
    const promptCore = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. أمامك دراسة جدوى تفصيلية لمشروع، زوّدك صاحبه بمعلومات دقيقة. حلّلها بصرامة وواقعية تامة.

${projectContext}

${detailedInstructions}

${styleGuide}

${adaptEngine}

${baseRules}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

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
    "market_size": "<حجم السوق لـ ${cityName} بأرقام وتقدير قيمته>",
    "target_audience": "<وصف تفصيلي للجمهور: من هم، أعمارهم، دخلهم، سلوكهم>",
    "buying_patterns": "<أنماط الشراء: متى يشترون، كم مرة، كم ينفقون>",
    "seasonality": "<الموسمية: أشهر الذروة وأشهر الركود ولماذا>",
    "expected_market_share": "<النسبة الواقعية مع تبرير>",
    "growth_potential": "<النمو على 5 سنوات مع تبرير>",
    "demand_drivers": ["<عامل يرفع الطلب>", "<عامل آخر>", "<عامل ثالث>"],
    "market_gaps": ["<فجوة في السوق تقدر تستغلها>", "<فجوة أخرى>"],
    "competitors": [
      {"name": "<اسم منافس حقيقي>", "market_position": "<رائدة/قوية/متوسطة>", "strength": "<أبرز قوة محددة>", "weakness": "<ثغرة محددة تقدر تستغلها>", "price_range": "<فئة أسعارها>"},
      {"name": "<اسم منافس حقيقي ثانٍ>", "market_position": "<موقعها>", "strength": "<قوة محددة>", "weakness": "<ثغرة محددة>", "price_range": "<فئة الأسعار>"},
      {"name": "<اسم منافس حقيقي ثالث>", "market_position": "<موقعها>", "strength": "<قوة محددة>", "weakness": "<ثغرة محددة>", "price_range": "<فئة الأسعار>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {"rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0, "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0},
    "setup_costs_notes": "<شرح من سطرين: ما أكبر بند ولماذا، وأين يمكن توفير التكاليف>",
    "equipment_breakdown": [
      {"item": "<بند فرعي من المعدات والأثاث مناسب لهذا المشروع>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0}
    ],
    "monthly_costs": {"rent": 0, "salaries": 0, "utilities": 0, "materials": 0, "marketing": 0, "maintenance": 0, "other": 0, "total": 0},
    "monthly_costs_notes": "<شرح من سطرين: أثقل بند شهري وكيف تتحكم فيه>",
    "salary_breakdown": [
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>},
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>}
    ],
    "revenue_projection": {"month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0, "year_2_monthly": 0, "year_3_monthly": 0},
    "revenue_notes": "<شرح من سطرين: كيف ينمو الدخل ولماذا، وما الافتراض الأساسي>",
    "break_even_months": 0,
    "roi_percentage": 0,
    "annual_profit_year1": 0,
    "annual_profit_year3": 0,
    "daily_target": {"customers_per_day": <عدد العملاء المطلوب يومياً للربح>, "average_ticket": <متوسط فاتورة العميل>}
  },
  "swot": {
    "strengths": ["<قوة 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": [
    {"title": "<عنوان التوصية>", "detail": "<شرح عملي من سطرين>", "priority": "<عالية/متوسطة>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"}
  ],
  "kpis": [
    {"name": "<مؤشر تشغيلي قابل للقياس>", "target": "<قيمة رقمية واقعية>", "description": "<لماذا مهم وكيف يُقاس>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"}
  ],
  "risk_analysis": [
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"}
  ],
  "is_physical_location": <true إذا يحتاج موقع فيزيائي | false إذا أونلاين أو خدمة عن بُعد>,
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  }
}`;

    // ═══ البرومبت الثاني: الخطة والتفاصيل ═══
    const promptPlan = `أنت خبير استثماري سعودي تكمل دراسة جدوى تفصيلية لهذا المشروع. ركّز على الخطة التنفيذية والتفاصيل العملية، معتمداً على المعلومات التفصيلية التي قدّمها صاحب المشروع.

${projectContext}

${detailedInstructions}

اعتمد على معرفتك بالتراخيص والتصاريح المطلوبة لهذا النوع من المشاريع في السعودية وجهات إصدارها، وأسعار السوق للمنتجات والخدمات المشابهة.

${styleGuide}

${adaptEngine}

قواعد:
- الخطة التنفيذية: 3 مراحل واقعية (1-30، 31-60، 61-90 يوم)، كل مرحلة مهام عملية ملموسة.
- التسعير: 4 منتجات/خدمات رئيسية. لو حدّد صاحب المشروع منتجاته وأسعارها فاستخدمها، وإلا قدّرها واقعياً. لكل واحد سعر بيع وتكلفة وهامش ربح.
- العميل المثالي: صفه بدقة (العمر، الدخل، السلوك، أين تجده) معتمداً على وصف صاحب المشروع للجمهور إن وُجد.
- التراخيص: التصاريح الفعلية الحديثة المطلوبة في السعودية مع جهة الإصدار.
- التميّز: 3 طرق عملية ملموسة للتميّز، مبنية على ما يميّز المشروع كما ذكره صاحبه إن وُجد.
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

    // ═══ دالة استدعاء Gemini ═══
    async function callGemini(userPrompt) {
      const model = "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const ms = Math.max(1000, Math.min(24000, remaining() - 1000));
      const timer = setTimeout(() => ctrl.abort(), ms);
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 6000, responseMimeType: "application/json" }
          }),
          signal: ctrl.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini Error:", response.status, errText.substring(0, 200));
        throw new Error("GEMINI_FAIL_" + response.status);
      }
      const data = await response.json();
      const cand = data.candidates?.[0];
      const text = cand?.content?.parts?.map(p => p.text || "").join("") || "";
      if (!text) throw new Error("GEMINI_FAIL_EMPTY");
      const parsed = extractJSON(text);
      if (!parsed) throw new Error("GEMINI_FAIL_PARSE");
      return parsed;
    }

    console.log("═══ بدء التحليل التفصيلي (Gemini) ═══");

    const [coreData, planData] = await Promise.all([
      callGemini(promptCore),
      callGemini(promptPlan)
    ]);

    const merged = { ...coreData, ...planData };
    merged._budget = budgetNum;
    const validated = validateFinancials(merged);
    delete validated._budget;
    validated.analysis_type = "detailed";

    console.log("Detailed analysis complete");
    return Response.json(validated);

  } catch (error) {
    console.error("Detailed Server Error:", error.message);
    let userMsg = "حدث خطأ في التحليل التفصيلي، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("FAIL_PARSE")) {
      userMsg = "تعذّر تحليل المشروع - حاول مرة أخرى بعد لحظات";
    } else if (msg.includes("FAIL_EMPTY")) {
      userMsg = "لم يصل رد كامل من المحلّل - حاول مرة أخرى";
    } else if (msg.includes("aborted") || msg.includes("timeout")) {
      userMsg = "التحليل أخذ وقتاً أطول من المتوقع - حاول مرة أخرى";
    } else if (msg.includes("429") || msg.includes("rate")) {
      userMsg = "الخدمة مزدحمة الآن - حاول بعد دقيقة";
    }
    return Response.json({ error: userMsg, debug: msg }, { status: 500 });
  }
}

// ═══ استخراج JSON من نص قد يحتوي على زوائد ═══
function extractJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}
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

// ═══ طبقة التحقق الرياضي — تفرض تطابق كل الأرقام (نفس منطق التحليل السريع) ═══
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      sc.total = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                 (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                 (sc.working_capital||0);
    }

    if (Array.isArray(result.equipment_breakdown) && result.equipment_breakdown.length && fa.setup_costs) {
      const breakdownSum = result.equipment_breakdown.reduce((s, x) => s + (x.cost || 0), 0);
      const equipmentValue = fa.setup_costs.equipment || 0;
      if (breakdownSum > 0 && equipmentValue > 0 && breakdownSum !== equipmentValue) {
        const ratio = equipmentValue / breakdownSum;
        result.equipment_breakdown.forEach(x => { x.cost = Math.round((x.cost || 0) * ratio); });
      }
    }

    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      mc.total = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                 (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                 (mc.other||0);
    }

    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rp = fa.revenue_projection || {};
    const rev1 = rp.month_1 || 0, rev3 = rp.month_3 || 0;
    const rev6 = rp.month_6 || 0, rev12 = rp.month_12 || 0;
    const rev24 = rp.year_2_monthly || rev12;
    const rev36 = rp.year_3_monthly || rev24;

    if (monthlyTotal > 0) {
      const avgRevY1 = (rev1*2 + rev3*3 + rev6*3 + rev12*4) / 12;
      fa.annual_profit_year1 = Math.round((avgRevY1 - monthlyTotal) * 12);
      const avgRevY3 = (rev24 + rev36) / 2;
      fa.annual_profit_year3 = Math.round((avgRevY3 - monthlyTotal) * 12);

      const stableMonthlyProfit = rev12 - monthlyTotal;
      if (stableMonthlyProfit > 0 && setupTotal > 0) {
        let be = Math.ceil(setupTotal / stableMonthlyProfit);
        if (be < 1) be = 1;
        if (be > 120) be = 120;
        fa.break_even_months = be;
        if (result.break_even_detail) result.break_even_detail.months = be;
      } else {
        fa.break_even_months = 0;
        if (result.break_even_detail) result.break_even_detail.months = 0;
      }

      if (setupTotal > 0) {
        fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
        if (fa.roi_percentage > 150 && rev12 > 0) {
          const expectedAvgRatio = avgRevY1 / rev12;
          if (expectedAvgRatio > 0.75) {
            const newRev1 = Math.round(rev12 * 0.25);
            const newRev3 = Math.round(rev12 * 0.45);
            const newRev6 = Math.round(rev12 * 0.70);
            rp.month_1 = newRev1;
            rp.month_3 = newRev3;
            rp.month_6 = newRev6;
            const newAvgY1 = (newRev1*2 + newRev3*3 + newRev6*3 + rev12*4) / 12;
            fa.annual_profit_year1 = Math.round((newAvgY1 - monthlyTotal) * 12);
            fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
          }
        }
      }
    }

    const budget = result._budget || 0;
    if (budget > 0 && setupTotal > 0) {
      const enough = budget >= setupTotal;
      const claimsInsufficient = (txt) => txt && (
        txt.includes("لا تكفي") || txt.includes("غير كافية") ||
        txt.includes("لا تغطي") || txt.includes("أقل من") ||
        txt.includes("إضافية") || txt.includes("عجز") || txt.includes("ينقص")
      );

      if (enough) {
        const surplus = budget - setupTotal;
        const wrongDecision = claimsInsufficient(result.decision);
        const wrongSummary = claimsInsufficient(result.summary);

        if (wrongDecision) {
          result.decision = "ميزانيتك كافية لتأسيس المشروع";
          if (result.decision_type === "negative") result.decision_type = "positive";
        }
        if (wrongSummary || wrongDecision) {
          result.summary = "ميزانيتك البالغة " + numWithCommas(budget) +
            " ريال تكفي لتغطية تكلفة التأسيس المقدّرة بـ " + numWithCommas(setupTotal) +
            " ريال، مع فائض قدره " + numWithCommas(surplus) +
            " ريال يمكن استخدامه كرأس مال احتياطي يقوّي وضع مشروعك.";
        }
        const surplusRatio = surplus / setupTotal;
        const currentScore = result.score || 50;
        let scoreBonus = 0;
        if (surplusRatio >= 1.5) scoreBonus = 20;
        else if (surplusRatio >= 1.0) scoreBonus = 15;
        else if (surplusRatio >= 0.5) scoreBonus = 10;
        else if (surplusRatio >= 0.25) scoreBonus = 6;
        else if (surplusRatio > 0) scoreBonus = 3;

        const newScore = Math.min(90, currentScore + scoreBonus);
        if (newScore > currentScore) result.score = newScore;
      } else {
        const shortage = setupTotal - budget;
        result.summary = "ميزانيتك البالغة " + numWithCommas(budget) +
          " ريال لا تكفي لتغطية تكلفة التأسيس المقدّرة بـ " + numWithCommas(setupTotal) +
          " ريال؛ تحتاج إلى " + numWithCommas(shortage) +
          " ريال إضافية. " + (result.summary || "");
      }
    }

    return result;
  } catch (e) {
    console.error("Validation error:", e.message);
    return result;
  }
}
