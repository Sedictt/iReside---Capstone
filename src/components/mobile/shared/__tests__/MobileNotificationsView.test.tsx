import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileNotificationsView } from '../MobileNotificationsView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

const mockNotifications = [
    {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'lease_renewal_request',
        title: 'New Lease Renewal Proposal',
        message: 'Tenant requested a 1-year extension.',
        read: false,
        created_at: new Date().toISOString(),
        data: { leaseId: 'lease-123' },
    },
    {
        id: 'notif-2',
        user_id: 'user-1',
        type: 'move_out_approved',
        title: 'Notice to Vacate Submitted',
        message: 'Tenant filed intent to vacate on Nov 30.',
        read: false,
        created_at: new Date().toISOString(),
        data: { leaseId: 'lease-123' },
    },
    {
        id: 'notif-3',
        user_id: 'user-1',
        type: 'payment',
        title: 'Rent Payment Received',
        message: 'Payment of ₱12,000 received.',
        read: true,
        created_at: new Date().toISOString(),
        data: { paymentId: 'pay-789' },
    },
    {
        id: 'notif-4',
        user_id: 'user-1',
        type: 'announcement',
        title: 'Facility Booking Confirmed',
        message: 'Gym reservation confirmed for tomorrow.',
        read: false,
        created_at: new Date().toISOString(),
        data: { amenityId: 'amenity-1' },
    },
];

let currentRole = 'landlord';

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        profile: { id: 'user-1', role: currentRole, full_name: 'Test User' },
        loading: false,
    }),
}));

const mockMarkAsRead = vi.fn().mockResolvedValue(true);
const mockDeleteNotification = vi.fn().mockResolvedValue(true);

vi.mock('@/context/NotificationContext', () => ({
    useNotifications: () => ({
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter(n => !n.read).length,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: vi.fn().mockResolvedValue(true),
        deleteNotification: mockDeleteNotification,
        refresh: vi.fn(),
    }),
}));

vi.mock('@/context/LanguageContext', () => ({
    useLanguageContext: () => ({
        t: (str: string, vars?: any) => {
            if (!vars) return str;
            let res = str;
            Object.keys(vars).forEach(k => {
                res = res.replace(`{${k}}`, vars[k]);
            });
            return res;
        },
        locale: 'en',
    }),
}));

vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('MobileNotificationsView (Phase 9 Deep Linking)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentRole = 'landlord';
    });

    it('renders notification list and filter tabs', () => {
        render(<MobileNotificationsView />);

        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Unread')).toBeInTheDocument();
        expect(screen.getByText('New Lease Renewal Proposal')).toBeInTheDocument();
        expect(screen.getByText('Notice to Vacate Submitted')).toBeInTheDocument();
    });

    it('deep-links landlord lease renewal notification directly to /mobile/landlord/leases?tab=renewals', async () => {
        currentRole = 'landlord';
        render(<MobileNotificationsView />);

        const item = screen.getByText('New Lease Renewal Proposal');
        fireEvent.click(item);

        await waitFor(() => {
            expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
            expect(mockPush).toHaveBeenCalledWith('/mobile/landlord/leases?tab=renewals');
        });
    });

    it('deep-links landlord move out notification directly to /mobile/landlord/move-out', async () => {
        currentRole = 'landlord';
        render(<MobileNotificationsView />);

        const item = screen.getByText('Notice to Vacate Submitted');
        fireEvent.click(item);

        await waitFor(() => {
            expect(mockMarkAsRead).toHaveBeenCalledWith('notif-2');
            expect(mockPush).toHaveBeenCalledWith('/mobile/landlord/move-out');
        });
    });

    it('deep-links tenant move out notification directly to /mobile/tenant/lease', async () => {
        currentRole = 'tenant';
        render(<MobileNotificationsView />);

        const item = screen.getByText('Notice to Vacate Submitted');
        fireEvent.click(item);

        await waitFor(() => {
            expect(mockMarkAsRead).toHaveBeenCalledWith('notif-2');
            expect(mockPush).toHaveBeenCalledWith('/mobile/tenant/lease');
        });
    });

    it('deep-links tenant amenity notification to /mobile/tenant/calendar', async () => {
        currentRole = 'tenant';
        render(<MobileNotificationsView />);

        const item = screen.getByText('Facility Booking Confirmed');
        fireEvent.click(item);

        await waitFor(() => {
            expect(mockMarkAsRead).toHaveBeenCalledWith('notif-4');
            expect(mockPush).toHaveBeenCalledWith('/mobile/tenant/calendar');
        });
    });
});
