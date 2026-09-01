import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Kantumruy_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";
import { ThemeProvider } from "@/lib/theme";
import { ModalProvider } from "@/components/ui/Modal";
import { registerPwaServiceWorker } from "@/lib/pwa";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const kantumruy = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "DBM Retailer",
    template: "%s | DBM Retailer",
  },
  description: "DBM2026 user management — accounts, roles, and passwords.",
  manifest: "/manifest.webmanifest",
  applicationName: "DBM Retailer",
  appleWebApp: {
    capable: true,
    title: "DBM Retailer",
    statusBarStyle: "black-translucent",
    startupImage: ["/icons/icon-512.png"],
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d63ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeInit = `(function(){try{var p=window.location.pathname;var t;if(p==="/order"||p.indexOf("/order/")==0){t="light";}else{t=localStorage.getItem("dbm_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}}var r=document.documentElement;r.dataset.theme=t;r.setAttribute("data-theme",t);r.style.colorScheme=t;r.classList.toggle("dark",t==="dark");r.classList.toggle("light",t==="light");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${kantumruy.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <PwaServiceWorkerRegistrar />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ModalProvider>{children}</ModalProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Registers the DBM Retailer service worker once the page is fully loaded.
 * This powers the PWA's offline app-shell support and installability.
 */
function PwaServiceWorkerRegistrar() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: registerPwaServiceWorker }}
    />
  );
}
