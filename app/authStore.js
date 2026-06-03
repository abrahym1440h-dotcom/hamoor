import { supabase } from "./supabaseClient";

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(translateError(error.message));
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateError(error.message));
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return data?.subscription;
}

export async function saveAnalysisCloud(analysis, userId) {
  const { data, error } = await supabase.from("analyses").insert({
    user_id: userId,
    idea: analysis.idea || "",
    city: analysis.city || "",
    budget: String(analysis.budget || ""),
    score: analysis.score || 0,
    decision: analysis.decision || "",
    decision_type: analysis.decision_type || "",
    data: analysis
  }).select().single();
  if (error) throw new Error("فشل حفظ التحليل");
  return data;
}

export async function getAnalysesCloud(userId) {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).map(row => ({
    ...row.data,
    id: row.id,
    savedAt: row.created_at,
    score: row.score,
    idea: row.idea,
    city: row.city,
    decision: row.decision,
    decision_type: row.decision_type
  }));
}

export async function deleteAnalysisCloud(id) {
  await supabase.from("analyses").delete().eq("id", id);
}

export async function getProfile(userId) {
  if (!userId) return { is_premium: false, name: "" };
  try {
    let { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!data) {
      await supabase.from("profiles").insert({ id: userId, is_premium: false });
      return { is_premium: false, name: "" };
    }
    return data;
  } catch(e) {
    try { await supabase.from("profiles").insert({ id: userId, is_premium: false }); } catch(e2) {}
    return { is_premium: false, name: "" };
  }
}

export async function updateName(userId, name) {
  if (!userId) throw new Error("سجّل الدخول أولاً");
  const { error } = await supabase.from("profiles").update({ name: (name || "").trim() }).eq("id", userId);
  if (error) throw new Error("تعذّر حفظ الاسم");
  return true;
}

export async function activateWithCode(userId, code) {
  if (!userId) throw new Error("سجّل الدخول أولاً");
  const clean = (code || "").trim().toUpperCase();
  if (!clean) throw new Error("أدخل كود التفعيل");
  const { data, error } = await supabase
    .from("activation_codes")
    .select("code,active")
    .eq("code", clean)
    .single();
  if (error || !data || !data.active) throw new Error("كود التفعيل غير صحيح");
  const { error: upErr } = await supabase
    .from("profiles")
    .update({ is_premium: true })
    .eq("id", userId);
  if (upErr) throw new Error("تعذّر تفعيل الاشتراك، حاول مرة أخرى");
  return true;
}

export async function cancelSubscription(userId) {
  if (!userId) throw new Error("سجّل الدخول أولاً");
  const { error } = await supabase
    .from("profiles")
    .update({ is_premium: false })
    .eq("id", userId);
  if (error) throw new Error("تعذّر إلغاء الاشتراك، حاول مرة أخرى");
  return true;
}

// مدة التجديد للتحليلات: 7 أيام بالميلي ثانية
const RESET_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

// تجيب عدد التحليلات المستخدمة، وتصفّرها تلقائياً إذا مرّ أسبوع
export async function getUsage(userId) {
  if (!userId) return 0;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("analyses_used, usage_reset_at")
      .eq("id", userId)
      .single();
    if (!data) return 0;

    const resetAt = data.usage_reset_at ? new Date(data.usage_reset_at).getTime() : 0;
    const now = Date.now();

    // مرّ أسبوع أو أكثر = نصفّر العدّاد
    if (!resetAt || (now - resetAt) >= RESET_PERIOD_MS) {
      await supabase
        .from("profiles")
        .update({ analyses_used: 0, usage_reset_at: new Date().toISOString() })
        .eq("id", userId);
      return 0;
    }
    return data.analyses_used || 0;
  } catch(e) {
    return 0;
  }
}

// تزيد عدّاد التحليلات بواحد (يُستدعى بعد كل تحليل ناجح)
export async function incrementUsage(userId) {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("analyses_used")
      .eq("id", userId)
      .single();
    const current = data?.analyses_used || 0;
    await supabase
      .from("profiles")
      .update({ analyses_used: current + 1 })
      .eq("id", userId);
  } catch(e) {
    console.error("incrementUsage error:", e.message);
  }
}

// ═══ عدّادات شهرية عامة (للاقتراحات والتفاصيل) — تتجدد كل 30 يوم ═══
const MONTH_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

async function getMonthlyUsage(userId, usedCol, resetCol) {
  if (!userId) return 0;
  try {
    const { data } = await supabase
      .from("profiles")
      .select(`${usedCol}, ${resetCol}`)
      .eq("id", userId)
      .single();
    if (!data) return 0;

    const resetAt = data[resetCol] ? new Date(data[resetCol]).getTime() : 0;
    const now = Date.now();

    if (!resetAt || (now - resetAt) >= MONTH_PERIOD_MS) {
      await supabase
        .from("profiles")
        .update({ [usedCol]: 0, [resetCol]: new Date().toISOString() })
        .eq("id", userId);
      return 0;
    }
    return data[usedCol] || 0;
  } catch(e) {
    return 0;
  }
}

async function incrementMonthlyUsage(userId, usedCol) {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from("profiles")
      .select(usedCol)
      .eq("id", userId)
      .single();
    const current = data?.[usedCol] || 0;
    await supabase
      .from("profiles")
      .update({ [usedCol]: current + 1 })
      .eq("id", userId);
  } catch(e) {
    console.error("incrementMonthlyUsage error:", e.message);
  }
}

// الاقتراحات: مجاني مرّة واحدة كل شهر
export function getSuggestionsUsage(userId) {
  return getMonthlyUsage(userId, "suggestions_used", "suggestions_reset_at");
}
export function incrementSuggestionsUsage(userId) {
  return incrementMonthlyUsage(userId, "suggestions_used");
}

// تفاصيل الاقتراحات: للمشترك 3 كل شهر
export function getDetailsUsage(userId) {
  return getMonthlyUsage(userId, "details_used", "details_reset_at");
}
export function incrementDetailsUsage(userId) {
  return incrementMonthlyUsage(userId, "details_used");
}

function translateError(msg) {
  if (!msg) return "حدث خطأ، حاول مرة أخرى";
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "البريد أو كلمة المرور غير صحيحة";
  if (m.includes("already registered") || m.includes("already been registered")) return "هذا البريد مسجّل من قبل، سجّل دخول";
  if (m.includes("password should be at least")) return "كلمة المرور قصيرة، استخدم 6 أحرف على الأقل";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "صيغة البريد الإلكتروني غير صحيحة";
  if (m.includes("email not confirmed")) return "فعّل بريدك أولاً من رسالة التأكيد";
  return "حدث خطأ، حاول مرة أخرى";
}
