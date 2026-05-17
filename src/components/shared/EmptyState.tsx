"use client";

import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center mb-5">
        <Icon className="h-7 w-7 text-neutral-500" />
      </div>
      <h3 className="text-base font-bold text-neutral-300 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <a
          href={action.href ?? "#"}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}