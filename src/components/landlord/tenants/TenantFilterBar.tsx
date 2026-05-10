'use client'

import { Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { TenantStatus } from "./TenantCard"

interface TenantFilterBarProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    statusFilter: TenantStatus | "All"
    onStatusFilterChange: (status: TenantStatus | "All") => void
}

export function TenantFilterBar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange
}: TenantFilterBarProps) {
    return (
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search residents, units, or properties..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-12 w-full rounded-2xl border-none bg-muted/50 pl-11 pr-4 text-sm font-medium transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
            </div>
            <div className="flex items-center gap-2 px-1">
                {["All", "Active", "Moving Out"].map((status) => (
                    <button
                        key={status}
                        onClick={() => onStatusFilterChange(status as TenantStatus | "All")}
                        className={cn(
                            "h-10 rounded-xl px-4 text-sm font-bold transition-all",
                            statusFilter === status
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {status}
                    </button>
                ))}
                <div className="mx-2 h-6 w-px bg-border hidden lg:block" />
                <button className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                    <Filter className="h-4 w-4" />
                    <span>More Filters</span>
                </button>
            </div>
        </div>
    )
}
