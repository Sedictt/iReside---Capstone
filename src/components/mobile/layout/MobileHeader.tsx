'use client'

import Link from 'next/link'
import { Bell, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { triggerHaptic } from '@/lib/haptics'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguageContext } from '@/context/LanguageContext'

interface MobileHeaderProps {
    /** Page title displayed in the center */
    title: string
    /** Show a back arrow instead of logo area */
    showBack?: boolean
    /** Override back navigation target */
    backHref?: string
    /** Show notification bell — pass unread count */
    notificationCount?: number
    /** Notification bell href */
    notificationsHref?: string
    /** Extra classes for the header root */
    className?: string
    /** Slot for right-side custom actions (replaces notification bell) */
    rightAction?: React.ReactNode
}

export function MobileHeader({
    title,
    showBack = false,
    backHref,
    notificationCount,
    notificationsHref = '/mobile/notifications',
    className,
    rightAction,
}: MobileHeaderProps) {
    const router = useRouter()
    const { t } = useLanguageContext()
    const { unreadCount = 0 } = useNotifications()
    const effectiveCount = notificationCount !== undefined ? notificationCount : unreadCount

    const handleBack = () => {
        triggerHaptic('light')
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
        } else if (backHref) {
            router.push(backHref)
        } else {
            router.back()
        }
    }

    return (
        <header className={cn('mobile-header shrink-0', className)}>
            {/* Left: back button or spacer */}
            <div className="w-11 flex items-center justify-start">
                {showBack ? (
                    <button
                        onClick={handleBack}
                        className="m-card flex items-center justify-center w-11 h-11 rounded-2xl text-foreground active:scale-90 transition-all"
                        aria-label={t("Go back")}
                    >
                        <ChevronLeft size={22} strokeWidth={2} />
                    </button>
                ) : null}
            </div>

            {/* Center: page title */}
            <h1 className="m-display text-[18px] text-foreground truncate flex-1 text-center px-2 min-w-0">
                {t(title)}
            </h1>

            {/* Right: notification bell or custom action */}
            <div className="w-11 flex items-center justify-end">
                {rightAction ?? (
                    <Link
                        href={notificationsHref}
                        prefetch={true}
                        className="m-card relative flex items-center justify-center w-11 h-11 rounded-2xl text-foreground active:scale-90 transition-all"
                        aria-label={
                            effectiveCount > 0
                                ? t('{count} unread notifications', { count: effectiveCount })
                                : t('Notifications')
                        }
                    >
                        <Bell size={20} strokeWidth={1.9} />
                        {effectiveCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-[5px] rounded-full bg-[var(--m-coral)] text-white text-[11px] font-bold flex items-center justify-center"
                                aria-hidden="true"
                            >
                                {effectiveCount > 9 ? '9+' : effectiveCount}
                            </span>
                        )}
                    </Link>
                )}
            </div>
        </header>
    )
}
