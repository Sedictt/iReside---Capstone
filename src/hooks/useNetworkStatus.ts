"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { mutationQueue } from "@/lib/offline/mutationQueue";

export interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnlineAt: number | null;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Sync trigger handler
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsReconnecting(true);
    try {
      await mutationQueue.processQueue();
    } finally {
      if (isMountedRef.current) {
        setIsReconnecting(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastOnlineAt(Date.now());
      }
    }

    // Subscribe to mutation queue count
    const unsubscribeQueue = mutationQueue.subscribe((count) => {
      if (isMountedRef.current) {
        setPendingSyncCount(count);
      }
    });

    const handleOnline = async () => {
      if (!isMountedRef.current) return;
      setIsOnline(true);
      setIsReconnecting(true);
      setLastOnlineAt(Date.now());

      try {
        await mutationQueue.processQueue();
      } finally {
        if (isMountedRef.current) {
          setIsReconnecting(false);
        }
      }
    };

    const handleOffline = () => {
      if (!isMountedRef.current) return;
      setIsOnline(false);
      setIsReconnecting(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Heartbeat check every 30 seconds to catch silent disconnections
    const heartbeatInterval = setInterval(async () => {
      if (typeof window === "undefined") return;
      if (!navigator.onLine) {
        if (isOnline && isMountedRef.current) {
          setIsOnline(false);
        }
        return;
      }

      try {
        // Fast ping to favicon or health endpoint
        const response = await fetch("/logos/favicon.png", {
          method: "HEAD",
          cache: "no-store",
        });
        if (response.ok && !isOnline && isMountedRef.current) {
          handleOnline();
        }
      } catch {
        if (isOnline && isMountedRef.current) {
          setIsOnline(false);
        }
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      unsubscribeQueue();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(heartbeatInterval);
    };
  }, [isOnline, triggerSync]);

  return {
    isOnline,
    isReconnecting,
    lastOnlineAt,
    pendingSyncCount,
    triggerSync,
  };
}
