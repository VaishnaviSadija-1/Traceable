import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Traceable — Visitor Intelligence & Sales Alerting",
  description:
    "Traceable identifies who's visiting your website and alerts your sales team in real time — before visitors fill out a form. Turn anonymous traffic into pipeline.",
  openGraph: {
    title: "Traceable — Visitor Intelligence & Sales Alerting",
    description:
      "Identify high-intent visitors the moment they land. Get Slack alerts, company enrichment, and lead scoring — automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={instrumentSans.variable} style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
