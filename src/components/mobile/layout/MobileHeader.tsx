'use client'

import Link from 'next/link'
import { Bell, ChevronLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
    notificationCount = 0,
    notificationsHref = '/mobile/notifications',
    className,
    rightAction,
}: MobileHeaderProps) {
    const router = useRouter()

    const handleBack = () => {
        if (backHref) {
            router.push(backHref)
        } else {
            router.back()
        }
    }

    return (
        <header className={cn('mobile-header', className)}>
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
            <div className="w-10 flex items-center justify-end gap-1">
                <ThemeToggle variant="sidebar" className="size-9" />
                {rightAction ?? (
                    <Link
                        href={notificationsHref}
                        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label={
                            notificationCount > 0
                                ? `${notificationCount} unread notifications`
                                : 'Notifications'
                        }
                    >
                        <Bell size={20} strokeWidth={1.8} />
                        {notificationCount > 0 && (
                            <span
                                className="absolute top-1 right-1 min-w-[14px] h-[14px] px-[3px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                                aria-hidden="true"
                            >
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </Link>
                )}
            </div>
        </header>
    )
}
