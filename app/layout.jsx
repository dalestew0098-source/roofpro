export const metadata = {
  title: "RoofPro — Free Roofing Estimate Generator",
  description: "Create professional roofing estimates and invoices in seconds. Free roofing quote generator for contractors. Works on your phone.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
