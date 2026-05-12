"use client";

import React from "react";
import { Unit, Corridor, Structure } from "../types";

interface VisualCanvasProps {
    units: Unit[];
    corridors: Corridor[];
    structures: Structure[];
    scale: number;
    position: { x: number; y: number };
    activeFloor: string;
    isDark: boolean;
    onUnitClick?: (unit: Unit) => void;
    onUnitDragStart?: (unitId: string) => void;
    children?: React.ReactNode;
}

export function VisualCanvas({
    units,
    corridors,
    structures,
    scale,
    position,
    activeFloor,
    isDark,
    onUnitClick,
    onUnitDragStart,
    children
}: VisualCanvasProps) {
    return (
        <div 
            className="absolute inset-0 overflow-hidden"
            style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: '0 0'
            }}
        >
            {/* Grid Background */}
            <div 
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: isDark 
                        ? 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Corridors */}
            {corridors.map(corridor => (
                <div
                    key={corridor.id}
                    className="absolute bg-muted/30 border border-border/50 rounded-lg"
                    style={{
                        left: `${corridor.x}px`,
                        top: `${corridor.y}px`,
                        width: `${corridor.w}px`,
                        height: `${corridor.h}px`
                    }}
                >
                    <div className="flex items-center justify-center h-full">
                        <span className="text-xs font-medium text-muted-foreground">{corridor.label}</span>
                    </div>
                </div>
            ))}

            {/* Structures */}
            {structures.map(structure => (
                <div
                    key={structure.id}
                    className={`absolute border-2 rounded-lg flex flex-col items-center justify-center ${
                        structure.type === 'elevator' 
                            ? 'bg-blue-500/10 border-blue-500/30' 
                            : 'bg-green-500/10 border-green-500/30'
                    }`}
                    style={{
                        left: `${structure.x}px`,
                        top: `${structure.y}px`,
                        width: `${structure.w}px`,
                        height: `${structure.h}px`
                    }}
                >
                    <span className="material-icons-round text-2xl text-muted-foreground mb-1">
                        {structure.type === 'elevator' ? 'elevator' : 'stairs'}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground text-center px-1">
                        {structure.label}
                    </span>
                </div>
            ))}

            {/* Units */}
            {units.map(unit => (
                <div
                    key={unit.id}
                    className={`absolute border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                        unit.status === 'occupied' 
                            ? 'bg-emerald-500/20 border-emerald-500/50' 
                            : unit.status === 'vacant'
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : unit.status === 'maintenance'
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-rose-500/20 border-rose-500/50'
                    }`}
                    style={{
                        left: `${unit.x}px`,
                        top: `${unit.y}px`,
                        width: `${unit.w}px`,
                        height: `${unit.h}px`
                    }}
                    onClick={() => onUnitClick?.(unit)}
                    onMouseDown={() => onUnitDragStart?.(unit.id)}
                >
                    <div className="flex flex-col items-center justify-center h-full p-2">
                        <span className="text-sm font-black text-foreground">{unit.name}</span>
                        <span className="text-xs text-muted-foreground">{unit.bedrooms || 0}BR</span>
                        {unit.tenant && (
                            <span className="text-xs text-muted-foreground mt-1 truncate">
                                {unit.tenant}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {children}
        </div>
    );
}
