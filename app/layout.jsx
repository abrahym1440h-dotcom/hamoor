export const metadata = {
  title: "HAMOUR — هامور",
  description: "حلّل أفكارك الاستثمارية في السوق السعودي",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    title: "HAMOUR",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/IMG_0090.jpeg",
    apple: "/IMG_0090.jpeg"
  }
};

// يلوّن خلفية الصفحة كاملة (بما فيها الشريط العلوي) من أول لحظة، قبل ما يشتغل التطبيق،
// حسب الثيم المحفوظ — هذا اللي يشيل الأبيض اللي فوق.
const PAINT_SCRIPT = `try{var d=localStorage.getItem("hamour_theme")==="dark";var c=d?"#0E1726":"#F2F2F7";document.documentElement.style.backgroundColor=c;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c);}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0E1726" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HAMOUR" />
        <link rel="apple-touch-icon" href="/IMG_0090.jpeg" />
        <script dangerouslySetInnerHTML={{ __html: PAINT_SCRIPT }} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
