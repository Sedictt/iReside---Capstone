'use client'

import Link from 'next/link'
import { Bell, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

import { useNotifications } from '@/context/NotificationContext'

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
    const { unreadCount = 0 } = useNotifications()
    const effectiveCount = notificationCount !== undefined ? notificationCount : unreadCount

    const handleBack = () => {
        if (backHref) {
            router.push(backHref)
        } else {
            router.back()
        }
    }

    return (
        <header className={cn('mobile-header shrink-0', className)}>
            {/* Left: back button or spacer */}
            <div className="w-10 flex items-center justify-start">
                {showBack ? (
                    <button
                        onClick={handleBack}
                        className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Go back"
                    >
                        <ChevronLeft size={22} strokeWidth={2} />
                    </button>
                ) : null}
            </div>

            {/* Center: page title */}
            <h1 className="text-[15px] font-semibold text-foreground tracking-tight truncate max-w-[180px]">
                {title}
            </h1>

            {/* Right: notification bell or custom action */}
            <div className="w-10 flex items-center justify-end">
                {rightAction ?? (
                    <Link
                        href={notificationsHref}
                        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label={
                            effectiveCount > 0
                                ? `${effectiveCount} unread notifications`
                                : 'Notifications'
                        }
                    >
                        <Bell size={20} strokeWidth={1.8} />
                        {effectiveCount > 0 && (
                            <span
                                className="absolute top-1 right-1 min-w-[14px] h-[14px] px-[3px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse"
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
