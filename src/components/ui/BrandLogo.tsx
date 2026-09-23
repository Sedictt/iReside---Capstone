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
    sm: { box: "size-7 shrink-0", text: "text-xs font-black", subtext: "text-[9px]", font: "text-[11px] font-black" },
    md: { box: "size-8 sm:size-9 shrink-0", text: "text-xs font-black leading-tight", subtext: "text-[10px] leading-tight", font: "text-xs font-black" },
    lg: { box: "size-12 sm:size-14 shrink-0", text: "text-lg sm:text-xl font-black", subtext: "text-xs", font: "text-base font-black" },
  }[size];

  // 1. Custom Uploaded Logo Image
  if (logoUrl) {
    return (
      <div className={cn("flex items-center gap-2.5 min-w-0 w-full overflow-hidden", className)}>
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
          <div className="flex flex-col min-w-0 flex-1 text-left overflow-hidden">
            <span className={cn("font-black tracking-tight text-foreground truncate block", sizeClasses.text)} title={propertyName}>
              {propertyName}
            </span>
            <span className={cn("text-muted-foreground font-medium truncate block", sizeClasses.subtext)} title={propertyTagline}>
              {propertyTagline}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Default to standard Wordmark Logo unless custom logo image is uploaded
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0 w-full overflow-hidden", className)}>
      <Logo
        variant="primary"
        theme={theme}
        className={cn(size === "sm" ? "h-7 w-20" : size === "lg" ? "h-12 w-36" : "h-9 w-28", imageClassName)}
      />
      {showText && propertyName && (
        <div className="flex flex-col min-w-0 flex-1 text-left overflow-hidden">
          <span className={cn("font-black tracking-tight text-foreground truncate block", sizeClasses.text)} title={propertyName}>
            {propertyName}
          </span>
          {propertyTagline && (
            <span className={cn("text-muted-foreground font-medium truncate block", sizeClasses.subtext)} title={propertyTagline}>
              {propertyTagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
