"use client";

import { toast } from "sonner";
import { playSound } from "@/hooks/useSound";
import { tr } from "@/hooks/useLanguage";

export function useAppToast() {
    return {
        success: (message: string, options?: any) => {
            playSound("success");
            return toast.success(tr(message), options);
        },
        error: (message: string, options?: any) => {
            playSound("error");
            return toast.error(tr(message), options);
        },
        info: (message: string, options?: any) => {
            // Optional: info sound
            return toast.info(tr(message), options);
        },
        warning: (message: string, options?: any) => {
            playSound("warning");
            return toast.warning(tr(message), options);
        },
        promise: <T>(promise: Promise<T>, options: {
            loading: string;
            success: (data: T) => string;
            error: (err: any) => string;
        }) => {
            return toast.promise(promise, {
                loading: options.loading,
                success: (data) => {
                    playSound("success");
                    return options.success(data);
                },
                error: (err) => {
                    playSound("error");
                    return options.error(err);
                }
            });
        }
    };
}
