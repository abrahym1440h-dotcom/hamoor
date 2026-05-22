import { supabase } from "./supabaseClient";

// ===== تسجيل حساب جديد =====
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(translateError(error.message));
  return data;
}

// ===== تسجيل الدخول =====
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateError(error.message));
  return data;
}

// ===== تسجيل الخروج =====
export async function signOut() {
  await supabase.auth.signOut();
}

// ===== جلب المستخدم الحالي =====
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ===== مراقبة حالة الدخول =====
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return data?.subscription;
}

// ===== حفظ تحليل في الحساب =====
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

// ===== جلب تحليلات المستخدم =====
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

// ===== حذف تحليل =====
export async function deleteAnalysisCloud(id) {
  await supabase.from("analyses").delete().eq("id", id);
}

// ===== جلب حالة الاشتراك =====
export async function getProfile(userId) {
  if (!userId) return { is_premium: false };
  try {
    let { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!data) {
      await supabase.from("profiles").insert({ id: userId, is_premium: false });
      return { is_premium: false };
    }
    return data;
  } catch(e) {
    try { await supabase.from("profiles").insert({ id: userId, is_premium: false }); } catch(e2) {}
    return { is_premium: false };
  }
}

// ===== تفعيل الاشتراك بكود =====
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
  if (upErr) throw new Error("تعذر تفعيل الاشتراك، حاول مرة أخرى");
  return true;
}

// ===== ترجمة رسائل الخطأ للعربية =====
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
