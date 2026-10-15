"use client";
import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { AlertTriangle, BookOpen, ChevronLeft } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   رد المستشار بخمسة تصاميم: ١ ملخّص · ٥ محادثة · ٨ سيولة · ٩ تبويبات · ١٠ تقرير
   - يقرأ بطاقة المستشار الجديدة (§CARD§ + JSON): وسوم، حالة، أرقام، خطوات، مقال
   - ويقرأ كذلك الردود النصية القديمة (المشكلة / المخاطر / الخطوات)
   - إذا ما قدر يقسّم الرد يعرضه فقاعة عادية مثل قبل
   ══════════════════════════════════════════════════════════════ */

export const REPLY_LAYOUTS = [
  { id: 1, name: "ملخّص" },
  { id: 5, name: "محادثة" },
  { id: 8, name: "سيولة" },
  { id: 9, name: "تبويبات" },
  { id: 10, name: "تقرير" },
];

/* ---------- تحليل نص الرد ---------- */
const stripMd = (s) => String(s).replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/`/g, "").replace(/^#{1,6}\s*/, "").trim();
const ITEM_RE = /^\s*(?:[0-9٠-٩]{1,2}\s*[.)\-–]|[-•▪●◦*])\s+(.+)$/;
const KINDS = [
  [/مشكل/, "problem"],
  [/مخاطر|مخاطرة|تحذير|أخطار/, "risks"],
  [/خطو|توصي|أنصح|اقتراح|الحل/, "steps"],
];
const kindOf = (h) => { for (const [re, k] of KINDS) if (re.test(h)) return k; return "other"; };

function headerOf(raw) {
  const line = raw.trim();
  if (!line || ITEM_RE.test(line)) return null;
  const c = stripMd(line);
  const m = c.match(/^([^:：]{2,45})[:：]\s*(.*)$/);
  if (m && kindOf(m[1]) !== "other") return { name: m[1].trim(), rest: m[2].trim() };
  const bare = /^#{1,6}\s/.test(line) || /^\*\*.+\*\*:?$/.test(line) || !/[.؟!،,]/.test(c);
  if (c.length <= 45 && kindOf(c) !== "other" && bare) return { name: c.replace(/[:：]$/, ""), rest: "" };
  return null;
}

function splitTitle(text) {
  let m = text.match(/^(.{3,52}?)\s*[:：]\s+([\s\S]+)$/);
  if (m) return { title: m[1].trim(), body: m[2].trim() };
  m = text.match(/^(.{3,52}?)[.!؟]\s+([\s\S]{20,})$/);
  if (m) return { title: m[1].trim(), body: m[2].trim() };
  return { title: "", body: text.trim() };
}

export function parseReply(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const secs = [], pre = [];
  let cur = null, item = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { item = null; continue; }
    const h = headerOf(line);
    if (h) {
      cur = { kind: kindOf(h.name), name: h.name, items: [], paras: [] };
      secs.push(cur); item = null;
      if (h.rest) cur.paras.push(h.rest);
      continue;
    }
    const m = line.match(ITEM_RE);
    if (m) {
      if (!cur) { cur = { kind: "other", name: "", items: [], paras: [] }; secs.push(cur); }
      item = { text: stripMd(m[1]) }; cur.items.push(item); continue;
    }
    const c = stripMd(line);
    if (item) { item.text += " " + c; continue; }
    if (!cur) { pre.push(c); continue; }
    cur.paras.push(c);
  }
  const of = (k) => secs.filter((s) => s.kind === k);
  const itemsOf = (s) => (s.items.length ? s.items.map((i) => splitTitle(i.text)) : s.paras.map((p) => splitTitle(p)));

  let problem = null;
  const ps = of("problem")[0];
  if (ps) {
    const txt = [...ps.paras, ...ps.items.map((i) => i.text)].join(" ").trim();
    const m = txt.match(/^(.{4,80}?)[.!؟]\s+([\s\S]+)$/);
    problem = m ? { title: m[1].trim(), body: m[2].trim() } : txt.length <= 80 ? { title: txt, body: "" } : { title: "", body: txt };
  }
  const risks = of("risks").flatMap(itemsOf);
  const steps = of("steps").flatMap(itemsOf);
  const rest = [];
  secs.filter((s) => s.kind === "other").forEach((s) => { s.paras.forEach((p) => rest.push(p)); s.items.forEach((i) => rest.push(i.text)); });
  const count = (problem ? 1 : 0) + risks.length + steps.length;
  const recognised = !!problem || risks.length > 0 || steps.length > 0;
  return { ok: recognised && count >= 2, intro: pre.join(" ").trim(), problem, risks, steps, rest, raw: String(text || "") };
}

/* ---------- بطاقة المستشار: §CARD§ ثم JSON ----------
   {"chips":[{"text":"نقطة تعادل","level":"high"}],"status":"جملة الحالة",
    "stats":[{"value":"71,929,793","label":"المصروفات"}],
    "steps":[{"title":"…","detail":"…"}],"article":{"label":"عنوان مقال"}}     */
const CARD_MARK = "§CARD§";
const cleanStr = (v) => (v == null || typeof v === "object" ? "" : stripMd(String(v)).replace(/\s+/g, " ").trim());

function levelOf(l) {
  const s = String(l == null ? "" : l).toLowerCase();
  if (/high|red|crit|danger|sever|عال|مرتفع|خطر|حرج|شديد/.test(s)) return "high";
  if (/med|mid|warn|orange|amber|moder|متوسط|تنبيه|تحذير/.test(s)) return "mid";
  if (/low|green|good|ok|safe|pos|ready|منخفض|جيد|آمن|إيجاب|ايجاب/.test(s)) return "low";
  return "info";
}

// يقرأ الـ JSON من أول { ويصلّحه إذا كان مقطوعاً، أو فيه أسطر داخل النص، أو علامات تنصيص داخل الجملة
function scanJson(s, start) {
  let out = "", inStr = false, esc = false;
  const stack = [];
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) { esc = false; out += c; continue; }
      if (c === "\\") { esc = true; out += c; continue; }
      if (c === '"') {
        let j = i + 1;
        while (j < s.length && /\s/.test(s[j])) j++;
        const nx = s[j];
        if (nx === undefined || nx === "," || nx === "}" || nx === "]" || nx === ":") { inStr = false; out += c; }
        else out += '\\"';                                   // علامة تنصيص داخل الجملة
        continue;
      }
      out += c === "\n" || c === "\r" || c === "\t" ? " " : c;
      continue;
    }
    out += c;
    if (c === '"') inStr = true;
    else if (c === "{") stack.push("}");
    else if (c === "[") stack.push("]");
    else if (c === "}" || c === "]") { stack.pop(); if (!stack.length) return { json: out.replace(/,(\s*[}\]])/g, "$1"), end: i + 1, cut: false }; }
  }
  const cut = inStr;                                          // انقطع الرد وسط جملة
  if (inStr) { if (esc) out = out.slice(0, -1); out += '"'; }
  out = out.replace(/,\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, "").replace(/,\s*$/, "").replace(/:\s*$/, ': ""');
  while (stack.length) out += stack.pop();
  return { json: out.replace(/,(\s*[}\]])/g, "$1"), end: s.length, cut };
}

const unesc = (s) => { try { return JSON.parse('"' + String(s).replace(/\r?\n/g, " ") + '"'); } catch (e) { return String(s).replace(/\\"/g, '"').replace(/\\n/g, " "); } };
const SV = '"((?:[^"\\\\]|\\\\.|"(?!\\s*[,}\\]:]))*)';          // نص بين علامتي تنصيص (يتحمّل علامة تنصيص داخلية)
// آخر محاولة: نسحب الحقول بالنمط لو تعذّر قراءة JSON كامل
function salvageCard(js) {
  const all = (re) => { const r = []; let m; while ((m = re.exec(js))) r.push(m); return r; };
  const o = {};
  const chips = all(new RegExp('"text"\\s*:\\s*' + SV + '"\\s*,\\s*"level"\\s*:\\s*' + SV + '"', "g")).map((m) => ({ text: unesc(m[1]), level: unesc(m[2]) }));
  if (chips.length) o.chips = chips;
  const st = new RegExp('"status"\\s*:\\s*' + SV).exec(js);
  if (st) o.status = unesc(st[1]);
  const stats = all(new RegExp('"value"\\s*:\\s*(?:' + SV + '"|(-?[\\d.,]+))\\s*,\\s*"label"\\s*:\\s*' + SV + '"', "g")).map((m) => ({ value: m[1] != null ? unesc(m[1]) : m[2], label: unesc(m[3]) }));
  if (stats.length) o.stats = stats;
  const steps = all(new RegExp('"title"\\s*:\\s*' + SV + '"\\s*,\\s*"detail"\\s*:\\s*' + SV, "g")).map((m) => ({ title: unesc(m[1]), detail: unesc(m[2]) }));
  if (steps.length) o.steps = steps;
  const ar = new RegExp('"article"\\s*:\\s*\\{\\s*"label"\\s*:\\s*' + SV).exec(js);
  if (ar) o.article = { label: unesc(ar[1]) };
  return Object.keys(o).length ? o : null;
}

function normalizeCard(o) {
  const arr = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : v ? [v] : []);
  const chips = arr(o.chips || o.tags).map((c) => (typeof c === "string"
    ? { text: cleanStr(c), level: "info" }
    : { text: cleanStr(c && (c.text || c.label || c.title)), level: levelOf(c && (c.level || c.severity || c.type)) })).filter((c) => c.text).slice(0, 6);
  const status = cleanStr(o.status || o.summary || o.headline || o.verdict || o.title || o.message || o.text);
  const st = o.stats || o.numbers || o.metrics || o.figures;
  let stats;
  if (st && !Array.isArray(st) && typeof st === "object" && !("value" in st)) stats = Object.entries(st).map(([k, v]) => ({ label: cleanStr(k), value: cleanStr(v) }));
  else stats = arr(st).map((s) => ({ value: cleanStr(s && (s.value != null ? s.value : s.v != null ? s.v : s.number)), label: cleanStr(s && (s.label || s.name || s.title)) }));
  stats = stats.filter((s) => s.value).slice(0, 6);
  const toItem = (s) => (typeof s === "string" ? splitTitle(cleanStr(s)) : { title: cleanStr(s && (s.title || s.name || s.label)), body: cleanStr(s && (s.detail || s.details || s.description || s.body || s.text || s.desc)) });
  const steps = arr(o.steps || o.actions || o.next_steps || o.recommendations).map(toItem).filter((x) => x.title || x.body).slice(0, 8);
  const risks = arr(o.risks || o.warnings).map(toItem).filter((x) => x.title || x.body).slice(0, 6);
  const ar = o.article || o.read || o.learn;
  let article = null;
  if (typeof ar === "string") article = { label: cleanStr(ar) };
  else if (ar && typeof ar === "object") article = { label: cleanStr(ar.label || ar.title || ar.name), id: ar.id };
  if (article && !article.label) article = null;
  if (!chips.length && !status && !stats.length && !steps.length && !risks.length && !article) return null;
  return { chips, status, stats, steps, risks, article, head: "", tail: [], raw: "" };
}

export function parseCard(text) {
  const raw = String(text || "");
  const i = raw.indexOf(CARD_MARK);
  let head = "", body = raw;
  if (i >= 0) { head = raw.slice(0, i); body = raw.slice(i + CARD_MARK.length); }
  else if (!/^\s*(?:```(?:json)?\s*)?\{\s*"(?:chips|status|stats|steps|article)"/.test(raw)) return null;
  const st = body.indexOf("{");
  if (st < 0) return null;
  const sc = scanJson(body, st);
  let obj = null;
  try { obj = JSON.parse(sc.json); } catch (e) { obj = salvageCard(body.slice(st)); }
  if (obj && obj.card && typeof obj.card === "object" && !Array.isArray(obj.card)) obj = obj.card;
  if (!obj || typeof obj !== "object") return null;
  const C = normalizeCard(obj);
  if (!C) return null;
  if (sc.cut) {                                               // الرد انقطع: نبيّن إن الجملة ناقصة
    if (C.steps.length) { const l = C.steps[C.steps.length - 1]; if (l.body) l.body += "…"; else l.title += "…"; }
    else if (C.status) C.status += "…";
  }
  C.head = cleanStr(head.replace(/```(?:json)?/g, ""));
  C.tail = body.slice(sc.end).replace(/```/g, "").split(/\n{2,}/).map(cleanStr).filter(Boolean);
  C.raw = [C.status, ...C.chips.map((c) => c.text), ...C.stats.map((x) => x.label), ...C.steps.map((x) => `${x.title} ${x.body}`)].join(" ");
  return C;
}

/* ---------- أرقام المشروع من نتيجة التحليل ---------- */
function toNum(v) {
  if (v == null) return null;
  const m = String(v).replace(/[,٬\s]/g, "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).match(/\d+(\.\d+)?/);
  const n = m ? parseFloat(m[0]) : NaN;
  return isFinite(n) && n > 0 ? n : null;
}
export function numbersFrom(result) {
  const fa = (result && result.financial_analysis) || {};
  const budget = toNum(result && result.budget), setup = toNum(fa.setup_costs && fa.setup_costs.total),
    monthly = toNum(fa.monthly_costs && fa.monthly_costs.total), be = toNum(fa.break_even_months),
    m1 = toNum(fa.revenue_projection && fa.revenue_projection.month_1);
  const sc = result && result.score != null && isFinite(+result.score) ? Math.round(+result.score) : null;
  return {
    budget, setup, monthly, be, m1, score: sc,
    decision: (result && result.decision) || "", dtype: (result && result.decision_type) || "",
    coverage: budget && setup ? Math.round((budget / setup) * 100) : null,
    runway: budget && monthly ? budget / monthly : null,
    idea: (result && result.idea) || "", city: (result && result.city) || "",
  };
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");
function fmtMonths(x) {
  if (x == null) return "";
  if (x < 1) return "أقل من شهر";
  const r = Math.round(x * 2) / 2, w = Math.floor(r), half = r - w >= 0.5 ? 1 : 0;
  const unit = (n) => (n === 1 ? "شهر" : n === 2 ? "شهرين" : n <= 10 ? `${n} أشهر` : `${n} شهراً`);
  return half ? (w === 1 ? "شهر ونصف" : `${unit(w)} ونصف`) : unit(w);
}

/* ---------- مقال التعلّم المذكور في الرد ---------- */
const normAr = (s) => String(s || "").replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
function findArticle(text, articles) {
  if (!articles || !articles.length) return null;
  const n = normAr(text);
  let best = null;
  for (const a of articles) {
    if (!a || !a.title) continue;
    if (n.includes(normAr(a.title)) && (!best || a.title.length > best.title.length)) best = a;
  }
  return best;
}
// مقال البطاقة: نطابق العنوان مع مقالات التطبيق، وإذا ما لقينا نعرض العنوان نفسه
function articleFor(C, articles) {
  const label = C && C.article && C.article.label;
  if (!label) return null;
  const n = normAr(label);
  let best = null, score = 0;
  for (const a of articles || []) {
    if (!a || !a.title) continue;
    const tt = normAr(a.title);
    let s = 0;
    if (tt === n) s = 100;
    else if (tt.includes(n) || n.includes(tt)) s = 80;
    else {
      const A = new Set(n.split(" ").filter((w) => w.length > 2)), B = tt.split(" ").filter((w) => w.length > 2);
      s = A.size && B.length ? Math.round((60 * B.filter((w) => A.has(w)).length) / Math.max(A.size, B.length)) : 0;
    }
    if (s > score) { score = s; best = a; }
  }
  return best && score >= 40 ? best : { title: label };
}
function dropMention(s, title) {
  if (!title || !String(s).includes(title)) return s;
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("[،,]?\\s*(?:و)?(?:اقرأ|اقرا|اطلع على|راجع|انظر)?\\s*(?:مقال(?:ة)?|المقال(?:ة)?)?\\s*[«\"“]?\\s*" + esc + "\\s*[»\"”]?", "g");
  return s.replace(re, "").replace(/\s{2,}/g, " ").replace(/\s+([.،,])/g, "$1").replace(/^[\s.،,]+/, "").trim();
}

/* ---------- عناصر مشتركة ---------- */
const scoreColor = (v, t) => (v >= 75 ? t.green : v >= 60 ? t.orange : t.red);
const dtypeColor = (d, score, t) => (/pos/i.test(d) ? t.green : /neg/i.test(d) ? t.red : /neu|mid|warn/i.test(d) ? t.orange : score != null ? scoreColor(score, t) : t.blue);
const tint = (c, a) => `${c}${a}`;

// يحمي الأرقام السالبة والتقريبية داخل النص العربي (علشان العلامة تبقى جنب الرقم)
function Inline({ text }) {
  const s = String(text == null ? "" : text), out = [];
  const re = /(^|\s)([-−–~≈]\d[\d.,٬]*%?)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    const at = m.index + m[1].length;
    if (at > last) out.push(s.slice(last, at));
    out.push(<bdi key={at} dir="ltr">{m[2]}</bdi>);
    last = at + m[2].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return <>{out}</>;
}

function Shell({ t, children, gap = 14, bg }) {
  return (
    <div style={{ width: "100%", boxSizing: "border-box", background: bg || t.F5, border: `1px solid ${t.sepL}`, borderRadius: 18, padding: 14, display: "flex", flexDirection: "column", gap }}>
      {children}
    </div>
  );
}
function Pill({ children, color, bg, size = 11.5 }) {
  return <span style={{ display: "inline-block", fontSize: size, fontWeight: 700, color, background: bg, borderRadius: 99, padding: "2px 11px", lineHeight: 1.6 }}>{children}</span>;
}
function Dot({ n, color, bg, solid, size = 24 }) {
  return (
    <span style={{ flexShrink: 0, width: size, height: size, borderRadius: "50%", background: solid ? color : bg, color: solid ? "#fff" : color, fontSize: size * 0.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
      {n}
    </span>
  );
}
function Ring({ value, color, t, size = 62 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, d = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.F3} strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${d} ${c - d}`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1, direction: "ltr" }}>
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color: t.L1, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <span style={{ fontSize: size * 0.15, color: t.L3, marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}
function Heading({ t, children, color }) {
  return <div style={{ fontSize: 13.5, fontWeight: 700, color: color || t.L1 }}>{children}</div>;
}
function Para({ t, children, size = 12.5, color }) {
  return <div style={{ fontSize: size, lineHeight: 1.9, color: color || t.L2, fontWeight: 400 }}>{children}</div>;
}
function Risks({ t, items, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
      {items.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Dot n={i + 1} color={t.orange} bg={tint(t.orange, "22")} />
          <div style={{ minWidth: 0, flex: 1 }}>
            {r.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: t.L1, lineHeight: 1.6 }}><Inline text={r.title} /></div>}
            {r.body && <div style={{ fontSize: 12, lineHeight: 1.85, color: t.L2 }}><Inline text={r.body} /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}
function Steps({ t, items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: tint(t.blue, "0F"), border: `1px solid ${tint(t.blue, "26")}`, borderRadius: 14, padding: "10px 12px" }}>
          <Dot n={i + 1} color={t.blue} solid />
          <div style={{ minWidth: 0, flex: 1 }}>
            {s.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: t.L1, lineHeight: 1.6 }}><Inline text={s.title} /></div>}
            {s.body && <div style={{ fontSize: 12, lineHeight: 1.85, color: t.L2 }}><Inline text={s.body} /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}
function ArticleLink({ a, t, onGo, bg }) {
  if (!a) return null;
  const Tag = onGo ? "button" : "div";
  return (
    <Tag type={onGo ? "button" : undefined} onClick={onGo} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box", textAlign: "right", padding: "10px 12px", minHeight: 48, borderRadius: 12, border: `1px solid ${t.sepL}`, background: bg || t.surface, color: t.L1, fontFamily: "inherit", cursor: onGo ? "pointer" : "default" }}>
      <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: tint(t.blue, "18"), display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={16} color={t.blue} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>{a.title}</span>
        <span style={{ display: "block", fontSize: 10.5, color: t.L3 }}>مقال في قسم التعلّم</span>
      </span>
      {onGo && <ChevronLeft size={16} color={t.blue} />}
    </Tag>
  );
}
function Extras({ t, P }) {
  if (!P.rest.length) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{P.rest.map((p, i) => <Para key={i} t={t} size={12} color={t.L3}>{p}</Para>)}</div>;
}
const Intro = ({ t, P }) => (P.intro ? <Para t={t} size={12.5}>{P.intro}</Para> : null);

/* مخطط السيولة (يستخدمه التصميم ٨ للنص وللبطاقة) */
function Runway({ N, t }) {
  const be = N.be || null, run = N.runway;
  const maxM = Math.max(be || 0, run * 1.15, 3);
  const pc = (m) => Math.min(100, (m / maxM) * 100);
  const short = be && run < be;
  const rows = [
    { c: t.blue, l: "اليوم", v: `${fmt(N.budget)} ريال` },
    ...(run != null ? [{ c: short ? t.red : t.green, l: short ? "تنتهي الميزانية بعد" : "الميزانية تغطي التشغيل", v: fmtMonths(run) }] : []),
    ...(be ? [{ c: t.orange, l: "نقطة التعادل المتوقعة بعد", v: fmtMonths(be) }] : []),
    ...(N.m1 ? [{ c: "#E6A100", l: "إيراد أول شهر المتوقع", v: `${fmt(N.m1)} ريال` }] : []),
  ];
  const dot = (right, col, size = 16) => <span style={{ position: "absolute", right: `calc(${right}% - ${size / 2}px)`, top: "50%", marginTop: -size / 2, width: size, height: size, borderRadius: "50%", background: col, border: `3px solid ${t.surface}`, boxSizing: "border-box" }} />;
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 16, padding: "18px 16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div role="img" aria-label="خط زمني للسيولة بالأشهر" style={{ position: "relative", height: 22, margin: "0 6px" }}>
        <div style={{ position: "absolute", right: 0, left: 0, top: 5, height: 12, borderRadius: 6, background: t.F3 }} />
        <div style={{ position: "absolute", right: 0, width: `${pc(short ? run : be || run)}%`, top: 5, height: 12, borderRadius: 6, background: short ? t.blue : t.green }} />
        {short && <div style={{ position: "absolute", right: `${pc(run)}%`, width: `${pc(be) - pc(run)}%`, top: 5, height: 12, borderRadius: 6, background: `repeating-linear-gradient(135deg, ${t.red} 0, ${t.red} 5px, ${tint(t.red, "66")} 5px, ${tint(t.red, "66")} 10px)` }} />}
        {dot(0, t.blue)}
        {short && dot(pc(run), t.red)}
        {be && dot(pc(be), t.orange)}
        {N.m1 && maxM > 1.2 && <span style={{ position: "absolute", right: `calc(${pc(1)}% - 5px)`, top: "50%", marginTop: -5, width: 10, height: 10, borderRadius: "50%", background: "#E6A100", border: `2px solid ${t.surface}`, boxSizing: "border-box" }} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
            <span style={{ color: t.L3, flex: 1, minWidth: 0 }}>{r.l}</span>
            <b style={{ color: t.L1, fontVariantNumeric: "tabular-nums", textAlign: "left" }}>{r.v}</b>
          </div>
        ))}
      </div>
      {N.setup && <div style={{ borderTop: `1px solid ${t.sepL}`, paddingTop: 10, fontSize: 11, color: t.L3, lineHeight: 1.8 }}>الخط يفترض صرف الميزانية على التشغيل فقط، بدون احتساب تكاليف التأسيس ({fmt(N.setup)} ريال).</div>}
    </div>
  );
}

/* ═══ ١ — ملخّص تنفيذي ═══ */
function D1({ P, N, t, a, onGo }) {
  const c = N.score != null ? scoreColor(N.score, t) : t.blue;
  const dc = dtypeColor(N.dtype, N.score, t);
  const tiles = N.budget && N.setup && N.monthly ? [["ميزانيتك", N.budget, t.blue], ["تكلفة التأسيس", N.setup, t.red], ["التشغيل شهرياً", N.monthly, t.orange]] : null;
  return (
    <Shell t={t}>
      <Intro t={t} P={P} />
      {(N.score != null || P.problem) && (
        <div style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 16, padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
          {N.score != null && <Ring value={N.score} color={c} t={t} />}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            {N.decision && <Pill color={dc} bg={tint(dc, "1A")}>{N.decision}</Pill>}
            {P.problem && <div style={{ fontSize: 13.5, fontWeight: 700, color: t.L1, lineHeight: 1.6 }}>{P.problem.title || P.problem.body}</div>}
          </div>
        </div>
      )}
      {tiles && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {tiles.map(([l, v, col]) => (
            <div key={l} style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 14, padding: "9px 10px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: t.L3 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />{l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.L1, fontVariantNumeric: "tabular-nums", lineHeight: 1.5 }}>{fmt(v)}</div>
              <div style={{ fontSize: 10, color: t.L3 }}>ريال</div>
            </div>
          ))}
        </div>
      )}
      {P.problem && P.problem.title && P.problem.body && <Para t={t}>{P.problem.body}</Para>}
      {P.risks.length > 0 && <><Heading t={t}>مخاطر مرتبطة بالأرقام</Heading><Risks t={t} items={P.risks} /></>}
      {P.steps.length > 0 && <><Heading t={t}>خطوات عملية أنصحك بها</Heading><Steps t={t} items={P.steps} /></>}
      <ArticleLink a={a} t={t} onGo={onGo} />
      <Extras t={t} P={P} />
    </Shell>
  );
}

/* ═══ ٥ — محادثة مقسّمة ═══ */
const QUICK = ["اشرح لي نقطة التعادل", "كيف أخفّض تكلفة التأسيس؟", "ما أرخص نموذج للبدء؟"];
function Bubble({ t, label, color, children }) {
  return (
    <div style={{ background: tint(t.blue, "0F"), border: `1px solid ${tint(t.blue, "22")}`, borderRadius: "16px 5px 16px 16px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
      <span style={{ alignSelf: "flex-start" }}><Pill color={color} bg={tint(color, "1F")} size={11}>{label}</Pill></span>
      {children}
    </div>
  );
}
function QuickAsk({ t, items, onAsk }) {
  if (!onAsk || !items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 2 }}>
      {items.map((q) => (
        <button key={q} type="button" onClick={() => onAsk(q)} style={{ minHeight: 40, padding: "0 14px", borderRadius: 99, border: `1px solid ${tint(t.blue, "55")}`, background: "transparent", color: t.blue, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>
      ))}
    </div>
  );
}
function D5({ P, N, t, a, onGo, onAsk }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {(P.intro || P.problem) && (
        <Bubble t={t} label="المشكلة الأساسية" color={t.blue}>
          {P.intro && <Para t={t}>{P.intro}</Para>}
          {P.problem && (
            <Para t={t} size={13} color={t.L1}>
              {P.problem.title && <b>{P.problem.title}. </b>}{P.problem.body}
            </Para>
          )}
          {N.score != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: t.L3 }}>تقييم الجدوى</span>
              <span style={{ direction: "ltr", fontSize: 12, fontWeight: 800, color: t.L1, background: t.F3, borderRadius: 99, padding: "0 10px", fontVariantNumeric: "tabular-nums" }}>{N.score}/100</span>
              {N.decision && <Pill color={dtypeColor(N.dtype, N.score, t)} bg={tint(dtypeColor(N.dtype, N.score, t), "1A")} size={11}>{N.decision}</Pill>}
            </div>
          )}
        </Bubble>
      )}
      {P.risks.length > 0 && (
        <Bubble t={t} label="مخاطر مرتبطة بالأرقام" color={t.orange}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {P.risks.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: tint(t.orange, "22"), display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}><AlertTriangle size={13} color={t.orange} /></span>
                <div style={{ fontSize: 12.5, lineHeight: 1.85, color: t.L2, minWidth: 0 }}>{r.title && <b style={{ color: t.L1 }}>{r.title}. </b>}{r.body}</div>
              </div>
            ))}
          </div>
        </Bubble>
      )}
      {(P.steps.length > 0 || a) && (
        <Bubble t={t} label="خطوات عملية أنصحك بها" color={t.green}>
          {P.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Dot n={i + 1} color={t.green} bg={tint(t.green, "22")} size={26} />
              <div style={{ fontSize: 12.5, lineHeight: 1.85, color: t.L2, minWidth: 0 }}>{s.title && <b style={{ color: t.L1 }}>{s.title}. </b>}{s.body}</div>
            </div>
          ))}
          <ArticleLink a={a} t={t} onGo={onGo} />
        </Bubble>
      )}
      {P.rest.length > 0 && <Bubble t={t} label="ملاحظة" color={t.L3}>{P.rest.map((p, i) => <Para key={i} t={t}>{p}</Para>)}</Bubble>}
      <QuickAsk t={t} items={QUICK} onAsk={onAsk} />
    </div>
  );
}

/* ═══ ٨ — خط السيولة ═══ */
function D8({ P, N, t, a, onGo }) {
  return (
    <Shell t={t}>
      <Intro t={t} P={P} />
      <div>
        {P.problem && P.problem.title && <div style={{ fontSize: 11.5, fontWeight: 600, color: t.blue }}>{P.problem.title}</div>}
        <div style={{ fontSize: 17, fontWeight: 800, color: t.L1, lineHeight: 1.5 }}>كم تصمد ميزانيتك؟</div>
      </div>
      <Runway N={N} t={t} />
      {P.problem && P.problem.body && <Para t={t}>{P.problem.body}</Para>}
      {P.risks.length > 0 && <><Heading t={t}>مخاطر مرتبطة بالأرقام</Heading><Risks t={t} items={P.risks} compact /></>}
      {P.steps.length > 0 && <><Heading t={t}>خطوات عملية أنصحك بها</Heading><Steps t={t} items={P.steps} /></>}
      <ArticleLink a={a} t={t} onGo={onGo} />
      <Extras t={t} P={P} />
    </Shell>
  );
}

/* ═══ ٩ — تبويبات ═══ */
function TabBar({ t, tabs, tab, setTab }) {
  return (
    <div role="tablist" aria-label="أقسام الرد" style={{ display: "grid", gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, gap: 4, padding: 4, background: t.F4, borderRadius: 14 }}>
      {tabs.map((x) => {
        const on = tab === x.id;
        return (
          <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(x.id)} style={{ minHeight: 40, border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: on ? t.blue : "transparent", color: on ? "#fff" : t.L3 }}>
            {x.name}
            {x.n ? <span style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 99, padding: "0 7px", lineHeight: "17px", background: on ? "rgba(255,255,255,0.25)" : t.F3, color: on ? "#fff" : t.L2 }}>{x.n}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
function D9({ P, N, t, a, onGo }) {
  const tabs = [
    P.problem && { id: "problem", name: "المشكلة" },
    P.risks.length > 0 && { id: "risks", name: "المخاطر", n: P.risks.length },
    (P.steps.length > 0 || a) && { id: "steps", name: "الخطوات", n: P.steps.length || null },
  ].filter(Boolean);
  const [tab, setTab] = useState((tabs.find((x) => x.id === "risks") || tabs[0] || { id: "risks" }).id);
  const c = N.score != null ? scoreColor(N.score, t) : t.blue;
  const dc = dtypeColor(N.dtype, N.score, t);
  return (
    <Shell t={t} gap={12}>
      <Intro t={t} P={P} />
      {(N.score != null || P.problem) && (
        <div style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 14 }}>
          {N.score != null && (
            <div style={{ flexShrink: 0, textAlign: "center", direction: "ltr", lineHeight: 1.1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.L1, fontVariantNumeric: "tabular-nums" }}>{N.score}<span style={{ fontSize: 11, fontWeight: 500, color: t.L3 }}>/100</span></div>
              <div style={{ height: 5, width: 64, borderRadius: 3, background: t.F3, marginTop: 5, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${N.score}%`, background: c, borderRadius: 3 }} /></div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
            {N.decision && <Pill color={dc} bg={tint(dc, "1A")} size={11}>{N.decision}</Pill>}
            {P.problem && <div style={{ fontSize: 12.5, color: t.L2, lineHeight: 1.7 }}>{P.problem.title || P.problem.body}</div>}
          </div>
        </div>
      )}
      <TabBar t={t} tabs={tabs} tab={tab} setTab={setTab} />
      <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tab === "problem" && P.problem && (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.L1, lineHeight: 1.6 }}>{P.problem.title ? `المشكلة الأساسية: ${P.problem.title}` : "المشكلة الأساسية"}</div>
            {P.problem.body && <Para t={t} size={13}>{P.problem.body}</Para>}
            {N.budget && N.setup && (
              <div style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[["ميزانيتك الحالية", N.budget, t.blue, Math.min(100, (N.budget / N.setup) * 100)], ["تكلفة التأسيس المقدّرة", N.setup, t.F3 && t.L3, 100]].map(([l, v, col, w]) => (
                  <div key={l}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: t.L3 }}>{l}</span><b style={{ color: t.L1, fontVariantNumeric: "tabular-nums" }}>{fmt(v)} ريال</b></div>
                    <div style={{ height: 8, borderRadius: 4, background: t.F3, marginTop: 5, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${w}%`, background: col, borderRadius: 4, opacity: col === t.L3 ? 0.5 : 1 }} /></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "risks" && <Risks t={t} items={P.risks} />}
        {tab === "steps" && (<><Steps t={t} items={P.steps} /><ArticleLink a={a} t={t} onGo={onGo} /></>)}
      </div>
      <Extras t={t} P={P} />
    </Shell>
  );
}

/* ═══ ١٠ — ورقة التقرير (ورقة فاتحة بألوان ثابتة في الوضعين) ═══ */
const PAPER = { bg: "#F1F3F8", ink: "#0F1B33", muted: "#34456A", faint: "#4A5B7D", line: "#D3D9E6", seg: "#D9DFEB", red: "#B43D3D", segRed: "#C9453F", amber: "#8A5A00", blue: "#2A56B8", green: "#1E7A46", tintBlue: "#E1E8F7" };
function paperRows(N) {
  return [
    N.budget && ["ميزانيتك الحالية", `${fmt(N.budget)} ريال`],
    N.setup && ["تكلفة التأسيس المقدّرة", `${fmt(N.setup)} ريال`],
    N.coverage != null && ["نسبة تغطية التأسيس", `${N.coverage}%`, N.coverage < 50 ? PAPER.red : null],
    N.monthly && ["مصاريف التشغيل الشهرية", `${fmt(N.monthly)} ريال`],
    N.m1 && ["إيراد أول شهر المتوقع", `${fmt(N.m1)} ريال`],
    N.runway != null && ["مدة صمود الميزانية", fmtMonths(N.runway)],
    N.be && ["نقطة التعادل", `بعد ${fmtMonths(N.be)}`],
  ].filter(Boolean);
}
function PaperH({ children }) { return <div style={{ fontSize: 14, fontWeight: 800, color: PAPER.ink, paddingBottom: 7, borderBottom: `2px solid ${PAPER.ink}` }}>{children}</div>; }
function PaperNum({ n, bg }) { return <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: bg, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>{n}</span>; }
function PaperScore({ sc, stampC }) {
  const filled = sc != null ? sc / 10 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: PAPER.muted }}>تقييم الجدوى</span>
        <span style={{ direction: "ltr", fontSize: 19, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{sc}<span style={{ fontSize: 12, fontWeight: 500, color: PAPER.faint }}>/100</span></span>
      </div>
      <div role="img" aria-label={`${sc} من 100`} style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gap: 3 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const f = Math.max(0, Math.min(1, filled - i));
          return <div key={i} style={{ height: 11, borderRadius: 3, background: PAPER.seg, position: "relative", overflow: "hidden" }}>{f > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${f * 100}%`, background: stampC === PAPER.green ? PAPER.green : PAPER.segRed }} />}</div>;
        })}
      </div>
    </div>
  );
}
function PaperReco({ steps, a, onGo }) {
  return (
    <div style={{ background: PAPER.tintBlue, borderRadius: 14, padding: "14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: PAPER.ink }}>التوصيات</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.85, color: "#24365C" }}>
          <PaperNum n={i + 1} bg={PAPER.blue} />
          <div style={{ minWidth: 0 }}>{s.title && <b style={{ color: PAPER.ink }}><Inline text={s.title} />{s.body ? ". " : ""}</b>}<Inline text={s.body} /></div>
        </div>
      ))}
      {a && (
        <button type="button" onClick={onGo || undefined} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box", textAlign: "right", minHeight: 46, padding: "8px 12px", borderRadius: 11, border: "none", background: "#fff", color: "#1D3F8F", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: onGo ? "pointer" : "default" }}>
          <BookOpen size={16} color={PAPER.blue} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, lineHeight: 1.6 }}>اقرأ: {a.title}</span>
          {onGo && <ChevronLeft size={16} color={PAPER.blue} style={{ flexShrink: 0 }} />}
        </button>
      )}
    </div>
  );
}
function D10({ P, N, t, a, onGo }) {
  const sc = N.score;
  const stampC = /pos/i.test(N.dtype) ? PAPER.green : /neg/i.test(N.dtype) ? PAPER.red : sc != null ? (sc >= 75 ? PAPER.green : sc >= 60 ? PAPER.amber : PAPER.red) : PAPER.blue;
  const rows = paperRows(N);
  return (
    <div style={{ width: "100%", boxSizing: "border-box", background: PAPER.bg, color: PAPER.ink, border: `1px solid ${PAPER.line}`, borderRadius: 18, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
      {P.intro && <div style={{ fontSize: 12.5, lineHeight: 1.9, color: PAPER.muted }}>{P.intro}</div>}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: PAPER.faint }}>تقرير جدوى مبدئي</div>
          <div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.5 }}>{N.idea || "مشروعك"}{N.city ? ` · ${N.city}` : ""}</div>
        </div>
        {N.decision && <div style={{ flexShrink: 0, maxWidth: "46%", transform: "rotate(-4deg)", border: `2px solid ${stampC}`, color: stampC, borderRadius: 9, padding: "1px 10px", fontSize: 12, fontWeight: 800, lineHeight: 1.6, textAlign: "center", marginTop: 2 }}>{N.decision}</div>}
      </div>
      {sc != null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <PaperScore sc={sc} stampC={stampC} />
          {P.problem && (P.problem.title || P.problem.body) && <div style={{ fontSize: 12.5, color: PAPER.muted, lineHeight: 1.8 }}>المشكلة الأساسية: <b style={{ color: PAPER.ink }}>{P.problem.title || P.problem.body}</b></div>}
        </div>
      )}
      {rows.length > 0 && (
        <div>
          <PaperH>الأرقام المعتمدة</PaperH>
          {rows.map(([l, v, col], i) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", fontSize: 12.5, borderBottom: i < rows.length - 1 ? `1px solid ${PAPER.line}` : "none" }}>
              <span style={{ color: PAPER.muted }}>{l}</span>
              <b style={{ color: col || PAPER.ink, fontVariantNumeric: "tabular-nums", textAlign: "left" }}>{v}</b>
            </div>
          ))}
        </div>
      )}
      {P.problem && P.problem.title && P.problem.body && <div style={{ fontSize: 12.5, lineHeight: 1.9, color: PAPER.muted }}>{P.problem.body}</div>}
      {P.risks.length > 0 && (
        <div>
          <PaperH>ملاحظات المخاطر</PaperH>
          {P.risks.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < P.risks.length - 1 ? `1px solid ${PAPER.line}` : "none" }}>
              <PaperNum n={i + 1} bg={PAPER.amber} />
              <div style={{ fontSize: 12.5, lineHeight: 1.85, color: PAPER.muted, minWidth: 0 }}>{r.title && <b style={{ color: PAPER.ink }}>{r.title}. </b>}{r.body}</div>
            </div>
          ))}
        </div>
      )}
      {(P.steps.length > 0 || a) && <PaperReco steps={P.steps} a={a} onGo={onGo} />}
      {P.rest.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{P.rest.map((p, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.85, color: PAPER.faint }}>{p}</div>)}</div>}
    </div>
  );
}

/* ═══════════════ تصاميم البطاقة (§CARD§) ═══════════════ */
const RANK = { high: 3, mid: 2, info: 1, low: 0 };
const worstLevel = (chips) => chips.reduce((w, c) => (RANK[c.level] > RANK[w] ? c.level : w), chips.length ? chips[0].level : "info");
const levelColor = (l, t) => (l === "high" ? t.red : l === "mid" ? t.orange : l === "low" ? t.green : t.blue);
const paperLevel = (l) => (l === "high" ? PAPER.red : l === "mid" ? PAPER.amber : l === "low" ? PAPER.green : PAPER.blue);

const NUM_ONLY = /^[\s\-−+~≈<>]*[0-9٠-٩][0-9٠-٩.,٬٫\s]*(?:%|٪)?$/;
const isNeg = (v) => /^\s*[-−–]\s*[0-9٠-٩]/.test(String(v));
const MONEY_LABEL = /مصروف|رصيد|ميزاني|تكلف|إيراد|ايراد|ربح|أرباح|ارباح|دخل|راتب|إيجار|ايجار|رأس|راس المال|سعر|مبيع|تمويل|سيول|عجز|نقد|مدخر|قرض|دين|التزام|رسوم|مبلغ|إنفاق|انفاق|صرف|متبقي|مطلوب|دفعة|عائد|خسار/;
const NOT_MONEY = /نسبة|عدد|مدة|عميل|زبون|موظف|عامل|%|٪|مرة|فرع|متر|سنة|سنوات|يوم|أيام|ايام/;
function unitOf(label, value) {
  const v = String(value);
  if (!/^[\s\-−+~≈]*[0-9٠-٩][0-9٠-٩.,٬٫\s]*$/.test(v)) return "";          // فيه كلمة أو % — عنده وحدة
  return MONEY_LABEL.test(label) && !NOT_MONEY.test(label) ? "ريال" : "";
}
function Val({ v }) { return NUM_ONLY.test(String(v)) ? <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{v}</span> : <Inline text={v} />; }
const shorten = (s, n) => { const x = String(s || "").trim(); return x.length > n ? x.slice(0, n - 1).trim() + "…" : x; };

function Chips({ items, colorOf, size = 11.5 }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((c, i) => {
        const col = colorOf(c.level);
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: size, fontWeight: 700, color: col, background: tint(col, "1A"), border: `1px solid ${tint(col, "33")}`, borderRadius: 99, padding: "2px 11px 2px 10px", lineHeight: 1.6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />{c.text}
          </span>
        );
      })}
    </div>
  );
}
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useIso(() => {
    const n = ref.current;
    if (!n) return undefined;
    const set = () => setW(Math.round(n.getBoundingClientRect().width));
    set();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(n);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
// أرقام الرد: مربعات إذا تكفي المساحة، وإلا قائمة صفوف (تبقى الأرقام الطويلة مقروءة بكل الأحجام)
function StatTiles({ t, stats }) {
  const [ref, w] = useWidth();
  const n = stats.length;
  const longest = Math.max(...stats.map((s) => String(s.value).length));
  const need = 92 + Math.max(0, longest - 6) * 8.5;
  const fit = Math.floor((w + 8) / (need + 8));
  const cols = n === 1 ? 1 : n <= 3 && fit >= n ? n : n === 4 && fit >= 2 ? 2 : n === 6 && fit >= 3 ? 3 : 0;
  return (
    <div ref={ref}>
      {w > 0 && cols > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 }}>
          {stats.map((s, i) => {
            const neg = isNeg(s.value), unit = unitOf(s.label, s.value), len = String(s.value).length;
            return (
              <div key={i} style={{ background: t.surface, border: `1px solid ${neg ? tint(t.red, "44") : t.sepL}`, borderRadius: 14, padding: "10px 11px 9px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 10.5, color: t.L3, lineHeight: 1.55 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: neg ? t.red : t.blue, flexShrink: 0, marginTop: 5 }} />
                  <span style={{ minWidth: 0 }}>{s.label}</span>
                </div>
                <div>
                  <div style={{ fontSize: len > 10 ? 14 : len > 7 ? 15.5 : 17, fontWeight: 800, color: neg ? t.red : t.L1, fontVariantNumeric: "tabular-nums", lineHeight: 1.5, whiteSpace: "nowrap" }}><Val v={s.value} /></div>
                  {unit && <div style={{ fontSize: 10, color: t.L3 }}>{unit}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 14, padding: "2px 12px" }}>
          {stats.map((s, i) => {
            const neg = isNeg(s.value), unit = unitOf(s.label, s.value);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderTop: i ? `1px solid ${t.sepL}` : "none" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: neg ? t.red : t.blue, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: t.L3, lineHeight: 1.6 }}>{s.label}</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: neg ? t.red : t.L1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", textAlign: "left" }}>
                  <Val v={s.value} />{unit && <span style={{ fontSize: 10.5, fontWeight: 500, color: t.L3, marginInlineStart: 5 }}>{unit}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function StatusBox({ C, t }) {
  if (!C.chips.length && !C.status) return null;
  const accent = levelColor(worstLevel(C.chips), t);
  return (
    <div style={{ position: "relative", overflow: "hidden", background: t.surface, border: `1px solid ${t.sepL}`, borderRadius: 16, padding: "12px 18px 12px 14px", display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
      <span aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0, width: 4, background: accent }} />
      <Chips items={C.chips} colorOf={(l) => levelColor(l, t)} />
      {C.status && <div style={{ fontSize: 13, fontWeight: 600, color: t.L1, lineHeight: 1.85 }}><Inline text={C.status} /></div>}
    </div>
  );
}
const CIntro = ({ t, C }) => (C.head ? <Para t={t} size={12.5}>{C.head}</Para> : null);
function CExtras({ t, C }) {
  if (!C.tail.length) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{C.tail.map((p, i) => <Para key={i} t={t} size={12} color={t.L3}>{p}</Para>)}</div>;
}
const stepsTitle = (n) => (n > 1 ? "خطوات عملية أنصحك بها" : "الخطوة اللي أنصحك بها");

/* ═══ بطاقة ١ — ملخّص ═══ */
function Card1({ C, t, a, onGo }) {
  return (
    <Shell t={t}>
      <CIntro t={t} C={C} />
      <StatusBox C={C} t={t} />
      {C.stats.length > 0 && <StatTiles t={t} stats={C.stats} />}
      {C.risks.length > 0 && <><Heading t={t}>نقاط الانتباه</Heading><Risks t={t} items={C.risks} compact /></>}
      {C.steps.length > 0 && <><Heading t={t}>{stepsTitle(C.steps.length)}</Heading><Steps t={t} items={C.steps} /></>}
      <ArticleLink a={a} t={t} onGo={onGo} />
      <CExtras t={t} C={C} />
    </Shell>
  );
}

/* ═══ بطاقة ٥ — محادثة ═══ */
function Card5({ C, t, a, onGo, onAsk }) {
  const accent = levelColor(worstLevel(C.chips), t);
  const first = C.steps[0] && (C.steps[0].title || C.steps[0].body);
  const quick = [first ? `كيف أنفّذ: ${shorten(first, 34)}؟` : null, C.stats.length ? "اشرح لي هذه الأرقام" : null, "وش البديل الأرخص؟"].filter(Boolean);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {(C.head || C.chips.length > 0 || C.status) && (
        <Bubble t={t} label="الوضع الحالي" color={accent}>
          {C.head && <Para t={t}>{C.head}</Para>}
          <Chips items={C.chips} colorOf={(l) => levelColor(l, t)} />
          {C.status && <Para t={t} size={13} color={t.L1}><Inline text={C.status} /></Para>}
        </Bubble>
      )}
      {C.stats.length > 0 && <Bubble t={t} label="أرقام تهمّك" color={t.orange}><StatTiles t={t} stats={C.stats} /></Bubble>}
      {C.risks.length > 0 && <Bubble t={t} label="نقاط الانتباه" color={t.orange}><Risks t={t} items={C.risks} compact /></Bubble>}
      {(C.steps.length > 0 || a) && (
        <Bubble t={t} label={C.steps.length > 1 ? "خطواتك الجاية" : "خطوتك الجاية"} color={t.green}>
          {C.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Dot n={i + 1} color={t.green} bg={tint(t.green, "22")} size={26} />
              <div style={{ fontSize: 12.5, lineHeight: 1.85, color: t.L2, minWidth: 0 }}>{s.title && <b style={{ color: t.L1 }}><Inline text={s.title} />{s.body ? ". " : ""}</b>}<Inline text={s.body} /></div>
            </div>
          ))}
          <ArticleLink a={a} t={t} onGo={onGo} />
        </Bubble>
      )}
      {C.tail.length > 0 && <Bubble t={t} label="ملاحظة" color={t.L3}>{C.tail.map((p, i) => <Para key={i} t={t}>{p}</Para>)}</Bubble>}
      <QuickAsk t={t} items={quick} onAsk={onAsk} />
    </div>
  );
}

/* ═══ بطاقة ٨ — خط السيولة ═══ */
function Card8({ C, N, t, a, onGo }) {
  return (
    <Shell t={t}>
      <CIntro t={t} C={C} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.L1, lineHeight: 1.5 }}>كم تصمد ميزانيتك؟</div>
        <Chips items={C.chips} colorOf={(l) => levelColor(l, t)} />
        {C.status && <Para t={t} size={12.5}><Inline text={C.status} /></Para>}
      </div>
      {C.stats.length > 0 && <StatTiles t={t} stats={C.stats} />}
      <Runway N={N} t={t} />
      {C.risks.length > 0 && <><Heading t={t}>نقاط الانتباه</Heading><Risks t={t} items={C.risks} compact /></>}
      {C.steps.length > 0 && <><Heading t={t}>{stepsTitle(C.steps.length)}</Heading><Steps t={t} items={C.steps} /></>}
      <ArticleLink a={a} t={t} onGo={onGo} />
      <CExtras t={t} C={C} />
    </Shell>
  );
}

/* ═══ بطاقة ٩ — تبويبات ═══ */
function Card9({ C, t, a, onGo }) {
  const tabs = [
    C.stats.length > 0 && { id: "stats", name: "الأرقام", n: C.stats.length },
    (C.steps.length > 0 || a) && { id: "steps", name: "الخطوات", n: C.steps.length || null },
    C.risks.length > 0 && { id: "risks", name: "الانتباه", n: C.risks.length },
  ].filter(Boolean);
  const [tab, setTab] = useState((tabs.find((x) => x.id === "steps") || tabs[0] || { id: "steps" }).id);
  const cur = tabs.length < 2 ? (tabs[0] ? tabs[0].id : "") : tab;
  return (
    <Shell t={t} gap={12}>
      <CIntro t={t} C={C} />
      <StatusBox C={C} t={t} />
      {tabs.length > 1 && <TabBar t={t} tabs={tabs} tab={tab} setTab={setTab} />}
      <div role={tabs.length > 1 ? "tabpanel" : undefined} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cur === "stats" && <StatTiles t={t} stats={C.stats} />}
        {cur === "risks" && <Risks t={t} items={C.risks} />}
        {cur === "steps" && (<>{C.steps.length > 0 && <Steps t={t} items={C.steps} />}<ArticleLink a={a} t={t} onGo={onGo} /></>)}
      </div>
      <CExtras t={t} C={C} />
    </Shell>
  );
}

/* ═══ بطاقة ١٠ — ورقة التقرير ═══ */
function Card10({ C, N, t, a, onGo }) {
  const sc = N.score, wl = worstLevel(C.chips);
  const stampC = N.decision
    ? (/pos/i.test(N.dtype) ? PAPER.green : /neg/i.test(N.dtype) ? PAPER.red : sc != null ? (sc >= 75 ? PAPER.green : sc >= 60 ? PAPER.amber : PAPER.red) : PAPER.blue)
    : paperLevel(wl);
  const stamp = N.decision || ((wl === "high" || wl === "mid") && (C.chips.find((c) => c.level === wl) || {}).text) || "";
  const rows = C.stats.length ? C.stats.map((s) => [s.label, `${s.value}${unitOf(s.label, s.value) ? " " + unitOf(s.label, s.value) : ""}`, isNeg(s.value) ? PAPER.red : null]) : paperRows(N);
  return (
    <div style={{ width: "100%", boxSizing: "border-box", background: PAPER.bg, color: PAPER.ink, border: `1px solid ${PAPER.line}`, borderRadius: 18, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
      {C.head && <div style={{ fontSize: 12.5, lineHeight: 1.9, color: PAPER.muted }}>{C.head}</div>}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: PAPER.faint }}>تقرير المستشار</div>
          <div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.5 }}>{N.idea || "مشروعك"}{N.city ? ` · ${N.city}` : ""}</div>
        </div>
        {stamp && <div style={{ flexShrink: 0, maxWidth: "46%", transform: "rotate(-4deg)", border: `2px solid ${stampC}`, color: stampC, borderRadius: 9, padding: "1px 10px", fontSize: 12, fontWeight: 800, lineHeight: 1.6, textAlign: "center", marginTop: 2 }}>{stamp}</div>}
      </div>
      {sc != null && <PaperScore sc={sc} stampC={stampC} />}
      {(C.status || C.chips.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {C.status && <div style={{ fontSize: 12.5, color: PAPER.muted, lineHeight: 1.85 }}>الحالة: <b style={{ color: PAPER.ink }}><Inline text={C.status} /></b></div>}
          <Chips items={C.chips} colorOf={paperLevel} size={11} />
        </div>
      )}
      {rows.length > 0 && (
        <div>
          <PaperH>الأرقام المعتمدة</PaperH>
          {rows.map(([l, v, col], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "8px 0", fontSize: 12.5, borderBottom: i < rows.length - 1 ? `1px solid ${PAPER.line}` : "none" }}>
              <span style={{ color: PAPER.muted }}>{l}</span>
              <b style={{ color: col || PAPER.ink, fontVariantNumeric: "tabular-nums", textAlign: "left" }}><Val v={v} /></b>
            </div>
          ))}
        </div>
      )}
      {C.risks.length > 0 && (
        <div>
          <PaperH>ملاحظات المخاطر</PaperH>
          {C.risks.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < C.risks.length - 1 ? `1px solid ${PAPER.line}` : "none" }}>
              <PaperNum n={i + 1} bg={PAPER.amber} />
              <div style={{ fontSize: 12.5, lineHeight: 1.85, color: PAPER.muted, minWidth: 0 }}>{r.title && <b style={{ color: PAPER.ink }}>{r.title}{r.body ? ". " : ""}</b>}<Inline text={r.body} /></div>
            </div>
          ))}
        </div>
      )}
      {(C.steps.length > 0 || a) && <PaperReco steps={C.steps} a={a} onGo={onGo} />}
      {C.tail.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{C.tail.map((p, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.85, color: PAPER.faint }}>{p}</div>)}</div>}
    </div>
  );
}

/* ═══ الفقاعة العادية (للردود القصيرة أو غير المقسّمة) ═══ */
function Plain({ text, t }) {
  return (
    <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: 14, fontSize: 12.5, lineHeight: 1.8, fontWeight: 300, whiteSpace: "pre-wrap", background: tint(t.blue, "0F"), border: `1px solid ${tint(t.blue, "22")}`, color: t.L1 }}>{text}</div>
  );
}

/* ═══ اختيار التصميم الأنسب تلقائياً حسب نوع الرد ═══
   ١٠ تقرير  ← السؤال يطلب تقرير أو ملخصاً شاملاً
   ٨ سيولة   ← السؤال/الرد عن الميزانية والتشغيل والتعادل ولدينا أرقام المشروع
   ٩ تبويبات ← الرد طويل (٣ خطوات فأكثر أو نص طويل)
   ١ ملخّص   ← حالة + أرقام (الوضع العادي للبطاقة)
   ٥ محادثة  ← ردود أخف أو ناقصة الأقسام                          */
const MONEY_WORDS = ["ميزاني", "تمويل", "سيولة", "تشغيل", "تعادل", "تكلف", "رأس المال", "ريال", "عجز", "إيراد"];
const REPORT_Q = /تقرير|ملخص|خلاصة|خلاص|لخّص|لخص|شامل|كامل/;
export function pickLayout(P, N, question) {
  const q = String(question || "");
  if (REPORT_Q.test(q)) return 10;
  const money = MONEY_WORDS.filter((w) => P.raw.includes(w)).length;
  if (N.budget && N.monthly && money >= 3) return 8;
  const items = (P.problem ? 1 : 0) + P.risks.length + P.steps.length;
  if (items >= 6 || P.raw.length > 1100) return 9;
  if (P.problem && (P.risks.length > 0 || P.steps.length > 0)) return 1;
  return 5;
}
const LIQ_Q = /تكفي|تصمد|تغطي|التعادل|السيولة|سيولة|كم شهر|متى (?:أربح|اربح|أرجع|ارجع|أسترد|استرد)|مدة الميزانية/;
const LIQ_T = /سيولة|تعادل|ميزاني|رصيد|تشغيل/;
export function pickCardLayout(C, N, question) {
  const q = String(question || "");
  if (REPORT_Q.test(q)) return 10;
  if (N.budget && N.monthly && (LIQ_Q.test(q) || (!C.stats.length && LIQ_T.test(C.raw)))) return 8;
  if (C.steps.length >= 3 || C.raw.length > 650) return 9;
  if (C.stats.length >= 2 || C.chips.length >= 2) return 1;
  return 5;
}

/* ═══ المدخل ═══ */
export default function AdvisorReply({ text, result, question, layout, t, articles, onAsk, onGoLearning }) {
  const C = useMemo(() => parseCard(text), [text]);
  const P0 = useMemo(() => (C ? null : parseReply(text)), [text, C]);
  const N = useMemo(() => numbersFrom(result), [result]);
  const art = useMemo(() => (C ? articleFor(C, articles) : findArticle(text, articles)), [text, articles, C]);
  const P = useMemo(() => {
    if (!P0 || !art) return P0;
    const fix = (x) => ({ ...x, body: dropMention(x.body, art.title) });
    return { ...P0, steps: P0.steps.map(fix).filter((x) => x.title || x.body), rest: P0.rest.map((r) => dropMention(r, art.title)).filter(Boolean) };
  }, [P0, art]);
  const go = onGoLearning ? () => onGoLearning(art || null) : undefined;
  const canRunway = !!(N.budget && N.monthly);
  const box = { width: "100%", maxWidth: 680, minWidth: 0 };

  if (C) {
    const want = layout || pickCardLayout(C, N, question);
    const L = want === 8 && !canRunway ? 1 : want;
    const props = { C, N, t, a: art, onGo: go, onAsk };
    return (
      <div style={box}>
        {L === 5 ? <Card5 {...props} /> : L === 8 ? <Card8 {...props} /> : L === 9 ? <Card9 {...props} /> : L === 10 ? <Card10 {...props} /> : <Card1 {...props} />}
      </div>
    );
  }
  if (!P0.ok) return <Plain text={String(text || "").replace(CARD_MARK, "").trim()} t={t} />;
  const want = layout || pickLayout(P0, N, question);
  const L = want === 8 && !canRunway ? 1 : want;
  const props = { P, N, t, a: art, onGo: go, onAsk };
  return (
    <div style={box}>
      {L === 5 ? <D5 {...props} /> : L === 8 ? <D8 {...props} /> : L === 9 ? <D9 {...props} /> : L === 10 ? <D10 {...props} /> : <D1 {...props} />}
    </div>
  );
}
