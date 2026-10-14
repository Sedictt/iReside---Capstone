import { cn } from "@/lib/utils"
import { AlertCircle, Building2, Shield, Users } from "lucide-react"
import Link from "next/link"
import { T } from "@/context/LanguageContext"

type EnvironmentMode = 'apartment' | 'dormitory' | 'boarding_house' | string

export interface PropertyEnvironmentBannerProps {
    environmentMode: EnvironmentMode
    needsReview?: boolean
    propertyId: string
    className?: string
}

export function PropertyEnvironmentBanner({
    environmentMode,
    needsReview,
    propertyId,
    className
}: PropertyEnvironmentBannerProps) {
    if (!environmentMode) return null

    const isDorm = environmentMode === 'dormitory'
    const isBoarding = environmentMode === 'boarding_house'
    
    let themeColor = "bg-primary/10 text-primary border-primary/20"
    let Icon = Building2
    let label = "Apartment"
    let scopeTitle = "Apartment Environment Scope"
    let rulesText = "Property operates under apartment occupancy rules and billing structures."

    if (isDorm) {
        themeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        label = "Dormitory"
        scopeTitle = "Dormitory Environment Scope"
        rulesText = "Property operates under dormitory occupancy rules and billing structures."
        Icon = Shield
    } else if (isBoarding) {
        themeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
        label = "Boarding House"
        scopeTitle = "Boarding House Environment Scope"
        rulesText = "Property operates under boarding house occupancy rules and billing structures."
        Icon = Users
    } else {
        label = environmentMode.charAt(0).toUpperCase() + environmentMode.slice(1)
        scopeTitle = "{label} Environment Scope"
        rulesText = "Property operates under {label} occupancy rules and billing structures."
    }

    return (
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-4 shadow-sm", className)}>
            <div className="flex items-center gap-4">
                <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl border", themeColor)}>
                    <Icon className="size-6" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-foreground flex flex-wrap items-center gap-2">
                        <T params={{ label }}>{scopeTitle}</T>
                        {needsReview && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                                <AlertCircle className="size-4" /> <T>Needs Review</T>
                            </span>
                        )}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                        <T params={{ label: label.toLowerCase() }}>{rulesText}</T>
                    </p>
                </div>
            </div>
            
            <div className="flex shrink-0">
                 <Link 
                    href={`/landlord/properties/${propertyId}/environment`}
                    className="w-full sm:w-auto rounded-xl bg-primary/10 px-4 py-2 text-sm font-black text-primary hover:bg-primary/20 transition-all text-center"
                 >
                    <T>Configure Policy</T>
                 </Link>
            </div>
        </div>
    )
}
