"use client";

import { TenantNavbar } from "@/components/tenant/TenantNavbar";
import { MessageFab } from "@/components/tenant/MessageFab";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChatPage = pathname === "/tenant/dashboard/ai-concierge";

    return (
        <div className={cn(
            "min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col",
            isChatPage && "h-screen overflow-hidden"
        )}>
            <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
            </div>
            {!isChatPage && <TenantNavbar />}
            <main className={cn(
                "w-full h-full flex-1 flex flex-col",
                !isChatPage && "max-w-7xl mx-auto px-6 py-8"
            )}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, scale: 0.99, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.99, y: -10 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="w-full h-full flex-1 flex flex-col"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
            <MessageFab />
        </div>
    );
}
