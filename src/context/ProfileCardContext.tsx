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
}

const ProfileCardContext = createContext<ProfileCardContextType | undefined>(undefined);

export function ProfileCardProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<Partial<Profile> | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    const openProfile = useCallback((id: string, data?: Partial<Profile>, pos?: { x: number; y: number }) => {
        setUserId(id);
        setInitialData(data || null);
        setPosition(pos || null);
        setIsOpen(true);
    }, []);

    const closeProfile = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ProfileCardContext.Provider value={{ isOpen, userId, initialData, position, openProfile, closeProfile }}>
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
