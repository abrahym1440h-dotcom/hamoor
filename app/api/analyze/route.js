// قاعدة بيانات السوق السعودي - بيانات حقيقية محدّثة 2025-2026

const CITIES_DATA = {
  "الرياض": {
    population: 7000000,
    purchasing_power: "عالية جداً",
    rent_per_sqm: { premium: "180-350", medium: "100-180", affordable: "50-100" },
    top_areas: ["العليا", "الملقا", "النخيل", "حطين", "الياسمين", "الورود"],
    medium_areas: ["النرجس", "الربيع", "غرناطة", "العقيق"],
    affordable_areas: ["السويدي", "الشفا", "النسيم", "العزيزية", "بدر"],
    avg_salary: { unskilled: 3500, skilled: 6500, professional: 13000 },
    market_notes: "أكبر سوق في المملكة، منافسة عالية لكن قوة شرائية ضخمة",
    growing_sectors: ["تقنية", "ترفيه", "صحة", "تعليم خاص"],
    saturated_sectors: ["كوفي شوب عام", "مطاعم برجر"]
  },
  "جدة": {
    population: 4700000,
    purchasing_power: "عالية",
    rent_per_sqm: { premium: "150-300", medium: "85-150", affordable: "45-85" },
    top_areas: ["الشاطئ", "الروضة", "الأندلس", "الزهراء", "البساتين", "الحمراء"],
    medium_areas: ["السلامة", "الفيصلية", "النعيم", "الصفا"],
    affordable_areas: ["النزهة", "الربوة", "المنار", "بريمان"],
    avg_salary: { unskilled: 3300, skilled: 6000, professional: 12000 },
    market_notes: "بوابة الحرمين، سياحة دينية وترفيهية، تنوع ديموغرافي",
    growing_sectors: ["سياحة", "ترفيه بحري", "تجارة إلكترونية", "موضة"],
    saturated_sectors: ["مطاعم بحرية", "كافيهات الشاطئ"]
  },
  "الدمام": {
    population: 1500000,
    purchasing_power: "عالية",
    rent_per_sqm: { premium: "120-220", medium: "70-120", affordable: "40-70" },
    top_areas: ["الشاطئ", "الفيصلية", "الراكة", "اليرموك"],
    medium_areas: ["الشاطئ الغربي", "النور", "البديع"],
    affordable_areas: ["العزيزية", "الفيحاء", "المريكبات"],
    avg_salary: { unskilled: 3700, skilled: 6800, professional: 14000 },
    market_notes: "موظفو أرامكو والشركات الصناعية، دخل ثابت مرتفع",
    growing_sectors: ["خدمات صناعية", "لوجستيات", "ضيافة عائلية"],
    saturated_sectors: ["مغاسل سيارات", "كوفي للموظفين"]
  },
  "مكة المكرمة": {
    population: 2400000,
    purchasing_power: "متوسطة",
    rent_per_sqm: { premium: "200-450", medium: "100-200", affordable: "50-100" },
    top_areas: ["العزيزية", "الششة", "الزاهر", "الحجون"],
    medium_areas: ["الكعكية", "النوارية", "العوالي"],
    affordable_areas: ["بطحاء قريش", "أم الجود", "الرصيفة"],
    avg_salary: { unskilled: 3000, skilled: 5500, professional: 11000 },
    market_notes: "موسمية عالية، ذروة في رمضان والحج (3 شهور)، ركود باقي السنة",
    growing_sectors: ["خدمات حجاج", "إيواء قصير", "هدايا ومنتجات دينية"],
    saturated_sectors: ["فنادق صغيرة", "وكالات حج"]
  },
  "المدينة المنورة": {
    population: 1500000,
    purchasing_power: "متوسطة",
    rent_per_sqm: { premium: "150-280", medium: "80-150", affordable: "45-80" },
    top_areas: ["العزيزية", "قباء", "السلام", "العنبرية"],
    medium_areas: ["الدفاع", "الجامعة", "الرانوناء"],
    affordable_areas: ["المطار القديم", "العاقول", "بئر عثمان"],
    avg_salary: { unskilled: 2900, skilled: 5300, professional: 10500 },
    market_notes: "سياحة دينية على مدار السنة، طابع محافظ، عائلي",
    growing_sectors: ["خدمات زائرين", "تمور وهدايا", "إيواء عائلي"],
    saturated_sectors: ["محلات تمور سياحية"]
  },
  "الخبر": {
    population: 650000,
    purchasing_power: "عالية جداً",
    rent_per_sqm: { premium: "150-280", medium: "85-150", affordable: "50-85" },
    top_areas: ["الشاطئ", "العقربية", "الراكة الشمالية", "اليرموك"],
    medium_areas: ["الجوهرة", "الحزام الذهبي", "الثقبة"],
    affordable_areas: ["السلام", "الجسر", "العزيزية"],
    avg_salary: { unskilled: 3800, skilled: 7000, professional: 14500 },
    market_notes: "مدينة صغيرة بقوة شرائية عالية، ذواق راقي، مهنيون",
    growing_sectors: ["مطاعم راقية", "ترفيه عائلي", "خدمات احترافية"],
    saturated_sectors: ["كوفي الكورنيش"]
  },
  "أبها": {
    population: 500000,
    purchasing_power: "متوسطة",
    rent_per_sqm: { premium: "80-150", medium: "50-80", affordable: "30-50" },
    top_areas: ["الموظفين", "السودة", "الورود", "المروج"],
    medium_areas: ["الخشع", "المنسك", "الربوة"],
    affordable_areas: ["النصب", "الواديين", "الفرعاء"],
    avg_salary: { unskilled: 2700, skilled: 4800, professional: 9000 },
    market_notes: "موسمية سياحية صيفية قوية، فرص نمو مع رؤية 2030",
    growing_sectors: ["سياحة جبلية", "ضيافة بيئية", "أنشطة مغامرة"],
    saturated_sectors: ["كافيهات إطلالة"]
  },
  "تبوك": {
    population: 600000,
    purchasing_power: "متوسطة-عالية",
    rent_per_sqm: { premium: "70-140", medium: "45-70", affordable: "25-45" },
    top_areas: ["الأخضر", "السلام", "المنشية"],
    medium_areas: ["الفيصلية", "العزيزية"],
    affordable_areas: ["المروج", "النسيم"],
    avg_salary: { unskilled: 3000, skilled: 5000, professional: 9500 },
    market_notes: "نمو سريع بسبب نيوم، فرص استثنائية، سوق ناشئ",
    growing_sectors: ["لوجستيات نيوم", "خدمات عمالة", "إسكان عمال"],
    saturated_sectors: []
  },
  "القصيم": {
    population: 1500000,
    purchasing_power: "متوسطة",
    rent_per_sqm: { premium: "80-150", medium: "50-80", affordable: "30-50" },
    top_areas: ["النخيل", "الصفراء", "الورود"],
    medium_areas: ["الفايزية", "الإسكان"],
    affordable_areas: ["الرس", "البدائع"],
    avg_salary: { unskilled: 2800, skilled: 4700, professional: 9000 },
    market_notes: "طابع محافظ، قوة زراعية وتجارة جملة، ولاء للمحلات المعروفة",
    growing_sectors: ["تمور ومنتجات زراعية", "أعراس وضيافة", "تجزئة عائلية"],
    saturated_sectors: ["محلات تمور تقليدية"]
  },
  "نجران": {
    population: 380000,
    purchasing_power: "متوسطة",
    rent_per_sqm: { premium: "60-120", medium: "35-60", affordable: "20-35" },
    top_areas: ["السد", "الفيصلية", "نجران الجديدة"],
    medium_areas: ["الفهد", "العزيزية"],
    affordable_areas: ["الصناعية", "الأخدود"],
    avg_salary: { unskilled: 2600, skilled: 4400, professional: 8500 },
    market_notes: "سوق صغير محافظ، فرص محدودة لكن منافسة قليلة",
    growing_sectors: ["خدمات حدودية", "زراعة محلية"],
    saturated_sectors: []
  }
};

const SECTOR_INSIGHTS = {
  "مقاهي": {
    avg_monthly_revenue: "30000-120000",
    profit_margin: "15-25%",
    failure_rate_2yrs: "60%",
    setup_cost_range: "150000-400000",
    main_costs: "إيجار (25%), مواد خام (28%), رواتب (22%), تشغيل (15%)",
    success_factors: "موقع استراتيجي، تميز في القهوة، تجربة عميل، تسويق سوشيال",
    failure_reasons: "إشباع السوق، ضعف التمييز، موقع خاطئ، تكاليف عالية",
    competitors_examples: "ستاربكس، دنكن، % عربيكا، كوفي بين، مذاق",
    avg_ticket_size: "25-45 ريال"
  },
  "مطاعم": {
    avg_monthly_revenue: "60000-300000",
    profit_margin: "10-18%",
    failure_rate_2yrs: "70%",
    setup_cost_range: "200000-800000",
    main_costs: "مواد خام (35%), رواتب (25%), إيجار (15%), تشغيل (15%)",
    success_factors: "تخصص واضح، جودة ثابتة، خدمة توصيل، تسعير منافس",
    failure_reasons: "قائمة طعام كبيرة، هدر مواد، ضعف الإدارة، منافسة شرسة",
    competitors_examples: "البيك، كودو، ماكدونالدز، هرفي، تكا",
    avg_ticket_size: "40-90 ريال"
  },
  "حلويات": {
    avg_monthly_revenue: "40000-180000",
    profit_margin: "20-35%",
    failure_rate_2yrs: "45%",
    setup_cost_range: "120000-500000",
    main_costs: "مواد خام (30%), رواتب (20%), إيجار (20%), تغليف (10%)",
    success_factors: "منتج مميز، تصوير احترافي، توصيل سريع، مناسبات",
    failure_reasons: "تقليد المنافسين، ضعف التغليف، عدم الاتساق",
    competitors_examples: "صابا، عبد الصمد القرشي، ميلانو، الإمبراطور",
    avg_ticket_size: "50-200 ريال"
  },
  "عبايات": {
    avg_monthly_revenue: "35000-200000",
    profit_margin: "25-40%",
    failure_rate_2yrs: "40%",
    setup_cost_range: "80000-300000",
    main_costs: "بضاعة (40%), إيجار (20%), رواتب (15%), تسويق (10%)",
    success_factors: "تصاميم حصرية، خياطة فاخرة، عملاء VIP، إنستقرام قوي",
    failure_reasons: "تشابه التصاميم، تسعير ضعيف، موقع غير ملائم",
    competitors_examples: "عبايات حلا الترك، مزون، نهى، أنوار",
    avg_ticket_size: "200-2000 ريال"
  },
  "خياط": {
    avg_monthly_revenue: "20000-80000",
    profit_margin: "30-50%",
    failure_rate_2yrs: "30%",
    setup_cost_range: "40000-150000",
    main_costs: "إيجار (25%), رواتب الخياطين (35%), أقمشة (15%)",
    success_factors: "خياطة عالية الجودة، الالتزام بالمواعيد، تخصص (رجالي/نسائي)",
    failure_reasons: "تأخر التسليم، ضعف الجودة، عدم وجود خياطين مهرة",
    competitors_examples: "محلات خياطة محلية في كل حي",
    avg_ticket_size: "150-800 ريال"
  },
  "صالون": {
    avg_monthly_revenue: "30000-150000",
    profit_margin: "25-40%",
    failure_rate_2yrs: "50%",
    setup_cost_range: "100000-400000",
    main_costs: "رواتب (35%), إيجار (20%), مواد (15%), تجهيزات (10%)",
    success_factors: "مصففين موهوبين، حجز إلكتروني، تجربة فاخرة، مناسبات",
    failure_reasons: "دوران الموظفين، عدم النظافة، تسعير غير واضح",
    competitors_examples: "صالونات محلية، روزا، إكسير، توني آند جاي",
    avg_ticket_size: "80-500 ريال"
  },
  "تجزئة": {
    avg_monthly_revenue: "40000-250000",
    profit_margin: "15-30%",
    failure_rate_2yrs: "55%",
    setup_cost_range: "100000-500000",
    main_costs: "بضاعة (50%), إيجار (15%), رواتب (12%), تسويق (8%)",
    success_factors: "تنوع منتجات، موقع ممتاز، إدارة مخزون، أسعار منافسة",
    failure_reasons: "بضاعة راكدة، منافسة التجارة الإلكترونية، موقع ضعيف",
    competitors_examples: "حسب القطاع: نون، أمازون، إكسترا، ساكو، جرير",
    avg_ticket_size: "حسب المنتج"
  },
  "إلكترونيات": {
    avg_monthly_revenue: "80000-400000",
    profit_margin: "8-18%",
    failure_rate_2yrs: "50%",
    setup_cost_range: "200000-1000000",
    main_costs: "بضاعة (65%), إيجار (10%), رواتب (10%), ضمان (5%)",
    success_factors: "أسعار منافسة، ضمان موثوق، خدمة ما بعد البيع، تشكيلة",
    failure_reasons: "هامش ربح ضعيف، منافسة أونلاين، التزييف",
    competitors_examples: "إكسترا، جرير، نون، أمازون، السيف غاليري",
    avg_ticket_size: "200-5000 ريال"
  },
  "كوفي": {
    avg_monthly_revenue: "30000-120000",
    profit_margin: "15-25%",
    failure_rate_2yrs: "60%",
    setup_cost_range: "150000-400000",
    main_costs: "إيجار (25%), مواد خام (28%), رواتب (22%), تشغيل (15%)",
    success_factors: "موقع استراتيجي، تميز في القهوة، تجربة عميل، تسويق سوشيال",
    failure_reasons: "إشباع السوق، ضعف التمييز، موقع خاطئ، تكاليف عالية",
    competitors_examples: "ستاربكس، دنكن، % عربيكا، كوفي بين، مذاق، بريد",
    avg_ticket_size: "25-45 ريال"
  },
  "شاورما": {
    avg_monthly_revenue: "40000-150000",
    profit_margin: "20-30%",
    failure_rate_2yrs: "55%",
    setup_cost_range: "100000-300000",
    main_costs: "مواد خام (38%), رواتب (22%), إيجار (15%), تشغيل (12%)",
    success_factors: "جودة اللحم، خبز طازج، توصيل سريع، موقع مزدحم",
    failure_reasons: "تقلب جودة اللحم، ضعف النظافة، منافسة شرسة",
    competitors_examples: "أبو نواس، الطازج، شاورما حضرموت، عثمانلي",
    avg_ticket_size: "20-50 ريال"
  }
};

function detectSector(idea) {
  const text = idea.toLowerCase();
  if (text.match(/كوفي|قهوة|كافيه|coffee/)) return SECTOR_INSIGHTS["كوفي"];
  if (text.match(/مطعم|برجر|بيتزا|دجاج|مأكولات|أكل/)) return SECTOR_INSIGHTS["مطاعم"];
  if (text.match(/شاورما|كباب|مشاوي/)) return SECTOR_INSIGHTS["شاورما"];
  if (text.match(/حلويات|كيك|تشيز|دونات|بقلاوة/)) return SECTOR_INSIGHTS["حلويات"];
  if (text.match(/عباية|عبايات|فستان/)) return SECTOR_INSIGHTS["عبايات"];
  if (text.match(/خياط|تفصيل|خياطة/)) return SECTOR_INSIGHTS["خياط"];
  if (text.match(/صالون|كوافير|تجميل|باربر/)) return SECTOR_INSIGHTS["صالون"];
  if (text.match(/إلكترون|جوال|كمبيوتر|لابتوب|أجهزة/)) return SECTOR_INSIGHTS["إلكترونيات"];
  return SECTOR_INSIGHTS["تجزئة"];
}

export async function POST(request) {
  try {
    const { idea, city, budget } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const cityData = CITIES_DATA[city] || CITIES_DATA["الرياض"];
    const sectorData = detectSector(idea);
    const budgetNum = parseInt(budget) || 100000;

    const prompt = `أنت محلل استثماري سعودي خبير بمستوى استشاري McKinsey، متخصص في تحليل المشاريع الصغيرة والمتوسطة في السوق السعودي. لديك بيانات حقيقية ودقيقة لعام 2025-2026.

═══════ بيانات حقيقية عن مدينة ${city} ═══════
• عدد السكان: ${cityData.population.toLocaleString()}
• القوة الشرائية: ${cityData.purchasing_power}
• إيجار المتر للمحلات الراقية: ${cityData.rent_per_sqm.premium} ريال
• إيجار المتر للمحلات المتوسطة: ${cityData.rent_per_sqm.medium} ريال
• إيجار المتر للمحلات الاقتصادية: ${cityData.rent_per_sqm.affordable} ريال
• الأحياء الراقية: ${cityData.top_areas.join("، ")}
• الأحياء المتوسطة: ${cityData.medium_areas.join("، ")}
• الأحياء الاقتصادية: ${cityData.affordable_areas.join("، ")}
• راتب عامل غير ماهر: ${cityData.avg_salary.unskilled} ريال
• راتب موظف ماهر: ${cityData.avg_salary.skilled} ريال
• راتب مهني محترف: ${cityData.avg_salary.professional} ريال
• ملاحظات السوق: ${cityData.market_notes}
• قطاعات نامية: ${cityData.growing_sectors.join("، ")}
• قطاعات مشبعة: ${cityData.saturated_sectors.join("، ") || "لا يوجد"}

═══════ بيانات حقيقية عن قطاع المشروع ═══════
• متوسط الإيرادات الشهرية: ${sectorData.avg_monthly_revenue} ريال
• هامش الربح الفعلي: ${sectorData.profit_margin}
• معدل الفشل خلال أول سنتين: ${sectorData.failure_rate_2yrs}
• تكلفة التأسيس النموذجية: ${sectorData.setup_cost_range} ريال
• توزيع التكاليف الشهرية: ${sectorData.main_costs}
• عوامل النجاح الحقيقية: ${sectorData.success_factors}
• أسباب الفشل الشائعة: ${sectorData.failure_reasons}
• المنافسون الرئيسيون: ${sectorData.competitors_examples}
• متوسط قيمة الفاتورة: ${sectorData.avg_ticket_size}

═══════ المشروع المطلوب تحليله ═══════
• الفكرة: ${idea}
• المدينة: ${city}
• الميزانية: ${budgetNum.toLocaleString()} ريال

═══════ تعليمات التحليل (مهمة جداً) ═══════
1. كن واقعياً وصارماً، لا تجامل
2. إذا الميزانية أقل من الحد الأدنى للتأسيس → score: 25-45, decision_type: "negative"
3. إذا القطاع مشبع في المدينة → خفض الـ score بـ 15-20 نقطة
4. استخدم الأرقام الحقيقية أعلاه في حساب التكاليف
5. اقترح حياً حقيقياً من قائمة أحياء ${city}
6. اذكر منافساً حقيقياً من المنافسين أعلاه
7. في best_location اقترح حي من top_areas أو medium_areas
8. في worst_location اقترح حي بعيد عن السوق المستهدف
9. التكاليف يجب أن تتطابق مع أرقام المدينة الحقيقية
10. الإيرادات يجب أن تكون في النطاق المذكور للقطاع

═══════ صيغة الرد (JSON فقط، لا نص قبله ولا بعده) ═══════
{"score":NUMBER_0_to_100,"decision":"قرار قصير واضح","decision_type":"positive_OR_negative","market_demand":"مرتفع|متوسط|منخفض","competition":"عالية|متوسطة|منخفضة","cost_level":"منخفض|متوسط|مرتفع","risk_level":"منخفض|متوسط|مرتفع","summary":"ملخص في جملتين واضحتين","market_insight":"تحليل السوق في 2-3 جمل واقعية بأرقام","financial_insight":"تحليل مالي بأرقام محددة من الميزانية","risk_insight":"تحليل المخاطر بناءً على معدل الفشل المذكور","best_location":{"name":"حي محدد من ${city}","score":NUMBER},"worst_location":{"name":"حي بعيد من ${city}","score":NUMBER},"costs":{"rent":NUMBER_بالريال,"operations":NUMBER,"salaries":NUMBER,"total":NUMBER},"risks":["خطر محدد 1","خطر محدد 2","خطر محدد 3"],"alternative_idea":"فكرة بديلة مدروسة","alternative_city":"مدينة بديلة منطقية","monthly_data":[6_أرقام_توقع_مبيعات],"strengths":["قوة محددة 1","قوة محددة 2","قوة محددة 3"]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 8192,
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
    let cleanText = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "لم يرجع JSON صحيح" }, { status: 500 });
    }

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
