"use client";

import React from "react";
import Image from "next/image";
import { useBrand } from "@/context/BrandContext";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  theme?: "adaptive" | "light" | "dark";
}

export function BrandLogo({
  className,
  imageClassName,
  showText = true,
  size = "md",
  theme = "adaptive",
}: BrandLogoProps) {
  const { propertyName, propertyTagline, logoUrl, monogramInitials, isCustomBranded, primaryColor } = useBrand();

  const sizeClasses = {
    sm: { box: "size-8", text: "text-xs", subtext: "text-[9px]", font: "text-xs" },
    md: { box: "size-10 sm:size-11", text: "text-sm sm:text-base", subtext: "text-[10px] sm:text-xs", font: "text-sm font-black" },
    lg: { box: "size-14 sm:size-16", text: "text-xl sm:text-2xl", subtext: "text-xs", font: "text-lg font-black" },
  }[size];

  // 1. Custom Uploaded Logo Image
  if (logoUrl) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn("relative overflow-hidden rounded-2xl shrink-0 border border-border/40 shadow-xs", sizeClasses.box, imageClassName)}>
          <Image
            src={logoUrl}
            alt={`${propertyName} Logo`}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>
        {showText && (
          <div className="flex flex-col min-w-0 text-left">
            <span className={cn("font-black tracking-tight text-foreground truncate", sizeClasses.text)}>
              {propertyName}
            </span>
            <span className={cn("text-muted-foreground font-medium truncate", sizeClasses.subtext)}>
              {propertyTagline}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Monogram Emblem Badge (Custom Property Name without image)
  if (isCustomBranded) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform active:scale-95",
            sizeClasses.box,
            imageClassName
          )}
          style={{
            backgroundColor: `${primaryColor}20`,
            borderColor: `${primaryColor}40`,
            color: primaryColor,
          }}
        >
          <span className={cn("font-black tracking-wider uppercase", sizeClasses.font)}>
            {monogramInitials}
          </span>
        </div>
        {showText && (
          <div className="flex flex-col min-w-0 text-left">
            <span className={cn("font-black tracking-tight text-foreground truncate", sizeClasses.text)}>
              {propertyName}
            </span>
            <span className={cn("text-muted-foreground font-medium truncate", sizeClasses.subtext)}>
              {propertyTagline}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. Fallback to standard iReside Logo
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo
        variant="primary"
        theme={theme}
        className={cn(size === "sm" ? "h-7 w-20" : size === "lg" ? "h-12 w-36" : "h-9 w-28", imageClassName)}
      />
    </div>
  );
}
