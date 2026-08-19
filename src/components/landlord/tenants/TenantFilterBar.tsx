'use client'

import { Search, Filter } from "lucide-react"
import { TenantStatus } from "./TenantCard"
import { AnimatedFilterPills } from "@/components/ui/AnimatedFilterPills"

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
        <div className="flex flex-col gap-4 rounded-[2rem] neumorphic-panel p-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search residents, units, or properties..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-12 w-full rounded-2xl border-none neumorphic-inset pl-11 pr-4 text-sm font-medium transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
            </div>
            <div className="flex items-center gap-2 px-1">
                <AnimatedFilterPills
                    variant="neumorphic"
                    options={["All", "Active", "Moving Out"]}
                    activeId={statusFilter}
                    onChange={(status) => onStatusFilterChange(status as TenantStatus | "All")}
                    layoutGroupId="tenant-directory-status-pills"
                />
                <div className="mx-2 h-6 w-px bg-border hidden lg:block" />
                <button className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black text-muted-foreground hover:neumorphic-inset hover:text-foreground transition-all">
                    <Filter className="size-4" />
                    <span>More Filters</span>
                </button>
            </div>
        </div>
    )
}
