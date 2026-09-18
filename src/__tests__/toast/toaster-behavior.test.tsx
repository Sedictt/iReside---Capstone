import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppToaster } from '@/components/ui/AppToaster';
import { toast } from 'sonner';

describe('AppToaster Adaptive Stacking and Auto-Dismissal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        act(() => {
            toast.dismiss();
            vi.advanceTimersByTime(500);
        });
        vi.useRealTimers();
    });

    it('Scenario 1: Single toast displays standalone (expand=false) and automatically closes after 4000ms', async () => {
        render(<AppToaster />);

        act(() => {
            toast.success('Single notification');
        });
        act(() => {
            vi.advanceTimersByTime(50);
        });

        const toastEl = screen.getByText('Single notification');
        expect(toastEl).toBeDefined();

        // Single toast -> data-expanded should be false
        const li = toastEl.closest('li');
        expect(li?.getAttribute('data-expanded')).toBe('false');

        // Advance 4000ms (toast duration) + flush dismissal RAF & unmount (500ms)
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Automatically removed from DOM
        expect(screen.queryByText('Single notification')).toBeNull();
    });

    it('Scenario 2: Exactly 2 toasts stack vertically (expand=true) with reasonable spacing', async () => {
        render(<AppToaster />);

        act(() => {
            toast.success('First notification');
            toast.info('Second notification');
        });
        act(() => {
            vi.advanceTimersByTime(50);
        });

        const toast1 = screen.getByText('First notification');
        const toast2 = screen.getByText('Second notification');
        expect(toast1).toBeDefined();
        expect(toast2).toBeDefined();

        // 2 toasts -> data-expanded should be true to display both vertically stacked
        const li1 = toast1.closest('li');
        const li2 = toast2.closest('li');
        expect(li1?.getAttribute('data-expanded')).toBe('true');
        expect(li2?.getAttribute('data-expanded')).toBe('true');
    });

    it('Scenario 3: 3 or more toasts stack in an iOS-style card deck (expand=false)', async () => {
        const { container } = render(<AppToaster />);

        act(() => {
            toast.success('Notification 1');
            toast.info('Notification 2');
            toast.warning('Notification 3');
        });
        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(screen.getByText('Notification 1')).toBeDefined();
        expect(screen.getByText('Notification 2')).toBeDefined();
        expect(screen.getByText('Notification 3')).toBeDefined();

        // 3 toasts -> data-expanded is false (iOS card deck)
        const activeToasts = container.querySelectorAll('[data-sonner-toast]');
        expect(activeToasts.length).toBeGreaterThanOrEqual(3);

        // The most recently added toast (Notification 3) is the front toast (index 0)
        const frontToast = screen.getByText('Notification 3').closest('li');
        expect(frontToast?.getAttribute('data-expanded')).toBe('false');
        expect(frontToast?.getAttribute('data-front')).toBe('true');
        expect(frontToast?.getAttribute('data-index')).toBe('0');

        const secondToast = screen.getByText('Notification 2').closest('li');
        expect(secondToast?.getAttribute('data-front')).toBe('false');
        expect(secondToast?.getAttribute('data-index')).toBe('1');

        const thirdToast = screen.getByText('Notification 1').closest('li');
        expect(thirdToast?.getAttribute('data-front')).toBe('false');
        expect(thirdToast?.getAttribute('data-index')).toBe('2');

        // Sequential FIFO Dismissal Verification:
        // After 4000ms + RAF flush, only the FIRST notification (Notification 1) has collapsed!
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(screen.queryByText('Notification 1')).toBeNull();
        expect(screen.getByText('Notification 2')).toBeDefined();
        expect(screen.getByText('Notification 3')).toBeDefined();

        // After another 4000ms + RAF flush, the SECOND notification (Notification 2) collapses!
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(screen.queryByText('Notification 1')).toBeNull();
        expect(screen.queryByText('Notification 2')).toBeNull();
        expect(screen.getByText('Notification 3')).toBeDefined();

        // After final 4000ms + RAF flush, the THIRD notification collapses and all are cleared!
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(screen.queryByText('Notification 1')).toBeNull();
        expect(screen.queryByText('Notification 2')).toBeNull();
        expect(screen.queryByText('Notification 3')).toBeNull();
    });

    it('Scenario 4: Graceful transition when count drops from 3 to 2', async () => {
        render(<AppToaster />);

        let id3: string | number = '';
        act(() => {
            toast.success('Toast One');
            toast.info('Toast Two');
            id3 = toast.warning('Toast Three');
        });
        act(() => {
            vi.advanceTimersByTime(50);
        });

        // 3 active -> shouldExpand is false
        const liOne = screen.getByText('Toast One').closest('li');
        expect(liOne?.getAttribute('data-expanded')).toBe('false');

        // Dismiss Toast Three
        act(() => {
            toast.dismiss(id3);
            vi.advanceTimersByTime(300);
        });

        // Toast Three dismissed -> 2 remaining -> shouldExpand automatically becomes true!
        const remainingOne = screen.getByText('Toast One').closest('li');
        const remainingTwo = screen.getByText('Toast Two').closest('li');
        expect(remainingOne?.getAttribute('data-expanded')).toBe('true');
        expect(remainingTwo?.getAttribute('data-expanded')).toBe('true');
    });
});
