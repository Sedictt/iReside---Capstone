"use client";

import { AlertTriangle, Bell, CheckCircle2, HandCoins, History, Receipt, TrendingUp, Zap } from "lucide-react";
import { NotificationCard } from "@/components/messaging/NotificationCard";
import { OfficialReceipt } from "@/components/messaging/OfficialReceipt";
import type { MiniChatMessage, MiniChatRole } from "./types";
import { formatFullTimestamp } from "./utils";

const systemIcon = (type: string) => {
    switch (type) {
        case "awaiting_in_person":
            return <HandCoins className="size-5" />;
        case "reminder_sent":
            return <Bell className="size-5" />;
        case "invoice":
            return <Receipt className="size-5" />;
        case "landlord_review":
            return <History className="size-5" />;
        default:
            return <Zap className="size-5" />;
    }
};

interface MiniChatSystemMessageProps {
    message: MiniChatMessage;
    viewerRole: MiniChatRole;
}

export function MiniChatSystemMessage({ message, viewerRole }: MiniChatSystemMessageProps) {
    const isOverpayment = message.issueType === "excessive_amount";
    const isRejected = message.workflowStatus === "rejected";
    const isResolved = Boolean(message.metadata?.isResolved);

    if (message.systemType === "invoice") {
        return (
            <div className="flex w-full flex-col items-center gap-2">
                <OfficialReceipt message={message as never} isCompact role={viewerRole} />
            </div>
        );
    }

    if (message.systemType === "landlord_review") {
        return (
            <NotificationCard
                message={message}
                icon={isOverpayment ? <TrendingUp className="size-6" /> : isRejected ? <AlertTriangle className="size-6" /> : <CheckCircle2 className="size-6" />}
                title={isOverpayment
                    ? (isResolved ? "Reconciliation Complete" : "Overpayment Detected")
                    : (isRejected ? "Payment Rejected" : "Payment Confirmed")}
                subtitle={isResolved ? "Transaction Settled" : "Action Logged"}
                variant={isOverpayment ? (isResolved ? "success" : "warning") : (isRejected ? "error" : "success")}
                refundImg={typeof message.metadata?.refundProofUrl === "string" ? message.metadata.refundProofUrl : undefined}
                isCompact
            />
        );
    }

    if (message.systemType === "awaiting_in_person" || message.workflowStatus === "awaiting_in_person") {
        return (
            <NotificationCard
                message={message}
                icon={<HandCoins className="size-6" />}
                title="In-Person Payment"
                subtitle="Verification Required"
                variant="warning"
                isCompact
            />
        );
    }

    if (message.systemType === "reminder_sent") {
        return (
            <NotificationCard
                message={message}
                icon={<Bell className="size-6" />}
                title="Payment Reminder"
                subtitle="Notification Sent"
                variant="default"
                isCompact
            />
        );
    }

    return (
        <NotificationCard
            message={message}
            icon={systemIcon(message.systemType ?? "")}
            title="System Notification"
            subtitle={formatFullTimestamp(message.createdAt)}
            variant="default"
            isCompact
        />
    );
}
