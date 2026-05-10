"use client";

import { useProfileCard } from "@/context/ProfileCardContext";
import { TenantDetailModal } from "./TenantDetailModal";

export function GlobalDetailModal() {
    const { 
        isDetailModalOpen, 
        detailModalTenantId, 
        detailModalTab, 
        closeDetailModal 
    } = useProfileCard();

    if (!detailModalTenantId) return null;

    return (
        <TenantDetailModal
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
            tenantId={detailModalTenantId}
            initialTab={detailModalTab}
        />
    );
}
