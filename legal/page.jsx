"use client";
import { useState } from "react";
import { ChevronRight, FileText, Shield, RotateCcw, Mail } from "lucide-react";

const C = {
  bg: "#F7F8FA", surface: "#FFFFFF", L1: "#0B1320", L2: "#3C4757",
  L3: "#6B7685", L4: "#9AA3B0", sep: "#E5E8ED", blue: "#007AFF"
};

const CONTACT_EMAIL = "hamoorservice@gmail.com";
const APP_NAME = "هامور";
const COMPANY = "هامور لدراسات الجدوى";
const LAST_UPDATED = "2 يوليو 2026";

const TABS = [
  { id: "terms", label: "شروط الاستخدام", Icon: FileText },
  { id: "privacy", label: "سياسة الخصوصية", Icon: Shield },
  { id: "refund", label: "الاسترجاع والإلغاء", Icon: RotateCcw }
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: C.L1, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 2, color: C.L2 }}>{children}</div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <span style={{ color: C.blue, flexShrink: 0, marginTop: 1 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

export default function LegalPage() {
  const [tab, setTab] = useState("terms");

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>

        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue, fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}>
          <ChevronRight size={16} style={{ transform: "scaleX(-1)" }} />
          العودة للتطبيق
        </a>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.L1, marginBottom: 6 }}>الشروط والسياسات</h1>
        <p style={{ fontSize: 13, color: C.L3, marginBottom: 24 }}>آخر تحديث: {LAST_UPDATED}</p>

        <div style={{ display: "flex", gap: 6, background: "#EDEFF3", borderRadius: 12, padding: 4, marginBottom: 26, overflowX: "auto" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                flex: "none", display: "flex", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap",
                background: tab === id ? C.surface : "transparent",
                color: tab === id ? C.blue : C.L3,
                fontWeight: tab === id ? 700 : 500,
                boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        <div style={{ background: C.surface, borderRadius: 18, padding: "26px 22px", border: `1px solid ${C.sep}` }}>

          {tab === "terms" && (
            <>
              <Section title="1. التعريف بالخدمة">
                {APP_NAME} تطبيق يقدّم دراسات جدوى استرشادية للمشاريع في السوق السعودي، مبنية على تحليل بالذكاء الاصطناعي ونتائج بحث من مصادر عامة على الإنترنت.
              </Section>

              <Section title="2. طبيعة المخرجات — تنبيه مهم">
                <Bullet>التحليل الذي يقدّمه {APP_NAME} <b>أداة استرشادية للتفكير واتخاذ قرار مبدئي</b>، وليس دراسة جدوى ميدانية معتمدة.</Bullet>
                <Bullet>الأرقام تقديرية ومبنية على متوسطات السوق ونتائج بحث آلي، وقد تختلف عن الواقع الفعلي.</Bullet>
                <Bullet>لا يُغني هذا التحليل عن استشارة مختص أو دراسة ميدانية قبل أي قرار استثماري.</Bullet>
                <Bullet>{COMPANY} غير مسؤول عن أي قرار استثماري أو خسارة مالية تُتخذ بناءً على مخرجات التطبيق.</Bullet>
              </Section>

              <Section title="3. الحساب والاستخدام">
                <Bullet>يلتزم المستخدم بتقديم بيانات صحيحة عند التسجيل، ويتحمل مسؤولية الحفاظ على سرية بيانات دخوله.</Bullet>
                <Bullet>الحساب شخصي وغير قابل للمشاركة أو النقل للغير.</Bullet>
                <Bullet>يُمنع استخدام التطبيق لأي غرض مخالف للأنظمة السعودية، أو إعادة بيع مخرجاته كخدمة تجارية دون إذن كتابي.</Bullet>
                <Bullet>يحق لنا إيقاف أي حساب يُستخدم بشكل مخالف لهذه الشروط.</Bullet>
              </Section>

              <Section title="4. الباقات والاشتراك">
                <Bullet><b>الباقة المجانية:</b> تحليلان اثنان، مع وصول محدود للمقالات.</Bullet>
                <Bullet><b>الاشتراك الشهري:</b> 19.99 ريال، صالح لمدة 30 يوماً من تاريخ التفعيل.</Bullet>
                <Bullet><b>الاشتراك السنوي:</b> 199.99 ريال، صالح لمدة 365 يوماً من تاريخ التفعيل.</Bullet>
                <Bullet>الاشتراك يتيح تحليلات بلا حدود، وفتح كامل المقالات وقسم الاقتراحات.</Bullet>
                <Bullet>الأسعار شاملة ضريبة القيمة المضافة حسب الأنظمة المعمول بها.</Bullet>
              </Section>

              <Section title="5. الملكية الفكرية">
                جميع حقوق التطبيق وتصميمه ومحتواه مملوكة لـ {COMPANY}. أما التحليلات الناتجة عن مشاريعك فهي ملكك، ولك حرية استخدامها لأغراضك الخاصة.
              </Section>

              <Section title="6. تعديل الشروط">
                قد نحدّث هذه الشروط من وقت لآخر. الاستمرار في استخدام التطبيق بعد التحديث يُعدّ موافقة على النسخة المحدّثة.
              </Section>

              <Section title="7. الاختصاص القضائي">
                تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وأي نزاع يُحال للجهات القضائية المختصة فيها.
              </Section>
            </>
          )}

          {tab === "privacy" && (
            <>
              <Section title="1. البيانات التي نجمعها">
                <Bullet><b>بيانات الحساب:</b> البريد الإلكتروني والاسم (إن أدخلته).</Bullet>
                <Bullet><b>بيانات التحليلات:</b> فكرة المشروع، المدينة، الميزانية، والمعطيات التي تدخلها، ونتائج التحليل.</Bullet>
                <Bullet><b>بيانات الاشتراك:</b> نوع الباقة وتاريخ التفعيل والانتهاء.</Bullet>
                <Bullet><b>لا نجمع بيانات بطاقتك البنكية إطلاقاً</b> — عملية الدفع تتم بالكامل عبر بوابة دفع مرخّصة من البنك المركزي السعودي، ولا تمرّ بياناتك المالية عبر خوادمنا.</Bullet>
              </Section>

              <Section title="2. كيف نستخدم بياناتك">
                <Bullet>لتشغيل التطبيق وحفظ تحليلاتك وعرضها لك عند تسجيل الدخول من أي جهاز.</Bullet>
                <Bullet>لإدارة اشتراكك والتحقق من صلاحيته.</Bullet>
                <Bullet>لتحسين جودة التحليل ودقة البيانات بشكل عام.</Bullet>
                <Bullet>لا نبيع بياناتك ولا نشاركها مع معلنين.</Bullet>
              </Section>

              <Section title="3. أطراف تقنية نستعين بها">
                لتشغيل الخدمة نستخدم مزوّدين تقنيين لحفظ البيانات ومعالجة التحليل والاستضافة والدفع. تُعالج البيانات لديهم وفق سياسات الخصوصية الخاصة بهم، وبالقدر اللازم لتشغيل الخدمة فقط.
              </Section>

              <Section title="4. حفظ البيانات وأمانها">
                <Bullet>تُحفظ بياناتك في قاعدة بيانات محمية بكلمة مرور مشفّرة.</Bullet>
                <Bullet>الاتصال بالتطبيق مشفّر بالكامل عبر HTTPS.</Bullet>
                <Bullet>نحتفظ ببياناتك ما دام حسابك نشطاً.</Bullet>
              </Section>

              <Section title="5. حقوقك">
                <Bullet>الوصول إلى بياناتك ومراجعتها في أي وقت من داخل التطبيق.</Bullet>
                <Bullet>حذف أي تحليل من حسابك.</Bullet>
                <Bullet>طلب حذف حسابك وكامل بياناتك بالتواصل معنا على {CONTACT_EMAIL}.</Bullet>
              </Section>

              <Section title="6. خصوصية الأطفال">
                الخدمة موجّهة لمن أتمّ 18 عاماً. لا نجمع بيانات عن قصد ممن هم دون هذه السن.
              </Section>

              <Section title="7. التواصل">
                لأي استفسار يخص الخصوصية: {CONTACT_EMAIL}
              </Section>
            </>
          )}

          {tab === "refund" && (
            <>
              <Section title="1. تفعيل الاشتراك">
                يُفعّل الاشتراك مباشرة بعد نجاح عملية الدفع. إن خُصم المبلغ ولم يُفعّل الاشتراك خلال ساعة، تواصل معنا على {CONTACT_EMAIL} وسنعالج الأمر خلال يوم عمل واحد.
              </Section>

              <Section title="2. سياسة الاسترجاع">
                <Bullet><b>خلال 24 ساعة من الاشتراك:</b> يحق لك طلب استرداد كامل المبلغ بشرط ألا تكون قد أجريت أي تحليل جديد بعد التفعيل.</Bullet>
                <Bullet><b>بعد استخدام الخدمة:</b> لا يمكن استرداد المبلغ، لأن التحليل خدمة رقمية تُستهلك فور تنفيذها.</Bullet>
                <Bullet><b>خلل تقني من جانبنا:</b> إن تعذّر عليك استخدام الخدمة بسبب عطل لدينا، نمدّد اشتراكك بالمدة المتأثرة أو نعيد المبلغ كاملاً، حسب اختيارك.</Bullet>
              </Section>

              <Section title="3. كيف تطلب الاسترجاع">
                أرسل بريداً إلى {CONTACT_EMAIL} من البريد المسجّل في حسابك، متضمناً تاريخ الاشتراك وسبب الطلب. نردّ خلال يوم عمل، وإن قُبل الطلب يُعاد المبلغ لنفس وسيلة الدفع خلال 7 إلى 14 يوم عمل حسب سياسة البنك.
              </Section>

              <Section title="4. الإلغاء">
                <Bullet>الاشتراك <b>لا يُجدَّد تلقائياً</b>. ينتهي بانتهاء مدته دون أي خصم إضافي.</Bullet>
                <Bullet>يمكنك إيقاف اشتراكك في أي وقت من صفحة «حسابي» داخل التطبيق.</Bullet>
                <Bullet>عند الإلغاء تبقى الخدمة متاحة لك حتى نهاية المدة المدفوعة، ثم يعود حسابك للباقة المجانية.</Bullet>
                <Bullet>تحليلاتك السابقة تبقى محفوظة في حسابك بعد انتهاء الاشتراك.</Bullet>
              </Section>

              <Section title="5. تغيير الأسعار">
                قد نعدّل الأسعار مستقبلاً، ولا يؤثر ذلك على اشتراك قائم حتى انتهاء مدته.
              </Section>
            </>
          )}

        </div>

        <div style={{ marginTop: 22, background: C.surface, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.sep}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.blue}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Mail size={17} color={C.blue} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.L1 }}>للتواصل والدعم</div>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: 13, color: C.blue, textDecoration: "none" }}>{CONTACT_EMAIL}</a>
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.L4, textAlign: "center", marginTop: 24, lineHeight: 1.8 }}>
          {COMPANY} — جميع الحقوق محفوظة
        </p>

      </div>
    </div>
  );
}
