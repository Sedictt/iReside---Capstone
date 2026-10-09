import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MobileAmenityBookingDrawer } from '../MobileAmenityBookingDrawer';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
    };
});

// Mock haptics
vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockAmenities = [
    {
        id: 'amenity-1',
        name: 'Skyline Fitness Gym',
        type: 'Fitness',
        description: 'Modern cardiovascular and strength training equipment.',
        price_per_unit: 0,
        unit_type: 'hr',
        capacity: 15,
        image_url: null,
        icon_name: 'Dumbbell',
        location_details: 'Level 4, East Tower',
    },
    {
        id: 'amenity-2',
        name: 'Clubhouse Banquet Hall',
        type: 'Events',
        description: 'Spacious hall for parties, meetings and gatherings.',
        price_per_unit: 500,
        unit_type: 'hour',
        capacity: 50,
        image_url: null,
        icon_name: 'PartyPopper',
        location_details: 'Ground Floor, Club Area',
    },
];

const mockBookings = [
    {
        id: 'booking-1',
        amenity_id: 'amenity-1',
        booking_date: '2026-10-15',
        start_time: '14:00:00',
        end_time: '16:00:00',
        total_price: 0,
        status: 'confirmed',
        notes: 'Cardio workout',
        amenity: {
            id: 'amenity-1',
            name: 'Skyline Fitness Gym',
            type: 'Fitness',
            icon_name: 'Dumbbell',
            image_url: null,
            price_per_unit: 0,
            unit_type: 'hr',
            capacity: 15,
        },
    },
];

describe('MobileAmenityBookingDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.endsWith('/api/tenant/amenities/bookings')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ bookings: mockBookings }),
                });
            }
            if (url.endsWith('/api/tenant/amenities')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ amenities: mockAmenities, categories: ['All', 'Fitness', 'Events'] }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true }),
            });
        });
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <MobileAmenityBookingDrawer isOpen={false} onClose={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders header, tabs, and amenities when isOpen is true', async () => {
        await act(async () => {
            render(
                <MobileAmenityBookingDrawer isOpen={true} onClose={vi.fn()} />
            );
        });

        expect(screen.getByText('Property Amenities')).toBeDefined();
        expect(screen.getByText('Browse Facilities')).toBeDefined();
        expect(screen.getByText('My Bookings')).toBeDefined();

        await waitFor(() => {
            expect(screen.getByText('Skyline Fitness Gym')).toBeDefined();
            expect(screen.getByText('Clubhouse Banquet Hall')).toBeDefined();
        });

        expect(screen.getByText('Level 4, East Tower')).toBeDefined();
        expect(screen.getByText('Ground Floor, Club Area')).toBeDefined();
    });

    it('switches to My Bookings tab and displays reservations', async () => {
        await act(async () => {
            render(
                <MobileAmenityBookingDrawer isOpen={true} onClose={vi.fn()} />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Skyline Fitness Gym')).toBeDefined();
        });

        const myBookingsTab = screen.getByTestId('tab-my-bookings');
        await act(async () => {
            fireEvent.click(myBookingsTab);
        });

        await waitFor(() => {
            expect(screen.getByText('1 Booking recorded')).toBeDefined();
            expect(screen.getByText(/Cardio workout/i)).toBeDefined();
            expect(screen.getByText('confirmed')).toBeDefined();
        });
    });

    it('opens booking sub-form when clicking Reserve button', async () => {
        await act(async () => {
            render(
                <MobileAmenityBookingDrawer isOpen={true} onClose={vi.fn()} />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Skyline Fitness Gym')).toBeDefined();
        });

        const reserveButtons = screen.getAllByText('Reserve');

        await act(async () => {
            fireEvent.click(reserveButtons[0]);
        });

        await waitFor(() => {
            expect(screen.getByText('Reserve Skyline Fitness Gym')).toBeDefined();
            expect(screen.getByText('1. Reservation Date')).toBeDefined();
            expect(screen.getByText('2. Start Time Slot')).toBeDefined();
            expect(screen.getByText('3. Duration')).toBeDefined();
            expect(screen.getByText('Confirm Facility Reservation')).toBeDefined();
        });
    });

    it('pre-selects amenity when initialAmenityId is passed', async () => {
        await act(async () => {
            render(
                <MobileAmenityBookingDrawer
                    isOpen={true}
                    onClose={vi.fn()}
                    initialAmenityId="amenity-2"
                />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Reserve Clubhouse Banquet Hall')).toBeDefined();
            expect(screen.getByText('Ground Floor, Club Area')).toBeDefined();
        });
    });
});
