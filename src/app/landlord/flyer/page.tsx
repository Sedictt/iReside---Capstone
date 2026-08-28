"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Printer, Sliders } from "lucide-react";
import { LobbyFlyerModal } from "@/components/landlord/flyer/LobbyFlyerModal";

export default function LandlordFlyerPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      {/* If closed, show launcher card */}
      {!isOpen && (
        <div className="max-w-md w-full neumorphic-panel rounded-3xl p-8 text-center space-y-5 border border-border/50">
          <div className="size-16 rounded-2xl neumorphic-inset mx-auto flex items-center justify-center text-primary">
            <QrCode className="size-8" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">
              Lobby QR Code Flyer
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Print high-resolution onboarding posters for your property's physical lobby.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider neumorphic-primary text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Printer className="size-4" />
              <span>Open Flyer Generator</span>
            </button>
            <Link
              href="/landlord/dashboard"
              className="w-full py-3 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Modal View */}
      <LobbyFlyerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
