"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Profile } from '@/types';

interface ProfileCardContextType {
    isOpen: boolean;
    userId: string | null;
    initialData: Partial<Profile> | null;
    position: { x: number; y: number } | null;
    openProfile: (id: string, data?: Partial<Profile>, pos?: { x: number; y: number }) => void;
    closeProfile: () => void;
    // Detail Modal State
    isDetailModalOpen: boolean;
    detailModalTenantId: string | null;
    detailModalTab: 'profile' | 'documents' | 'activity';
    openDetailModal: (id: string, tab?: 'profile' | 'documents' | 'activity') => void;
    closeDetailModal: () => void;
}

const ProfileCardContext = createContext<ProfileCardContextType | undefined>(undefined);

export function ProfileCardProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<Partial<Profile> | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailModalTenantId, setDetailModalTenantId] = useState<string | null>(null);
    const [detailModalTab, setDetailModalTab] = useState<'profile' | 'documents' | 'activity'>('profile');

    const openProfile = useCallback((id: string, data?: Partial<Profile>, pos?: { x: number; y: number }) => {
        setUserId(id);
        setInitialData(data || null);
        setPosition(pos || null);
        setIsOpen(true);
    }, []);

    const closeProfile = useCallback(() => {
        setIsOpen(false);
    }, []);

    const openDetailModal = useCallback((id: string, tab: 'profile' | 'documents' | 'activity' = 'profile') => {
        setDetailModalTenantId(id);
        setDetailModalTab(tab);
        setIsDetailModalOpen(true);
        setIsOpen(false); // Close the profile card when opening the detail modal
    }, []);

    const closeDetailModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setDetailModalTenantId(null);
    }, []);

    return (
        <ProfileCardContext.Provider value={{ 
            isOpen, userId, initialData, position, openProfile, closeProfile,
            isDetailModalOpen, detailModalTenantId, detailModalTab, openDetailModal, closeDetailModal
        }}>
            {children}
        </ProfileCardContext.Provider>
    );
}

export function useProfileCard() {
    const context = useContext(ProfileCardContext);
    if (context === undefined) {
        throw new Error('useProfileCard must be used within a ProfileCardProvider');
    }
    return context;
}
