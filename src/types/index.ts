export type UserRole = 'tenant' | 'landlord';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    avatar_url?: string;
    createdAt: string;
}

export interface Unit {
    id: string;
    propertyId: string;
    name: string;
    floor: number;
    status: 'occupied' | 'vacant' | 'maintenance';
    rentAmount: number;
}
