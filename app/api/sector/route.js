import { CITIES_DATA, SUCCESS_RATES, SECTOR_FINANCIALS, COMPETITORS_BY_SECTOR, getSectorScore, getSectorLevel, getCityBrief } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req) {
  try {
    const { city } = await req.json();

    if (!city) {
      return Response.json({ error: "المدينة مطلوبة" }, { status: 400 });
    }

    const cityName = city.split(" - ")[0].trim();
    const cityData = CITIES_DATA[cityName];

    if (!cityData) {
      return Response.json({ error: "المدينة غير موجودة" }, { status: 400 });
    }

    // حساب كل القطاعات لهذه المدينة - أرقام ثابتة من المعادلة
    const sectors = Object.keys(SUCCESS_RATES).map(name => {
      const score = getSectorScore(name, cityName);
      const level = getSectorLevel(score);
      const fin = SECTOR_FINANCIALS[name] || {};
      const rates = SUCCESS_RATES[name] || {};
      const competitors = COMPETITORS_BY_SECTOR[name] || [];

      return {
        name,
        score,
        level: level.label,
        color: level.color,
        success_rate: rates.success || 50,
        failure_rate: rates.failure || 50,
        note: rates.note || "",
        setup_min: fin.setup_total?.min || 0,
        setup_max: fin.setup_total?.max || 0,
        revenue_medium: fin.revenue?.medium || 0,
        profit_margin: fin.profit_margin || "",
        break_even: fin.break_even_months || "",
        top_competitors: competitors.slice(0, 5)
      };
    }).sort((a, b) => b.score - a.score);

    return Response.json({
      city: cityName,
      city_info: {
        population: cityData.population,
        avg_income: cityData.avg_income,
        market_size: cityData.market_size,
        character: cityData.character
      },
      sectors,
      best_sector: sectors[0]?.name || "",
      total: sectors.length
    });

  } catch (error) {
    console.error("Sector Error:", error.message);
    return Response.json({ error: "خطأ في الخادم: " + error.message }, { status: 500 });
  }
}
