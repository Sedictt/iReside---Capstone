"use client";

import { useEffect } from "react";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV !== "test"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates periodically
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("[ServiceWorker] New content available; will update on reload.");
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("[ServiceWorker] Registration failed:", err);
          });
      });
    }
  }, []);

  return <>{children}</>;
}
