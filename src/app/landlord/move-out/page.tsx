"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MoveOutRequestsList } from "@/components/landlord/move-out/MoveOutRequestsList";
import { MoveOutRequestDetails } from "@/components/landlord/move-out/MoveOutRequestDetails";
import { m as motion, AnimatePresence } from "framer-motion";

export default function MoveOutRequestsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "pending";
  const isPreview = searchParams.get("preview") === "true";
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 md:px-10">
        <AnimatePresence mode="wait">
          {!selectedRequest ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10 space-y-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Move-Out Requests
                  </h1>
                  {isPreview && (
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                      Preview Mode
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Manage tenant departures, approvals, and inspections.
                </p>
              </div>
              <MoveOutRequestsList 
                key={reloadKey}
                initialFilter={initialStatus as any}
                preview={isPreview}
                onSelect={(req) => setSelectedRequest(req)} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <MoveOutRequestDetails
                request={selectedRequest}
                onBack={() => setSelectedRequest(null)}
                onUpdate={() => {
                  setSelectedRequest(null);
                  setReloadKey((prev) => prev + 1);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
