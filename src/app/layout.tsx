import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitionProvider } from "@/components/transitions/PageTransitionProvider";
import GlobalClickSpark from "@/components/ui/ClickSparkWrapper";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { FramerMotionProvider } from "@/components/providers/FramerMotionProvider";
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
        <AuthProvider>
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
                </FramerMotionProvider>
              </PageTransitionProvider>
            </ThemeProvider>
          </GlobalLoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
