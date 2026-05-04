import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Nunito } from "next/font/google";
import "../styles.css";
import AuthProvider from '@/components/AuthProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Knead - voice-first AI app builder",
  description:
    "Speak ideas, watch them mold into working apps. AI-powered code generation with live sandbox preview.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F4F0EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className={nunito.className}>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
