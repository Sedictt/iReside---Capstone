"use client";

import React from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface LanguageToggleProps {
  variant?: "compact" | "segmented" | "card";
  className?: string;
  showPreview?: boolean;
}

export function LanguageToggle({
  variant = "compact",
  className,
  showPreview = true,
}: LanguageToggleProps) {
  const { language, isFilipino, setLanguage, toggleLanguage, t } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (variant === "card") {
      return <div className={cn("h-40 w-full rounded-2xl bg-muted/20 border border-border/40 animate-pulse", className)} />;
    }
    return (
      <div
        className={cn(
          "h-9 w-20 rounded-xl bg-muted/20 border border-border/40 animate-pulse",
          className
        )}
      />
    );
  }

  // 1. Compact Variant: Ideal for headers, mobile bars, and sidebars
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 p-1 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md select-none transition-all",
          className
        )}
        role="group"
        aria-label="Language selector"
      >
        <div className="flex items-center px-1 text-muted-foreground" title="Wika / Language">
          <Globe className="size-3.5" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLanguage("en");
          }}
          className={cn(
            "min-h-[28px] px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            !isFilipino
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-pressed={!isFilipino}
          title="Switch to English"
        >
          EN
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLanguage("fil");
          }}
          className={cn(
            "min-h-[28px] px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isFilipino
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-pressed={isFilipino}
          title="Lumipat sa Filipino (Pang-araw-araw na Taglish)"
        >
          FIL
        </button>
      </div>
    );
  }

  // 2. Segmented Variant: 2-column button switch
  if (variant === "segmented") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map((langItem) => {
            const isSelected = language === langItem.code;
            return (
              <button
                key={langItem.code}
                type="button"
                onClick={() => setLanguage(langItem.code)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all font-black text-xs",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border/40"
                    )}
                  >
                    {langItem.code.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {langItem.nativeName}
                      </span>
                      {langItem.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                          {langItem.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {langItem.description}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "size-5 rounded-full border flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-background"
                  )}
                >
                  {isSelected && <Check className="size-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Card Variant: Full rich experience with live conversational preview for Settings
  return (
    <div className={cn("space-y-5", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Option */}
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "relative flex flex-col justify-between p-5 rounded-2xl border transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            !isFilipino
              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "border-border/60 bg-surface-2 hover:bg-muted/30 hover:border-border"
          )}
          aria-pressed={!isFilipino}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "size-9 rounded-xl flex items-center justify-center font-black text-xs border",
                    !isFilipino
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border/40"
                  )}
                >
                  EN
                </div>
                <h4 className="text-sm font-black text-foreground">English</h4>
              </div>
              <div
                className={cn(
                  "size-5 rounded-full border flex items-center justify-center transition-all",
                  !isFilipino
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background"
                )}
              >
                {!isFilipino && <Check className="size-3 stroke-[3]" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard professional English interface for international and multi-tenant operations.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>Sample:</span>
            <span className="font-mono text-foreground">Rent Due</span>
            <span>•</span>
            <span className="font-mono text-foreground">Occupied</span>
            <span>•</span>
            <span className="font-mono text-foreground">Settings</span>
          </div>
        </button>

        {/* Filipino (Everyday Pinoy) Option */}
        <button
          type="button"
          onClick={() => setLanguage("fil")}
          className={cn(
            "relative flex flex-col justify-between p-5 rounded-2xl border transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isFilipino
              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "border-border/60 bg-surface-2 hover:bg-muted/30 hover:border-border"
          )}
          aria-pressed={isFilipino}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "size-9 rounded-xl flex items-center justify-center font-black text-xs border",
                    isFilipino
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border/40"
                  )}
                >
                  FIL
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Filipino</h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                  Pang-araw-araw
                </span>
                <div
                  className={cn(
                    "size-5 rounded-full border flex items-center justify-center transition-all",
                    isFilipino
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-background"
                  )}
                >
                  {isFilipino && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Natural na Taglish at pang-araw-araw na salitang gamit ng mga Pilipinong nagpapaupa at nangungupahan.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>Sample:</span>
            <span className="font-mono text-primary font-bold">Upa sa Kwarto</span>
            <span>•</span>
            <span className="font-mono text-primary font-bold">May Nakatira</span>
            <span>•</span>
            <span className="font-mono text-primary font-bold">Settings</span>
          </div>
        </button>
      </div>

      {showPreview && isFilipino && (
        <div className="p-4 rounded-2xl bg-primary/[0.06] border border-primary/20 text-xs flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Globe className="size-4" />
          </div>
          <p className="text-foreground leading-relaxed">
            <strong className="font-black text-primary">Naka-activate ang Filipino:</strong> Lahat ng navigation, talaan ng upa, kuryente, tubig, at mga karaniwang button ay nasa pamilyar at madaling maunawaang Taglish.
          </p>
        </div>
      )}
    </div>
  );
}
