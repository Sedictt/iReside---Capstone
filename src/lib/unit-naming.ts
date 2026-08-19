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
