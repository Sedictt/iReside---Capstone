"use client"

import { useState, useEffect } from "react"
import { m as motion, AnimatePresence } from "framer-motion"
import { Cookie, X, Shield, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem("cookie-consent")
    if (!storedConsent) {
      setIsVisible(true)
    }
    setIsInitialized(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setIsVisible(false)
    toast.success("Cookies accepted", {
      description: "Thank you for accepting cookies. Your preferences have been saved.",
    })
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    setIsVisible(false)
    toast.info("Cookies declined", {
      description: "You have declined non-essential cookies. Some features may be limited.",
    })
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  // Don't render during SSR to prevent hydration mismatch
  if (!isInitialized) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-auto md:max-w-md"
        >
          <div className="relative rounded-xl border border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg dark:bg-background/95">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close cookie consent"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Cookie className="size-5" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="size-4" />
                    Cookie Consent
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and for authentication purposes. 
                    By clicking &quot;Accept All&quot;, you agree to our use of cookies.
                  </p>
                </div>

                {/* Privacy link */}
                <div className="text-xs text-muted-foreground">
                  <button
                    className="underline hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
                    onClick={() => {
                      toast.info("Privacy Policy", {
                        description: "Privacy policy page coming soon.",
                      })
                    }}
                  >
                    Read our Privacy Policy
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAccept}
                      size="sm"
                      className="flex-1 sm:flex-none gap-1.5"
                    >
                      <Check className="size-3.5" />
                      Accept All
                    </Button>
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none gap-1.5"
                    >
                      <X className="size-3.5" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CookieConsent
