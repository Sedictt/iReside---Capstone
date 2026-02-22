"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Search, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TenantNavbar() {
    const pathname = usePathname();

    const NAV_ITEMS = [
        { label: 'Home', href: '/' },
        { label: 'Search', href: '/search' },
        { label: 'Dashboard', href: '/tenant/dashboard' },
        { label: 'Applications', href: '/tenant/applications' },
        { label: 'Leases', href: '/tenant/lease' },
        { label: 'Payments', href: '/tenant/payments' },
    ];

    return (
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-sm"></div>
                        <span className="font-bold text-lg tracking-tight">iReside</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        {NAV_ITEMS.map((item) => {
                            const active = item.href === '/'
                                ? pathname === '/'
                                : pathname?.startsWith(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "hover:text-foreground transition-colors relative py-5",
                                        active && "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/tenant/dashboard/ai-concierge"
                            className={cn(
                                "hover:text-foreground transition-colors relative py-5",
                                pathname?.includes('ai-concierge') && "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                            )}
                        >
                            Ask iRis
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

                    {/* User Profile Dropdown */}
                    <div className="relative group">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-emerald-500 p-[1px] cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all">
                            <div className="h-full w-full rounded-full overflow-hidden relative border-2 border-background">
                                <Image
                                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                            <div className="p-3 border-b border-border bg-muted/30">
                                <p className="text-sm font-bold text-foreground">Jane Cooper</p>
                                <p className="text-[10px] text-muted-foreground">Tenant Account</p>
                            </div>
                            <div className="p-1">
                                <Link href="/tenant/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link href="/tenant/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <Link href="/tenant/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                            </div>
                            <div className="p-1 border-t border-border">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
