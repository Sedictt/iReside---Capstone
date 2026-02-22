"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Building2, Plus, Map as MapIcon, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";


// Dynamically import map components to avoid SSR issues
const Map = dynamic(
    () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
    { ssr: false, loading: () => <div className="h-full w-full bg-slate-800 animate-pulse" /> }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => ({ default: mod.TileLayer })),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => ({ default: mod.Marker })),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => ({ default: mod.Popup })),
    { ssr: false }
);

interface Property {
    id: string;
    name: string;
    address: string;
    units: number;
    occupancy: number;
    lat: number;
    lng: number;
}

const mockProperties: Property[] = [
    {
        id: "1",
        name: "Skyview Apartments",
        address: "123 Main St, New York, NY",
        units: 120,
        occupancy: 98,
        lat: 40.7128,
        lng: -74.006,
    },
    {
        id: "2",
        name: "Harbor Point",
        address: "456 Water St, Boston, MA",
        units: 85,
        occupancy: 95,
        lat: 42.3601,
        lng: -71.0589,
    },
    {
        id: "3",
        name: "Golden Gate Lofts",
        address: "789 Market St, San Francisco, CA",
        units: 45,
        occupancy: 100,
        lat: 37.7749,
        lng: -122.4194,
    },
];

export default function PropertiesPage() {
    const [view, setView] = useState<"grid" | "map">("grid");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // @ts-ignore - Load leaflet compatibility only on client
        import("leaflet-defaulticon-compatibility");
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Properties</h1>
                    <p className="text-slate-400">Manage your real estate portfolio</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-1">
                        <button
                            onClick={() => setView("grid")}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                view === "grid"
                                    ? "bg-slate-700 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Grid className="h-4 w-4" />
                            Grid
                        </button>
                        <button
                            onClick={() => setView("map")}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                view === "map"
                                    ? "bg-slate-700 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <MapIcon className="h-4 w-4" />
                            Map
                        </button>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500">
                        <Plus className="h-4 w-4" />
                        Add Property
                    </button>
                </div>
            </div>

            {view === "grid" ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {mockProperties.map((property) => (
                        <div
                            key={property.id}
                            className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:bg-slate-800/50"
                        >
                            <div className="aspect-video w-full bg-slate-800">
                                {/* Image Placeholder */}
                                <div className="flex h-full w-full items-center justify-center text-slate-600">
                                    <Building2 className="h-12 w-12" />
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {property.name}
                                </h3>
                                <p className="text-sm text-slate-400">{property.address}</p>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Units</p>
                                        <p className="font-medium text-slate-200">{property.units}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Occupancy</p>
                                        <p className="font-medium text-emerald-400">{property.occupancy}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[600px] w-full overflow-hidden rounded-xl border border-slate-800">
                    {isClient && (
                        // @ts-ignore - React-Leaflet types issue with dynamic import
                        <Map center={[39.8283, -98.5795]} zoom={4} style={{ height: "100%", width: "100%" }}>
                            {/* @ts-ignore */}
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {mockProperties.map((property) => (
                                // @ts-ignore
                                <Marker key={property.id} position={[property.lat, property.lng]}>
                                    {/* @ts-ignore */}
                                    <Popup>
                                        <div className="text-slate-900">
                                            <strong>{property.name}</strong>
                                            <br />
                                            {property.units} Units
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </Map>
                    )}
                </div>
            )}
        </div>
    );
}
