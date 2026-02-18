
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
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=1000&auto=format&fit=crop"
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
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000&auto=format&fit=crop"],
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
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop"],
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
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop"],
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
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop"],
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
