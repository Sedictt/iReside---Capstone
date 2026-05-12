"use client";

import React from "react";
import { Home, Mail, MessageSquare, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

interface LeaseInfo {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    unitName: string | null;
    propertyName: string | null;
    propertyAddress: string | null;
    propertyCity: string | null;
    landlordName: string | null;
    landlordEmail: string | null;
    landlordPhone: string | null;
    landlordAvatarUrl: string | null;
    landlordAvatarBgColor: string | null;
}

interface TenantDashboardHeaderProps {
    lease: LeaseInfo | null;
}

export function TenantDashboardHeader({ lease }: TenantDashboardHeaderProps) {
    if (!lease) return null;

    return (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-6 border border-primary/20">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                            <Home className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {lease.unitName || "Your Unit"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {lease.propertyName}
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card/50 rounded-2xl p-4 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Rent</p>
                            <p className="text-xl font-bold text-foreground">
                                ₱{lease.monthlyRent.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="bg-card/50 rounded-2xl p-4 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Lease Period</p>
                            <p className="text-sm font-medium text-foreground">
                                <ClientOnlyDate date={lease.startDate} /> - <ClientOnlyDate date={lease.endDate} />
                            </p>
                        </div>
                        
                        <div className="bg-card/50 rounded-2xl p-4 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                            <p className="text-sm font-medium capitalize text-primary">
                                {lease.status}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 ml-6">
                    <Link
                        href={`mailto:${lease.landlordEmail}`}
                        className="flex size-10 items-center justify-center rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                    >
                        <Mail className="size-4 text-muted-foreground" />
                    </Link>
                    <Link
                        href="/tenant/messages"
                        className="flex size-10 items-center justify-center rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                    >
                        <MessageSquare className="size-4 text-muted-foreground" />
                    </Link>
                    <button className="flex size-10 items-center justify-center rounded-xl bg-card border border-border hover:bg-muted transition-colors">
                        <MoreHorizontal className="size-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
}
