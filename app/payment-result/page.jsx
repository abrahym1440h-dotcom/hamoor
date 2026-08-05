"use client";
import { useEffect, useState } from "react";

const C = {
  bg: "#F7F8FA", surface: "#FFFFFF", L1: "#0B1320", L2: "#3C4757",
  L3: "#6B7685", L4: "#9AA3B0", sep: "#E5E8ED",
  blue: "#007AFF", green: "#34C759", red: "#FF3B30", orange: "#FF9500"
};

export default function PaymentResult() {
  const [state, setState] = useState("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tapId = params.get("tap_id");
    const status = (params.get("status") || "").toLowerCase();

    if (status === "paid" || status === "captured") { setState("success"); return; }
    if (status === "failed" || status === "declined") { setState("failed"); return; }
    if (tapId) { setState("success"); return; }

    setState("pending");
  }, []);

  const views = {
    checking: {
      color: C.blue, icon: "⏳",
      title: "جاري التحقق من الدفع…",
      body: "لحظات من فضلك"
    },
    success: {
      color: C.green, icon: "✓",
      title: "تم استلام دفعتك بنجاح",
      body: "يُفعّل اشتراكك خلال لحظات. إن لم يظهر التفعيل خلال دقيقة، أعد فتح التطبيق أو راسلنا وسنعالج الأمر فوراً."
    },
    failed: {
      color: C.red, icon: "✕",
      title: "لم تكتمل عملية الدفع",
      body: "لم يُخصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى، وإن تكرّرت المشكلة راسلنا."
    },
    pending: {
      color: C.orange, icon: "!",
      title: "حالة الدفع غير مؤكدة",
      body: "إن خُصم المبلغ من حسابك ولم يُفعّل الاشتراك خلال ساعة، راسلنا من بريدك المسجّل وسنعالج الأمر خلال يوم عمل."
    }
  };

  const v = views[state];

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, background: C.surface, borderRadius: 22, padding: "36px 26px", textAlign: "center", border: `1px solid ${C.sep}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>

        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${v.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28, color: v.color, fontWeight: 800 }}>
          {v.icon}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.L1, marginBottom: 10 }}>{v.title}</h1>
        <p style={{ fontSize: 14, lineHeight: 2, color: C.L2, marginBottom: 26 }}>{v.body}</p>

        <a href="/" style={{ display: "block", background: C.blue, color: "#fff", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 14 }}>
          العودة للتطبيق
        </a>

        <a href="mailto:hamoorservice@gmail.com" style={{ fontSize: 12, color: C.L3, textDecoration: "none" }}>
          للدعم: hamoorservice@gmail.com
        </a>

      </div>
    </div>
  );
}
