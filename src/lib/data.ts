
import {
    Wifi, Snowflake, Car, PawPrint, WashingMachine, Dumbbell, Shield,
    UtensilsCrossed, Droplets, Tv, Wind, ChevronUp, Flame, CircleUser
} from "lucide-react";

export interface Property {
    id: string;
    name: string;
    address: string;
    price: string;
    numericPrice: number;
    beds: number;
    baths: number;
    sqft: number;
    lat: number;
    lng: number;
    amenities: string[];
    description: string;
    houseRules: string[];
    images: string[];
    matchScore: number;
    isNew?: boolean;
    featured?: boolean;
    type?: "Apartment" | "Condo" | "House" | "Townhouse" | "Studio";
}

export const properties: Property[] = [
    {
        id: "1",
        name: "Skyline Lofts",
        address: "Maysan, Valenzuela",
        price: "₱15,000",
        numericPrice: 15000,
        beds: 2,
        baths: 2,
        sqft: 1150,
        lat: 14.6865,
        lng: 121.0366,
        amenities: ["WiFi", "Air Con", "Gym", "Security", "Elevator"],
        description: "Experience modern urban living in this stunning loft. Featuring floor-to-ceiling windows, polished concrete floors, and a chef's kitchen with smart appliances. Located in the heart of the innovation district.",
        houseRules: ["Pets Allowed", "No Smoking", "No Parties"],
        images: [
            "/hero-images/apartment-01.png",
            "/hero-images/apartment-02.png",
            "/hero-images/apartment-03.png",
            "/hero-images/dorm-01.png"
        ],
        matchScore: 98,
        isNew: true,
        featured: true,
        type: "Condo"
    },
    {
        id: "2",
        name: "The Garden Residences",
        address: "Paso de Blas, Valenzuela",
        price: "₱12,500",
        numericPrice: 12500,
        beds: 3,
        baths: 2,
        sqft: 1400,
        lat: 14.6930,
        lng: 121.0450,
        amenities: ["Parking", "Garden", "Kitchen", "Laundry"],
        description: "Spacious family home with a private garden.",
        houseRules: ["No Smoking"],
        images: ["/hero-images/apartment-02.png"],
        matchScore: 85,
        type: "House"
    },
    {
        id: "3",
        name: "Metro Studio B",
        address: "Marulas, Valenzuela",
        price: "₱8,500",
        numericPrice: 8500,
        beds: 1,
        baths: 1,
        sqft: 450,
        lat: 14.6750,
        lng: 121.0400,
        amenities: ["WiFi", "Air Con", "Cable TV"],
        description: "Perfect for students or young professionals.",
        houseRules: ["No Pets", "No Smoking"],
        images: ["/hero-images/dorm-01.png"],
        matchScore: 92,
        type: "Studio"
    },
    {
        id: "4",
        name: "Lakeside Villa",
        address: "Dalandanan, Valenzuela",
        price: "₱25,000",
        numericPrice: 25000,
        beds: 4,
        baths: 3,
        sqft: 2200,
        lat: 14.6990,
        lng: 121.0550,
        amenities: ["Pool", "Parking", "WiFi", "Fireplace", "Balcony"],
        description: "Luxurious villa with a clear view of the lake.",
        houseRules: ["Pets Allowed", "No Smoking"],
        images: ["/hero-images/apartment-03.png"],
        matchScore: 95,
        featured: true,
        type: "House"
    },
    {
        id: "5",
        name: "Downtown Apartment",
        address: "Karuhatan, Valenzuela",
        price: "₱10,000",
        numericPrice: 10000,
        beds: 2,
        baths: 1,
        sqft: 800,
        lat: 14.6890,
        lng: 121.0330,
        amenities: ["WiFi", "Water", "Security"],
        description: "Conveniently located near the city center.",
        houseRules: ["No Pets"],
        images: ["/hero-images/dorm-02.png"],
        matchScore: 88,
        type: "Apartment"
    }
];

export const amenitiesList = [
    { name: "WiFi", icon: Wifi },
    { name: "Air Con", icon: Snowflake },
    { name: "Parking", icon: Car },
    { name: "Pet Friendly", icon: PawPrint },
    { name: "Laundry", icon: WashingMachine },
    { name: "Gym", icon: Dumbbell },
    { name: "Security", icon: Shield },
    { name: "Kitchen", icon: UtensilsCrossed },
    { name: "Water", icon: Droplets },
    { name: "Cable TV", icon: Tv },
    { name: "Pool", icon: Droplets },
    { name: "Balcony", icon: Wind },
    { name: "Elevator", icon: ChevronUp },
    { name: "Fireplace", icon: Flame },
    { name: "Wheelchair Access", icon: CircleUser },
];
