const CITIES_DATA = {
  "الرياض": { population: 7000000, purchasing_power: "عالية جداً", rent_per_sqm: { premium: "180-350", medium: "100-180", affordable: "50-100" }, top_areas: ["العليا", "الملقا", "النخيل", "حطين", "الياسمين"], medium_areas: ["النرجس", "الربيع", "غرناطة", "العقيق"], affordable_areas: ["السويدي", "النسيم", "العزيزية"], avg_salary: { unskilled: 3500, skilled: 6500, professional: 13000 }, market_notes: "أكبر سوق سعودي، قوة شرائية ضخمة لكن منافسة شرسة", growing_sectors: ["تقنية", "ترفيه", "صحة", "تعليم خاص"], saturated_sectors: ["كوفي عام", "مطاعم برجر"] },
  "جدة": { population: 4700000, purchasing_power: "عالية", rent_per_sqm: { premium: "150-300", medium: "85-150", affordable: "45-85" }, top_areas: ["الشاطئ", "الروضة", "الأندلس", "الزهراء", "الحمراء"], medium_areas: ["السلامة", "الفيصلية", "النعيم", "الصفا"], affordable_areas: ["النزهة", "الربوة", "بريمان"], avg_salary: { unskilled: 3300, skilled: 6000, professional: 12000 }, market_notes: "بوابة الحرمين، سياحة دينية وترفيهية، تنوع ديموغرافي", growing_sectors: ["سياحة", "ترفيه بحري", "تجارة إلكترونية"], saturated_sectors: ["مطاعم بحرية", "كافيهات الشاطئ"] },
  "الدمام": { population: 1500000, purchasing_power: "عالية", rent_per_sqm: { premium: "120-220", medium: "70-120", affordable: "40-70" }, top_areas: ["الشاطئ", "الفيصلية", "الراكة", "اليرموك"], medium_areas: ["الشاطئ الغربي", "النور"], affordable_areas: ["العزيزية", "الفيحاء"], avg_salary: { unskilled: 3700, skilled: 6800, professional: 14000 }, market_notes: "موظفو أرامكو، دخل ثابت مرتفع", growing_sectors: ["خدمات صناعية", "لوجستيات"], saturated_sectors: ["مغاسل سيارات"] },
  "مكة المكرمة": { population: 2400000, purchasing_power: "متوسطة", rent_per_sqm: { premium: "200-450", medium: "100-200", affordable: "50-100" }, top_areas: ["العزيزية", "الششة", "الزاهر"], medium_areas: ["الكعكية", "النوارية"], affordable_areas: ["بطحاء قريش", "الرصيفة"], avg_salary: { unskilled: 3000, skilled: 5500, professional: 11000 }, market_notes: "موسمية: ذروة 3 شهور، ركود باقي السنة", growing_sectors: ["خدمات حجاج", "هدايا دينية"], saturated_sectors: ["فنادق صغيرة"] },
  "المدينة المنورة": { population: 1500000, purchasing_power: "متوسطة", rent_per_sqm: { premium: "150-280", medium: "80-150", affordable: "45-80" }, top_areas: ["العزيزية", "قباء", "السلام"], medium_areas: ["الدفاع", "الجامعة"], affordable_areas: ["المطار القديم"], avg_salary: { unskilled: 2900, skilled: 5300, professional: 10500 }, market_notes: "سياحة دينية مستمرة، طابع عائلي محافظ", growing_sectors: ["خدمات زائرين", "تمور وهدايا"], saturated_sectors: [] },
  "الخبر": { population: 650000, purchasing_power: "عالية جداً", rent_per_sqm: { premium: "150-280", medium: "85-150", affordable: "50-85" }, top_areas: ["الشاطئ", "العقربية", "الراكة الشمالية"], medium_areas: ["الجوهرة", "الثقبة"], affordable_areas: ["السلام", "الجسر"], avg_salary: { unskilled: 3800, skilled: 7000, professional: 14500 }, market_notes: "قوة شرائية عالية، ذواق راقي", growing_sectors: ["مطاعم راقية", "ترفيه عائلي"], saturated_sectors: ["كوفي الكورنيش"] },
  "أبها": { population: 500000, purchasing_power: "متوسطة", rent_per_sqm: { premium: "80-150", medium: "50-80", affordable: "30-50" }, top_areas: ["الموظفين", "السودة", "الورود"], medium_areas: ["الخشع", "الربوة"], affordable_areas: ["النصب"], avg_salary: { unskilled: 2700, skilled: 4800, professional: 9000 }, market_notes: "موسمية سياحية صيفية قوية", growing_sectors: ["سياحة جبلية", "مغامرة"], saturated_sectors: ["كافيهات إطلالة"] },
  "تبوك": { population: 600000, purchasing_power: "متوسطة-عالية", rent_per_sqm: { premium: "70-140", medium: "45-70", affordable: "25-45" }, top_areas: ["الأخضر", "السلام"], medium_areas: ["الفيصلية"], affordable_areas: ["المروج"], avg_salary: { unskilled: 3000, skilled: 5000, professional: 9500 }, market_notes: "نمو سريع بسبب نيوم، فرص استثنائية", growing_sectors: ["لوجستيات نيوم", "إسكان"], saturated_sectors: [] },
  "القصيم": { population: 1500000, purchasing_power: "متوسطة", rent_per_sqm: { premium: "80-150", medium: "50-80", affordable: "30-50" }, top_areas: ["النخيل", "الصفراء"], medium_areas: ["الإسكان"], affordable_areas: ["الرس"], avg_salary: { unskilled: 2800, skilled: 4700, professional: 9000 }, market_notes: "طابع محافظ، ولاء للمحلات المعروفة", growing_sectors: ["تمور", "أعراس"], saturated_sectors: [] },
  "نجران": { population: 380000, purchasing_power: "متوسطة", rent_per_sqm: { premium: "60-120", medium: "35-60", affordable: "20-35" }, top_areas: ["السد", "الفيصلية"], medium_areas: ["الفهد"], affordable_areas: ["الصناعية"], avg_salary: { unskilled: 2600, skilled: 4400, professional: 8500 }, market_notes: "سوق صغير، منافسة قليلة", growing_sectors: ["زراعة"], saturated_sectors: [] }
};

const SECTOR_INSIGHTS = {
  "كوفي": { avg_monthly_revenue: "30000-120000", profit_margin: "15-25%", failure_rate_2yrs: "60%", setup_cost_range: "150000-400000", main_costs: "إيجار 25%، مواد 28%، رواتب 22%، تشغيل 15%", success_factors: "موقع، تميز قهوة، تجربة عميل، سوشيال", failure_reasons: "إشباع، ضعف تمييز، موقع خاطئ", competitors_examples: "ستاربكس، % عربيكا، دنكن، كوفي بين، مذاق", avg_ticket_size: "25-45 ريال", target_audience: "شباب 20-40، موظفون، طلاب", peak_hours: "صباح (7-10ص)، مساء (5-10م)" },
  "مطاعم": { avg_monthly_revenue: "60000-300000", profit_margin: "10-18%", failure_rate_2yrs: "70%", setup_cost_range: "200000-800000", main_costs: "مواد 35%، رواتب 25%، إيجار 15%، تشغيل 15%", success_factors: "تخصص، جودة ثابتة، توصيل، تسعير", failure_reasons: "قائمة كبيرة، هدر، ضعف إدارة", competitors_examples: "البيك، كودو، ماكدونالدز، هرفي", avg_ticket_size: "40-90 ريال", target_audience: "عائلات، شباب، عمال", peak_hours: "غداء (12-3م)، عشاء (7-11م)" },
  "شاورما": { avg_monthly_revenue: "40000-150000", profit_margin: "20-30%", failure_rate_2yrs: "55%", setup_cost_range: "100000-300000", main_costs: "مواد 38%، رواتب 22%، إيجار 15%، تشغيل 12%", success_factors: "جودة لحم، خبز طازج، توصيل، موقع", failure_reasons: "تقلب جودة، ضعف نظافة، منافسة", competitors_examples: "أبو نواس، الطازج، عثمانلي", avg_ticket_size: "20-50 ريال", target_audience: "عمال، شباب، عائلات", peak_hours: "غداء وعشاء" },
  "حلويات": { avg_monthly_revenue: "40000-180000", profit_margin: "20-35%", failure_rate_2yrs: "45%", setup_cost_range: "120000-500000", main_costs: "مواد 30%، رواتب 20%، إيجار 20%، تغليف 10%", success_factors: "منتج مميز، تصوير، توصيل، مناسبات", failure_reasons: "تقليد، ضعف تغليف، عدم اتساق", competitors_examples: "صابا، عبدالصمد القرشي، ميلانو", avg_ticket_size: "50-200 ريال", target_audience: "نساء، عائلات، مناسبات", peak_hours: "مساء + عطلات" },
  "عبايات": { avg_monthly_revenue: "35000-200000", profit_margin: "25-40%", failure_rate_2yrs: "40%", setup_cost_range: "80000-300000", main_costs: "بضاعة 40%، إيجار 20%، رواتب 15%، تسويق 10%", success_factors: "تصاميم حصرية، خياطة فاخرة، VIP، إنستقرام", failure_reasons: "تشابه، تسعير ضعيف، موقع", competitors_examples: "مزون، نهى، أنوار، حلا الترك", avg_ticket_size: "200-2000 ريال", target_audience: "نساء 20-60، مناسبات", peak_hours: "مساء + قبل المواسم" },
  "خياط": { avg_monthly_revenue: "20000-80000", profit_margin: "30-50%", failure_rate_2yrs: "30%", setup_cost_range: "40000-150000", main_costs: "إيجار 25%، رواتب خياطين 35%، أقمشة 15%", success_factors: "جودة، التزام مواعيد، تخصص", failure_reasons: "تأخر تسليم، ضعف جودة، نقص خياطين", competitors_examples: "محلات خياطة محلية", avg_ticket_size: "150-800 ريال", target_audience: "رجال + نساء", peak_hours: "مساء + مواسم أعياد" },
  "صالون": { avg_monthly_revenue: "30000-150000", profit_margin: "25-40%", failure_rate_2yrs: "50%", setup_cost_range: "100000-400000", main_costs: "رواتب 35%، إيجار 20%، مواد 15%، تجهيزات 10%", success_factors: "مصففين موهوبين، حجز إلكتروني، تجربة فاخرة", failure_reasons: "دوران موظفين، نظافة، تسعير", competitors_examples: "روزا، إكسير، توني آند جاي", avg_ticket_size: "80-500 ريال", target_audience: "نساء/رجال 18-55", peak_hours: "مساء + خميس/جمعة" },
  "تجزئة": { avg_monthly_revenue: "40000-250000", profit_margin: "15-30%", failure_rate_2yrs: "55%", setup_cost_range: "100000-500000", main_costs: "بضاعة 50%، إيجار 15%، رواتب 12%، تسويق 8%", success_factors: "تنوع، موقع، إدارة مخزون، أسعار", failure_reasons: "بضاعة راكدة، منافسة أونلاين", competitors_examples: "نون، أمازون، إكسترا، ساكو، جرير", avg_ticket_size: "حسب المنتج", target_audience: "عام", peak_hours: "مساء + عطلات" },
  "إلكترونيات": { avg_monthly_revenue: "80000-400000", profit_margin: "8-18%", failure_rate_2yrs: "50%", setup_cost_range: "200000-1000000", main_costs: "بضاعة 65%، إيجار 10%، رواتب 10%، ضمان 5%", success_factors: "أسعار، ضمان، خدمة، تشكيلة", failure_reasons: "هامش ضعيف، منافسة أونلاين، تزييف", competitors_examples: "إكسترا، جرير، نون، أمازون", avg_ticket_size: "200-5000 ريال", target_audience: "شباب + موظفون", peak_hours: "مساء + موسم العودة للمدارس" }
};

function detectSector(idea) {
  const text = idea.toLowerCase();
  if (text.match(/كوفي|قهوة|كافيه|مقهى|coffee/)) return { name: "كوفي", data: SECTOR_INSIGHTS["كوفي"] };
  if (text.match(/شاورما|كباب|مشاوي/)) return { name: "شاورما", data: SECTOR_INSIGHTS["شاورما"] };
  if (text.match(/مطعم|برجر|بيتزا|دجاج|مأكولات|أكل/)) return { name: "مطاعم", data: SECTOR_INSIGHTS["مطاعم"] };
  if (text.match(/حلويات|كيك|تشيز|دونات|بقلاوة|آيس/)) return { name: "حلويات", data: SECTOR_INSIGHTS["حلويات"] };
  if (text.match(/عباية|عبايات|فستان/)) return { name: "عبايات", data: SECTOR_INSIGHTS["عبايات"] };
  if (text.match(/خياط|تفصيل|خياطة/)) return { name: "خياط", data: SECTOR_INSIGHTS["خياط"] };
  if (text.match(/صالون|كوافير|تجميل|باربر/)) return { name: "صالون", data: SECTOR_INSIGHTS["صالون"] };
  if (text.match(/إلكترون|جوال|كمبيوتر|لابتوب|أجهزة/)) return { name: "إلكترونيات", data: SECTOR_INSIGHTS["إلكترونيات"] };
  return { name: "تجزئة", data: SECTOR_INSIGHTS["تجزئة"] };
}

export async function POST(request) {
  try {
    const { idea, city, budget } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });

    const cityData = CITIES_DATA[city] || CITIES_DATA["الرياض"];
    const sector = detectSector(idea);
    const budgetNum = parseInt(budget) || 100000;

    const prompt = `أنت محلل استثماري بمستوى McKinsey، خبير بالسوق السعودي 2025-2026. لديك بيانات حقيقية.

═ بيانات ${city} ═
سكان: ${cityData.population.toLocaleString()}
قوة شرائية: ${cityData.purchasing_power}
إيجار/م راقي: ${cityData.rent_per_sqm.premium} ريال
إيجار/م متوسط: ${cityData.rent_per_sqm.medium} ريال
أحياء راقية: ${cityData.top_areas.join("، ")}
أحياء متوسطة: ${cityData.medium_areas.join("، ")}
رواتب: غير ماهر ${cityData.avg_salary.unskilled}، ماهر ${cityData.avg_salary.skilled}، محترف ${cityData.avg_salary.professional}
ملاحظات: ${cityData.market_notes}
قطاعات نامية: ${cityData.growing_sectors.join("، ")}
قطاعات مشبعة: ${cityData.saturated_sectors.join("، ") || "لا يوجد"}

═ بيانات قطاع ${sector.name} ═
إيراد شهري: ${sector.data.avg_monthly_revenue} ريال
هامش ربح: ${sector.data.profit_margin}
نسبة فشل سنتين: ${sector.data.failure_rate_2yrs}
تكلفة تأسيس: ${sector.data.setup_cost_range} ريال
توزيع تكاليف: ${sector.data.main_costs}
نجاح: ${sector.data.success_factors}
فشل: ${sector.data.failure_reasons}
منافسون: ${sector.data.competitors_examples}
الفاتورة: ${sector.data.avg_ticket_size}
الجمهور: ${sector.data.target_audience}
ذروة: ${sector.data.peak_hours}

═ المشروع ═
الفكرة: ${idea}
المدينة: ${city}
الميزانية: ${budgetNum.toLocaleString()} ريال

═ تعليمات ═
1. كن صارماً واقعياً، لا تجامل
2. إذا الميزانية أقل من حد التأسيس → score 25-45, negative
3. إذا القطاع مشبع → خفض score بـ 15-20
4. استخدم الأرقام الحقيقية أعلاه
5. اقترح أحياء من قائمة ${city} الفعلية
6. كل النصوص بالعربي، الأرقام بالريال السعودي

أرجع JSON فقط (لا نص قبل/بعد):
{
"score":75,
"decision":"قرار واضح",
"decision_type":"positive",
"summary":"ملخص في 3 جمل",
"market_demand":"مرتفع",
"competition":"متوسطة",
"cost_level":"متوسط",
"risk_level":"منخفض",

"market_analysis":{
"market_size":"حجم السوق المستهدف في ${city} بأرقام",
"target_audience":"وصف تفصيلي للفئة المستهدفة",
"buying_patterns":"أنماط الشراء وذروة المبيعات",
"seasonality":"الموسمية والشهور الأقوى/الأضعف",
"expected_market_share":"الحصة السوقية المتوقعة بنسبة %",
"growth_potential":"إمكانيات النمو على 3 سنوات",
"competitors":[
{"name":"منافس حقيقي 1","strength":"نقطة قوته"},
{"name":"منافس حقيقي 2","strength":"نقطة قوته"},
{"name":"منافس حقيقي 3","strength":"نقطة قوته"}
]
},

"financial_analysis":{
"setup_costs":{
"rent_deposit":NUMBER,
"renovation":NUMBER,
"equipment":NUMBER,
"licenses":NUMBER,
"initial_inventory":NUMBER,
"marketing_launch":NUMBER,
"working_capital":NUMBER,
"total":NUMBER
},
"monthly_costs":{
"rent":NUMBER,
"salaries":NUMBER,
"utilities":NUMBER,
"materials":NUMBER,
"marketing":NUMBER,
"maintenance":NUMBER,
"other":NUMBER,
"total":NUMBER
},
"revenue_projection":{
"month_1":NUMBER,
"month_3":NUMBER,
"month_6":NUMBER,
"month_12":NUMBER,
"year_2_monthly":NUMBER,
"year_3_monthly":NUMBER
},
"break_even_months":NUMBER,
"roi_percentage":NUMBER,
"annual_profit_year1":NUMBER,
"annual_profit_year3":NUMBER
},

"risk_analysis":[
{"risk":"اسم الخطر 1","probability":"عالي|متوسط|منخفض","impact":"شديد|متوسط|بسيط","mitigation":"خطة التخفيف"},
{"risk":"اسم الخطر 2","probability":"...","impact":"...","mitigation":"..."},
{"risk":"اسم الخطر 3","probability":"...","impact":"...","mitigation":"..."},
{"risk":"اسم الخطر 4","probability":"...","impact":"...","mitigation":"..."},
{"risk":"اسم الخطر 5","probability":"...","impact":"...","mitigation":"..."}
],

"swot":{
"strengths":["قوة 1","قوة 2","قوة 3","قوة 4"],
"weaknesses":["ضعف 1","ضعف 2","ضعف 3"],
"opportunities":["فرصة 1","فرصة 2","فرصة 3"],
"threats":["تهديد 1","تهديد 2","تهديد 3"]
},

"locations":{
"best":{"name":"اسم حي من ${city}","reason":"السبب","score":85},
"worst":{"name":"اسم حي بعيد","reason":"السبب","score":35}
},

"recommendations":[
"توصية استراتيجية محددة 1",
"توصية استراتيجية محددة 2",
"توصية استراتيجية محددة 3",
"توصية استراتيجية محددة 4"
],

"kpis":[
{"name":"مؤشر","target":"الهدف"},
{"name":"مؤشر","target":"الهدف"},
{"name":"مؤشر","target":"الهدف"},
{"name":"مؤشر","target":"الهدف"}
],

"alternative_idea":"فكرة بديلة محددة",
"alternative_city":"مدينة بديلة",
"monthly_data":[6 أرقام توقع مبيعات]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 16384, responseMimeType: "application/json" },
        }),
      }
    );

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let cleanText = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: "JSON غير صحيح" }, { status: 500 });

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
