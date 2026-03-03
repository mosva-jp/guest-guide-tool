import "./globals.css";

export const metadata = {
  title: "ゲストガイド生成ツール | MOSVA",
  description: "民泊ゲスト向け施設ガイドを簡単に作成",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
