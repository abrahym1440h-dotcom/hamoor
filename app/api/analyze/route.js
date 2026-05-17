// قاعدة بيانات السوق السعودي - أسعار وبيانات حقيقية تقريبية 2026
const MARKET_DATA = {
  "الرياض": {
    rent_ranges: { commercial_small: "8000-15000", commercial_medium: "15000-30000", commercial_large: "30000-80000" },
    top_areas: ["العليا", "الملقا", "النخيل", "حطين", "الياسمين"],
    affordable_areas: ["السويدي", "الشفا", "العزيزية", "النسيم"],
    avg_salary: { worker: 3500, skilled: 6000, manager: 12000 },
    population: 7000000,
    competition: "عالية في كل القطاعات"
  },
  "جدة": {
    rent_ranges: { commercial_small: "7000-13000", commercial_medium: "13000-25000", commercial_large: "25000-70000" },
    top_areas: ["الشاطئ", "الروضة", "الأندلس", "الزهراء", "البساتين"],
    affordable_areas: ["الصفا", "النزهة", "الربوة", "المنار"],
    avg_salary: { worker: 3300, skilled: 5800, manager: 11500 },
    population: 4700000,
    competition: "عالية، خاصة في القطاع التجاري"
  },
  "الدمام": {
    rent_ranges: { commercial_small: "6000-11000", commercial_medium: "11000-20000", commercial_large: "20000-50000" },
    top_areas: ["الشاطئ", "الفيصلية", "الراكة", "الشاطئ الغربي"],
    affordable_areas: ["العزيزية", "النور", "الفيحاء"],
    avg_salary: { worker: 3500, skilled: 6200, manager: 12500 },
    population: 1500000,
    competition: "متوسطة، قطاعات صناعية قوية"
  },
  "مكة المكرمة": {
    rent_ranges: { commercial_small: "7000-14000", commercial_medium: "14000-28000", commercial_large: "28000-70000" },
    top_areas: ["العزيزية", "الششة", "الزاهر", "الحجون"],
    affordable_areas: ["الكعكية", "النوارية", "بطحاء قريش"],
    avg_salary: { worker: 3000, skilled: 5500, manager: 10500 },
    population: 2400000,
    competition: "عالية موسمياً (موسم الحج والعمرة)"
  },
  "المدينة المنورة": {
    rent_ranges: { commercial_small: "5000-10000", commercial_medium: "10000-20000", commercial_large: "20000-50000" },
    top_areas: ["العزيزية", "قباء", "السلام", "العنبرية"],
    affordable_areas: ["الدفاع", "الجامعة", "الرانوناء"],
    avg_salary: { worker: 2900, skilled: 5200, manager: 10000 },
    population: 1500000,
    competition: "متوسطة، نمو سياحي ديني"
  },
  "الخبر": {
    rent_ranges: { commercial_small: "7000-13000", commercial_medium: "13000-25000", commercial_large: "25000-60000" },
    top_areas: ["الشاطئ", "العقربية", "الراكة الشمالية", "اليرموك"],
    affordable_areas: ["الثقبة", "الجوهرة", "الحزام الذهبي"],
    avg_salary: { worker: 3700, skilled: 6500, manager: 13000 },
    population: 650000,
    competition: "متوسطة، قوة شرائية عالية"
  },
  "أبها": {
    rent_ranges: { commercial_small: "4000-8000", commercial_medium: "8000-15000", commercial_large: "15000-35000" },
    top_areas: ["الموظفين", "السودة", "الورود", "المروج"],
    affordable_areas: ["الخشع", "المنسك", "الربوة"],
    avg_salary: { worker: 2800, skilled: 4800, manager: 9000 },
    population: 500000,
    competition: "منخفضة، فرص سياحية موسمية"
  },
  "تبوك": {
    rent_ranges: { commercial_small: "4000-8000", commercial_medium: "8000-16000", commercial_large: "16000-35000" },
    top_areas: ["الأخضر", "السلام", "المنشية"],
    affordable_areas: ["الفيصلية", "العزيزية"],
    avg_salary: { worker: 2900, skilled: 4900, manager: 9200 },
    population: 600000,
    competition: "منخفضة، نمو سريع مع مشاريع نيوم"
  },
  "القصيم": {
    rent_ranges: { commercial_small: "4500-9000", commercial_medium: "9000-17000", commercial_large: "17000-40000" },
    top_areas: ["النخيل", "الصفراء", "الورود"],
    affordable_areas: ["الفايزية", "الرس"],
    avg_salary: { worker: 2800, skilled: 4700, manager: 8800 },
    population: 1500000,
    competition: "متوسطة، قاعدة زراعية وتجارية"
  },
  "نجران": {
    rent_ranges: { commercial_small: "3500-7000", commercial_medium: "7000-13000", commercial_large: "13000-30000" },
    top_areas: ["السد", "الفيصلية", "نجران الجديدة"],
    affordable_areas: ["الفهد", "العزيزية"],
    avg_salary: { worker: 2700, skilled: 4500, manager: 8500 },
    population: 380000,
    competition: "منخفضة، سوق صغير"
  }
};

export async function POST(request) {
  try {
    const { idea, city, budget } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 500 });
    }

    const cityData = MARKET_DATA[city] || MARKET_DATA["الرياض"];

    const prompt = `أنت محلل استثماري خبير في السوق السعودي 2026. لديك بيانات حقيقية ودقيقة عن المدينة. حلل بصدق وواقعية، ولا تتساهل في التقييم.

=== بيانات حقيقية عن ${city} ===
- عدد السكان: ${cityData.population.toLocaleString()}
- إيجار محل صغير: ${cityData.rent_ranges.commercial_small} ريال/شهر
- إيجار محل متوسط: ${cityData.rent_ranges.commercial_medium} ريال/شهر
- أفضل الأحياء التجارية: ${cityData.top_areas.join("، ")}
- أحياء أقل تكلفة: ${cityData.affordable_areas.join("، ")}
- متوسط راتب عامل: ${cityData.avg_salary.worker} ريال
- متوسط راتب موظف متخصص: ${cityData.avg_salary.skilled} ريال
- المنافسة العامة: ${cityData.competition}

=== المشروع المراد تحليله ===
- الفكرة: ${idea}
- المدينة: ${city}
- الميزانية الكلية: ${budget} ريال

=== المطلوب ===
حلل المشروع بصدق بناءً على البيانات الحقيقية أعلاه. كن واقعياً:
- إذا الميزانية قليلة جداً → decision_type: "negative" و score منخفض (30-50)
- إذا الفكرة مشبعة في السوق → نبّه على ذلك
- استخدم الأرقام الحقيقية للإيجار والرواتب من البيانات
- اقترح أحياء محددة من قائمة الأحياء أعلاه
- اذكر منافسين حقيقيين معروفين إن أمكن

أرجع JSON فقط بدون أي نص قبله أو بعده. كن مختصراً في النصوص (جملتين كحد أقصى لكل insight):

{"score":NUMBER,"decision":"TEXT","decision_type":"positive_OR_negative","market_demand":"TEXT","competition":"TEXT","cost_level":"TEXT","risk_level":"TEXT","summary":"TEXT","market_insight":"جملتين فقط","financial_insight":"جملتين فقط مع أرقام واقعية","risk_insight":"جملتين فقط","best_location":{"name":"اسم الحي من قائمة المدينة","score":NUMBER},"worst_location":{"name":"اسم حي أقل ملاءمة","score":NUMBER},"costs":{"rent":NUMBER,"operations":NUMBER,"salaries":NUMBER,"total":NUMBER},"risks":["خطر واقعي 1","خطر واقعي 2","خطر واقعي 3"],"alternative_idea":"فكرة بديلة محددة","alternative_city":"مدينة بديلة","monthly_data":[6 أرقام تمثل توقع المبيعات الشهرية],"strengths":["قوة 1","قوة 2","قوة 3"]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
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
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "لم يرجع JSON صحيح" }, { status: 500 });
    }

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
