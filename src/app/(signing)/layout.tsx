"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "sonner";

export default function SigningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            {children}
          </div>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
