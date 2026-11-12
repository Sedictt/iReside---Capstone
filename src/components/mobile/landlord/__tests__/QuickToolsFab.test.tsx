import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { QuickToolsFab } from '../QuickToolsFab';

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('@/context/LanguageContext', () => ({
    useLanguageContext: () => ({
        t: (str: string) => str,
        locale: 'en',
        language: 'en',
    }),
}));

describe('QuickToolsFab (Instagram-Instants-style edge peeking FAB)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('peeks at the edge, reveals on interaction, and auto-hides back after idle timeout', () => {
        const onOpenFlyer = vi.fn();
        render(<QuickToolsFab onOpenFlyer={onOpenFlyer} idleTimeoutMs={4000} />);

        const fab = screen.getByRole('button', { name: /Show Quick Tools/i });
        expect(fab).toHaveAttribute('data-fab-state', 'peeking');

        // Tap peeking handle -> reveals full FAB
        fireEvent.click(fab);
        expect(fab).toHaveAttribute('data-fab-state', 'revealed');

        // Wait 3.9s -> still revealed
        act(() => {
            vi.advanceTimersByTime(3900);
        });
        expect(fab).toHaveAttribute('data-fab-state', 'revealed');

        // Pass 4.0s -> automatically tucks back to peeking
        act(() => {
            vi.advanceTimersByTime(150);
        });
        expect(fab).toHaveAttribute('data-fab-state', 'peeking');
    });

    it('opens the tools sheet when tapped while revealed, triggers Lobby Flyer, and closes on Escape', () => {
        const onOpenFlyer = vi.fn();
        render(<QuickToolsFab onOpenFlyer={onOpenFlyer} />);

        const fab = screen.getByRole('button', { name: /Show Quick Tools/i });
        fireEvent.click(fab); // reveal
        fireEvent.click(fab); // open sheet

        expect(screen.getByRole('dialog', { name: /Quick Actions & Tools/i })).toBeInTheDocument();

        // Escape dismisses drawer back to peeking
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(fab).toHaveAttribute('data-fab-state', 'peeking');

        // Reopen and verify complete grouped actions including Water & Electricity
        fireEvent.click(fab);
        fireEvent.click(fab);
        expect(screen.getByText('Billing & Money')).toBeInTheDocument();
        expect(screen.getByText('Rooms & Residents')).toBeInTheDocument();
        expect(screen.getByText('Schedules & Tools')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Water & Electricity/i })).toHaveAttribute('href', '/mobile/utilities');
        expect(screen.getByRole('link', { name: /Bills & Receipts/i })).toHaveAttribute('href', '/mobile/landlord/payments');
        expect(screen.getByRole('link', { name: /Lease Contracts/i })).toHaveAttribute('href', '/mobile/landlord/leases');
        expect(screen.getByRole('link', { name: /Help & Manual/i })).toHaveAttribute('href', '/landlord/docs');

        fireEvent.click(screen.getByRole('button', { name: /Lobby Flyer/i }));
        expect(onOpenFlyer).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
