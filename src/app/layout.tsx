import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitionProvider } from "@/components/transitions/PageTransitionProvider";
import GlobalClickSpark from "@/components/ui/ClickSparkWrapper";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { FramerMotionProvider } from "@/components/providers/FramerMotionProvider";
import "@/bones/registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iReside",
  description: "Modern Property Management Platform",
  icons: {
    icon: "/logos/favicon.png",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalTooltipManager } from "@/components/ui/GlobalTooltipManager";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { OfflineCommandCenterModal } from "@/components/offline/OfflineCommandCenterModal";
import { BrandProvider } from "@/context/BrandContext";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/*
          Initialize accessibility preferences (font-size scale & high-contrast)
          immediately before rendering to avoid flash of unscaled content (FOUT).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var sc=localStorage.getItem("ireside_font_scale");if(sc&&!isNaN(Number(sc))){var n=Math.min(130,Math.max(90,Number(sc)));document.documentElement.style.fontSize=n+"%";document.documentElement.setAttribute("data-font-size",n<=90?"compact":n<=100?"normal":n<=115?"large":"larger");document.documentElement.setAttribute("data-font-scale",String(n));}else{var s=localStorage.getItem("ireside_font_size");if(s==="large"){document.documentElement.style.fontSize="110%";}else if(s==="larger"){document.documentElement.style.fontSize="120%";}}var hc=localStorage.getItem("ireside_high_contrast");if(hc==="true"){document.documentElement.classList.add("high-contrast");document.documentElement.setAttribute("data-high-contrast","true");}}catch(e){}})();`,
          }}
        />
        {/*
          Strip fdprocessedid injected by Fiddler/form-fill browser extensions
          before React hydrates, preventing hydration mismatch errors.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{new MutationObserver(function(m){for(var i=0;i<m.length;i++){if(m[i].type==="attributes"&&m[i].attributeName==="fdprocessedid"){m[i].target.removeAttribute("fdprocessedid")}}}).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:["fdprocessedid"]})}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ServiceWorkerProvider>
          <AuthProvider>
            <BrandProvider>
              <GlobalLoadingProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem={true}
                  disableTransitionOnChange
                  storageKey="ireside-theme"
                >
                  <PageTransitionProvider>
                    <FramerMotionProvider>
                      <TooltipProvider delayDuration={200} skipDelayDuration={150}>
                        <GlobalTooltipManager />
                        <OfflineBanner />
                        <OfflineCommandCenterModal />
                        <GlobalClickSpark>
                          {children}
                          <Toaster
                            position="top-right"
                            richColors
                            closeButton
                            expand={true}
                            theme="system"
                            className="ireside-toaster"
                            toastOptions={{
                              className: 'ireside-toast',
                            }}
                          />
                          <CookieConsent />
                        </GlobalClickSpark>
                      </TooltipProvider>
                    </FramerMotionProvider>
                  </PageTransitionProvider>
                </ThemeProvider>
              </GlobalLoadingProvider>
            </BrandProvider>
          </AuthProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
