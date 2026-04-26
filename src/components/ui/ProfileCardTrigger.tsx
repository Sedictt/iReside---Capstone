"use client";

import React from 'react';
import { useProfileCard } from '@/context/ProfileCardContext';
import { Profile } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileCardTriggerProps {
    userId: string;
    initialData?: Partial<Profile>;
    children: React.ReactNode;
    className?: string;
    asChild?: boolean;
}

export function ProfileCardTrigger({ 
    userId, 
    initialData, 
    children, 
    className,
    asChild = false 
}: ProfileCardTriggerProps) {
    const { openProfile } = useProfileCard();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (userId) {
            openProfile(userId, initialData, { x: e.clientX, y: e.clientY });
        }
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: handleClick,
            className: cn((children as React.ReactElement<any>).props.className, className, "cursor-pointer"),
        });
    }

    return (
        <span 
            onClick={handleClick} 
            className={cn("cursor-pointer hover:underline decoration-primary/50 underline-offset-2", className)}
        >
            {children}
        </span>
    );
}
