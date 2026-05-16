"use client";

import React from 'react';
import { m as motion, AnimatePresence } from "framer-motion";
import { FileText, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IResideLoadingProps {
  isVisible: boolean;
  title?: string;
  subtext?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Universal Loading Screen for iReside
 * 
 * Features:
 * - Glassmorphic backdrop with heavy blur
 * - Animated primary spinner
 * - Customizable title and subtext
 * - Framer Motion transitions
 */
export function IResideLoading({
  isVisible,
  title = "Preparing Document",
  subtext = "Building Secure Artifact",
  icon: Icon = FileText,
  className
}: IResideLoadingProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[2000] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center",
            className
          )}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              {/* Static Ring */}
              <div className="size-20 border-2 border-primary/10 rounded-full" />
              
              {/* Active Spinner */}
              <div className="absolute inset-0 size-20 border-t-2 border-primary rounded-full animate-spin" />
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="size-6 text-primary" />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                {title}
              </h2>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                {subtext}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
