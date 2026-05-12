"use client";

import React from "react";
import { CreditCard, ArrowUpRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

interface NextPayment {
    id: string;
    amount: number;
    dueDate: string;
    description: string | null;
}

interface OverduePayment {
    id: string;
    amount: number;
    dueDate: string;
    description: string | null;
    reference: string | null;
}

interface PaymentSummaryProps {
    nextPayment: NextPayment | null;
    overduePayments: OverduePayment[];
}

export function PaymentSummary({ nextPayment, overduePayments }: PaymentSummaryProps) {
    const hasOverduePayments = overduePayments.length > 0;

    return (
        <div className="space-y-4">
            {/* Overdue Payments Alert */}
            {hasOverduePayments && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="size-5 text-rose-500 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">Overdue Payments</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                You have {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''}. Please pay as soon as possible.
                            </p>
                            <div className="space-y-2">
                                {overduePayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium text-foreground">{payment.description || "Rent Payment"}</p>
                                            <p className="text-muted-foreground">Due: <ClientOnlyDate date={payment.dueDate} /></p>
                                        </div>
                                        <p className="font-semibold text-rose-500">₱{payment.amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Next Payment */}
            {nextPayment && !hasOverduePayments && (
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                                <CreditCard className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Next Payment</h3>
                                <p className="text-sm text-muted-foreground">
                                    Due: <ClientOnlyDate date={nextPayment.dueDate} />
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                                ₱{nextPayment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {nextPayment.description || "Monthly Rent"}
                            </p>
                        </div>
                    </div>
                    
                    <Link
                        href={`/tenant/payments/${nextPayment.id}/checkout`}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white rounded-xl py-3 font-medium hover:bg-blue-600 transition-colors"
                    >
                        Pay Now
                        <ArrowUpRight className="size-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
