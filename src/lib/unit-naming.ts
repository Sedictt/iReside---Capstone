export type NumberingStyle = "floor_based" | "sequential";

export interface UnitNamingOptions {
    prefix?: string;
    numberingStyle?: NumberingStyle;
    startingNumber?: number;
    totalFloors?: number;
    totalUnits?: number;
}

export function generateUnitName(
    overallIndex: number, // 0-indexed across all units
    floorNumber: number,  // 1-indexed (or 0 for ground)
    unitIndexOnFloor: number, // 1-indexed on this floor
    options: UnitNamingOptions
): string {
    const prefix = (options.prefix?.trim() ?? "Unit").trim();
    const style = options.numberingStyle ?? "floor_based";
    const startNum = Math.max(1, Number(options.startingNumber) || 1);

    const prefixStr = prefix.length > 0 ? `${prefix} ` : "";

    if (style === "floor_based") {
        // Floor-based: Floor 1 -> 101, 102; Floor 2 -> 201, 202; Ground Floor -> G01, G02
        if (floorNumber === 0) {
            const numStr = String(unitIndexOnFloor).padStart(2, "0");
            return `${prefixStr}G${numStr}`;
        }
        const unitDigits = unitIndexOnFloor < 10 ? `0${unitIndexOnFloor}` : `${unitIndexOnFloor}`;
        return `${prefixStr}${floorNumber}${unitDigits}`;
    }

    // Sequential style: startingNumber, startingNumber + 1, ...
    const sequentialNumber = startNum + overallIndex;
    return `${prefixStr}${sequentialNumber}`;
}

export function generateUnitList(
    totalUnits: number,
    totalFloors: number,
    options: UnitNamingOptions
): Array<{ name: string; floor: number }> {
    const floorsCount = Math.max(1, totalFloors);
    const unitsCount = Math.max(1, totalUnits);
    const unitsPerFloor = Math.ceil(unitsCount / floorsCount);

    const result: Array<{ name: string; floor: number }> = [];
    const floorCounters: Record<number, number> = {};

    for (let i = 0; i < unitsCount; i++) {
        const floorNumber = floorsCount === 1 ? 1 : Math.min(floorsCount, Math.floor(i / unitsPerFloor) + 1);
        floorCounters[floorNumber] = (floorCounters[floorNumber] || 0) + 1;
        const unitIndexOnFloor = floorCounters[floorNumber];

        const name = generateUnitName(i, floorNumber, unitIndexOnFloor, {
            ...options,
            totalFloors: floorsCount,
            totalUnits: unitsCount,
        });

        result.push({ name, floor: floorNumber });
    }

    return result;
}

export function detectPrefixFromUnits(units: Array<{ name: string }>): string {
    const counts: Record<string, number> = {};
    for (const u of units) {
        if (!u.name) continue;
        const trimmed = u.name.trim();
        const match = trimmed.match(/^(.*?)(?:[\s\-_]*)(?:[A-Za-z]?\d+)$/);
        if (match && match[1] !== undefined) {
            const prefix = match[1].trim();
            counts[prefix] = (counts[prefix] || 0) + 1;
        }
    }
    let bestPrefix = "";
    let maxCount = 0;
    for (const [p, c] of Object.entries(counts)) {
        if (c > maxCount) {
            maxCount = c;
            bestPrefix = p;
        }
    }
    return maxCount > 0 ? bestPrefix : "Unit";
}

export function renumberUnitsList<T extends { id: string; floor: number; name: string }>(
    unitsList: T[],
    options?: {
        prefix?: string;
        numberingStyle?: NumberingStyle;
        startingNumber?: number;
    }
): T[] {
    const prefix = options?.prefix ?? detectPrefixFromUnits(unitsList);
    const style = options?.numberingStyle ?? "floor_based";
    const startNum = options?.startingNumber ?? 101;

    // Group units by floor, preserving existing relative order within each floor
    const floorGroups = new Map<number, T[]>();
    for (const u of unitsList) {
        const f = u.floor;
        const group = floorGroups.get(f) ?? [];
        group.push(u);
        floorGroups.set(f, group);
    }

    // Sort assigned floors: 0, 1, 2, ...
    const sortedFloors = Array.from(floorGroups.keys())
        .filter(f => f >= 0)
        .sort((a, b) => a - b);

    let overallIndex = 0;
    const renumberedMap = new Map<string, string>();

    for (const floorNum of sortedFloors) {
        const floorUnits = floorGroups.get(floorNum) || [];
        let unitIndexOnFloor = 1;

        for (const unit of floorUnits) {
            const newName = generateUnitName(overallIndex, floorNum, unitIndexOnFloor, {
                prefix,
                numberingStyle: style,
                startingNumber: startNum,
            });
            renumberedMap.set(unit.id, newName);
            unitIndexOnFloor++;
            overallIndex++;
        }
    }

    // Unassigned units (-1) keep their names
    const unassignedUnits = floorGroups.get(-1) || [];
    for (const unit of unassignedUnits) {
        renumberedMap.set(unit.id, unit.name);
    }

    return unitsList.map(u => ({
        ...u,
        name: renumberedMap.get(u.id) ?? u.name,
    }));
}
