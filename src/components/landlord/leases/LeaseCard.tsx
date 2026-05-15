"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  User,
  Calendar,
  ArrowRight,
  Clock,
  Mail,
  MoreVertical,
  CheckCircle2,
  FileText,
  History,
  Trash2,
} from "lucide-react";
import { LeaseStatusBadge } from "./LeaseStatusBadge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LeaseCardData {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  unit: {
    id: string;
    name: string;
    beds: number;
    baths: number;
    property: {
      id: string;
      name: string;
      address: string;
    };
  };
  tenant: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    avatar_bg_color: string | null;
  } | null;
}

type CardVariant = "active" | "archive";

interface LeaseCardProps {
  lease: LeaseCardData;
  variant: CardVariant;
  onClick?: () => void;
  index?: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLeaseProgress(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function getDaysRemaining(end: string): number {
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function LeaseTermProgress({ start, end }: { start: string; end: string }) {
  const progress = useMemo(() => getLeaseProgress(start, end), [start, end]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            progress >= 90 ? "bg-amber-500" : "bg-primary"
          )}
        />
      </div>
    </div>
  );
}

const getAvatarStyles = (tenant?: LeaseCardData["tenant"]) => {
  if (!tenant) return { className: "bg-muted text-muted-foreground" };
  
  // If it's a hex color (starts with #), we'll return it for the style prop
  if (tenant.avatar_bg_color?.startsWith("#")) {
    return { 
      style: { backgroundColor: tenant.avatar_bg_color },
      className: "text-white shadow-inner" // Default text color for hex backgrounds
    };
  }

  // If it's a tailwind class, return it as className
  if (tenant.avatar_bg_color) {
    return { className: tenant.avatar_bg_color };
  }

  const colors = [
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  ];
  const index = tenant.full_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { className: colors[index % colors.length] };
};

export function LeaseCard({ lease, variant, onClick, index = 0 }: LeaseCardProps) {
  const isArchive = variant === "archive";
  const daysRemaining = useMemo(() => getDaysRemaining(lease.end_date), [lease.end_date]);
  const avatarStyles = useMemo(() => getAvatarStyles(lease.tenant), [lease.tenant]);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[2.5rem] border bg-card p-7 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "border-border hover:border-primary/50 hover:shadow-xl hover:shadow-black/[0.02]",
        isArchive && "opacity-70 grayscale-[0.3]"
      )}
    >
      {/* Top Section: Primary Hierarchy (Tenant Avatar + Info) */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative shrink-0">
          <div 
            style={avatarStyles.style}
            className={cn(
              "flex size-14 items-center justify-center overflow-hidden rounded-2xl text-xl font-black transition-all group-hover:scale-105",
              avatarStyles.className
            )}
          >
            {lease.tenant?.avatar_url ? (
              <img 
                src={lease.tenant.avatar_url} 
                alt={lease.tenant.full_name} 
                className="size-full object-cover"
              />
            ) : lease.tenant ? (
              lease.tenant.full_name.charAt(0)
            ) : (
              <User className="size-6" />
            )}
          </div>
          <LeaseStatusBadge 
            status={lease.status as any} 
            dotOnly 
            className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-card bg-card" 
          />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            {isArchive ? "Closed Lease" : (lease.status.replace(/_/g, ' ') || "Status Unknown")}
          </p>
          <h3 className="truncate text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
            {lease.tenant?.full_name || "Unassigned"}
          </h3>
        </div>

        {/* Lease Options (Discrete Top-Right) */}
        {!isArchive && (
          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-xl text-muted-foreground/50 hover:bg-accent hover:text-foreground transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {lease.tenant && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${lease.tenant?.email}`;
                  }}>
                    <Mail className="mr-2 size-4" />
                    Contact Tenant
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}>
                  <FileText className="mr-2 size-4" />
                  View Agreement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <History className="mr-2 size-4" />
                  Lease History
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="mr-2 size-4" />
                  Terminate Lease
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Middle Section: Related Property Details (Proximity) */}
      <div className="mb-8 space-y-5">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{lease.unit.property.name}</p>
            <p className="truncate text-xs font-medium text-muted-foreground">
              Unit {lease.unit.name}
            </p>
          </div>
        </div>

        <div className="min-h-[40px] space-y-4">
          {!isArchive ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <LeaseTermProgress start={lease.start_date} end={lease.end_date} />
                </div>
                {daysRemaining <= 90 && (
                  <div className={cn(
                    "ml-4 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider",
                    daysRemaining <= 30 
                      ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <Clock className="size-3" />
                    {daysRemaining}D TO RENEWAL
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              <Calendar className="size-3" />
              Lease Concluded
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Financials & Action */}
      <div className="mt-auto flex items-end justify-between border-t border-border/50 pt-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
            {isArchive ? "Total Settlement" : "Monthly Rent"}
          </p>
          <p className={cn(
            "font-black tracking-tight text-foreground",
            isArchive ? "text-xl text-foreground/70" : "text-2xl"
          )}>
            {formatCurrency(lease.monthly_rent)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isArchive ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              <CheckCircle2 className="size-3" />
              Archived
            </div>
          ) : (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
              <ArrowRight className="size-5" />
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}


