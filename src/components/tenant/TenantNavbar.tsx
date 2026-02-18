"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TenantNavbar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        // Simple exact match or starts with for nested routes (except dashboard/ai-concierge which is distinct)
        if (path === '/tenant/dashboard' && pathname === '/tenant/dashboard') return true;

        // Handle specific sub-routes if needed, but for now exact match or startWith for clear sections
        return pathname?.startsWith(path);
    };

    const NAV_ITEMS = [
        { label: 'Dashboard', href: '/tenant/dashboard' },
        { label: 'Leases', href: '/tenant/lease' },
        { label: 'Payments', href: '/tenant/payments' },
        { label: 'Profile', href: '/tenant/profile' },
        { label: 'Settings', href: '/tenant/settings' },
    ];

    return (
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-sm"></div>
                        <span className="font-bold text-lg tracking-tight">iReside</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "hover:text-foreground transition-colors relative py-5",
                                    pathname?.startsWith(item.href) && "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/tenant/dashboard/ai-concierge"
                            className={cn(
                                "hover:text-foreground transition-colors relative py-5",
                                pathname?.includes('ai-concierge') && "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                            )}
                        >
                            Concierge
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-muted/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 w-64 transition-all placeholder:text-muted-foreground"
                        />
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-emerald-500 p-[1px]">
                        <div className="h-full w-full rounded-full overflow-hidden relative border-2 border-background">
                            <Image
                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
