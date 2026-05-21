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
    icon: "/IMG_0090.png",
    apple: "/IMG_0090.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0E1726" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HAMOUR" />
        <link rel="apple-touch-icon" href="/IMG_0090.png" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
