"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { m as motion, AnimatePresence } from "framer-motion"
import { Cookie, X, ShieldCheck, Settings, Shield } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * User cookie preference categories.
 * 'essential' is always true as per GDPR/CCPA for site functionality.
 */
type ConsentSettings = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [activeSettings, setActiveSettings] = useState<ConsentSettings>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const savedConsent = localStorage.getItem("ireside-consent-v1")
    if (!savedConsent) {
      const appearanceDelay = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(appearanceDelay)
    }
    setIsMounted(true)
  }, [])

  const commitConsent = (settings: ConsentSettings) => {
    localStorage.setItem("ireside-consent-v1", JSON.stringify(settings))
    setIsVisible(false)
    toast.success("Privacy settings updated", {
      description: "Your preferences are now active across iReside.",
      icon: <ShieldCheck className="size-4 text-primary" />,
    })
  }

  const handleAcceptAll = () => {
    const allEnabled = { essential: true, analytics: true, marketing: true }
    setActiveSettings(allEnabled)
    commitConsent(allEnabled)
  }

  const handleAcceptEssential = () => {
    const essentialOnly = { essential: true, analytics: false, marketing: false }
    setActiveSettings(essentialOnly)
    commitConsent(essentialOnly)
  }

  const handleSaveSettings = () => {
    commitConsent(activeSettings)
  }

  const toggleSetting = (key: keyof ConsentSettings) => {
    if (key === 'essential') return
    setActiveSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isMounted && typeof window !== 'undefined') {
    // Initial mount check to prevent layout shift
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 150 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:bottom-8 md:left-8 md:right-auto md:max-w-[420px]"
        >
          <div className={cn(
            "relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]",
            "before:absolute before:inset-0 before:bg-linear-to-br before:from-primary/10 before:to-transparent before:pointer-events-none"
          )}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary/40 to-transparent" />

            <div className="p-7 md:p-9">
              {!isManaging ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="relative flex-shrink-0">
                      <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                        <Cookie className="size-7" />
                      </div>
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-display text-xl font-black tracking-tight text-foreground">
                        Privacy Preferences
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        We use technical cookies to power the iReside dashboard and optional analytics to improve your property management experience.
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <div className="flex gap-2.5">
                      <Button
                        onClick={handleAcceptAll}
                        className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.97]"
                      >
                        Accept all cookies
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsManaging(true)}
                        className="px-4 h-12 rounded-2xl border-border bg-transparent hover:bg-muted/50 transition-colors"
                        aria-label="Customize settings"
                      >
                        <Settings className="size-5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between px-1.5">
                      <button
                        onClick={handleAcceptEssential}
                        className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-primary/20"
                      >
                        Essential only
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-black text-muted-foreground/40">
                        <Shield className="size-3" />
                        Encrypted & Private
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsManaging(false)}
                        className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <X className="size-5" />
                      </button>
                      <h3 className="font-display text-lg font-black tracking-tight">Configure Privacy</h3>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <SettingToggle 
                      title="Platform Core" 
                      description="Required for authentication and session stability."
                      active={true}
                      readOnly={true}
                    />
                    <SettingToggle 
                      title="Performance Metrics" 
                      description="Helps us optimize dashboard loading speeds."
                      active={activeSettings.analytics}
                      onToggle={() => toggleSetting('analytics')}
                    />
                    <SettingToggle 
                      title="Personalization" 
                      description="Allows tailored feature recommendations."
                      active={activeSettings.marketing}
                      onToggle={() => toggleSetting('marketing')}
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      onClick={handleSaveSettings}
                      className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
                    >
                      Save my choices
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleAcceptAll}
                      className="flex-1 h-11 rounded-2xl text-primary font-bold hover:bg-primary/5"
                    >
                      Enable all
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SettingToggle({ 
  title, 
  description, 
  active, 
  onToggle, 
  readOnly = false 
}: { 
  title: string
  description: string
  active: boolean
  onToggle?: () => void
  readOnly?: boolean
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-[1.5rem] border transition-all cursor-pointer",
        active ? "border-primary/20 bg-primary/5" : "border-border bg-muted/20",
        readOnly && "cursor-default opacity-80"
      )}
      onClick={!readOnly ? onToggle : undefined}
    >
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-black text-foreground leading-tight">{title}</h4>
        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{description}</p>
      </div>
      <div className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        active ? "bg-primary" : "bg-muted-foreground/30"
      )}>
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
            active ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
    </div>
  )
}

export default CookieConsent
