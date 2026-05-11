"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { UserCheck, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type SigningMode = "in_person" | "remote";

interface SigningModeSelectorProps {
  value: SigningMode | null;
  onChange: (mode: SigningMode) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Signing Mode Selector Component
 * Allows landlord to choose between in-person and remote signing modes
 */
export function SigningModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: SigningModeSelectorProps) {
  const modes = [
    {
      id: "in_person" as SigningMode,
      label: "In-Person Signing",
      description: "Both tenant and landlord sign during the same session",
      icon: Users,
      color: "purple",
    },
    {
      id: "remote" as SigningMode,
      label: "Remote Signing",
      description: "Send signing link to tenant via email",
      icon: Mail,
      color: "blue",
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3 text-purple-400">
        <UserCheck size={18} strokeWidth={2.5} />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">
          Signing Mode
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.id;
          const colorClasses = {
            purple: {
              border: "border-purple-500/30",
              bg: "bg-purple-500/5",
              hover: "hover:bg-purple-500/10",
              selected: "border-purple-500/60 bg-purple-500/10",
              icon: "text-purple-500",
              iconBg: "bg-purple-500/10",
            },
            blue: {
              border: "border-blue-500/30",
              bg: "bg-blue-500/5",
              hover: "hover:bg-blue-500/10",
              selected: "border-blue-500/60 bg-blue-500/10",
              icon: "text-blue-500",
              iconBg: "bg-blue-500/10",
            },
          }[mode.color]!;

          return (
            <motion.button
              key={mode.id}
              type="button"
              onClick={() => !disabled && onChange(mode.id)}
              disabled={disabled}
              className={cn(
                "relative p-6 rounded-2xl border transition-all duration-300 text-left",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? colorClasses.selected
                  : cn(colorClasses.border, colorClasses.bg, !disabled && colorClasses.hover)
              )}
              whileHover={!disabled ? { scale: 1.02 } : undefined}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="signing-mode-indicator"
                  className="absolute -top-2 -right-2 size-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <UserCheck size={16} className="text-white" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "shrink-0 size-12 rounded-xl flex items-center justify-center border",
                    colorClasses.iconBg,
                    isSelected
                      ? `${colorClasses.border} border-opacity-40`
                      : `${colorClasses.border}`
                  )}
                >
                  <Icon className={colorClasses.icon} size={24} />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1.5">
                  <h4
                    className={cn(
                      "font-bold text-sm",
                      isSelected ? "text-white" : "text-neutral-200"
                    )}
                  >
                    {mode.label}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </div>

              {/* Lock indicator */}
              {disabled && (
                <div className="absolute inset-0 rounded-2xl bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-wider">
                    Locked
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Helper Text */}
      {!value && !disabled && (
        <p className="text-xs text-neutral-400 px-1">
          Select a signing mode to continue. Mode cannot be changed after first signature.
        </p>
      )}
    </div>
  );
}

