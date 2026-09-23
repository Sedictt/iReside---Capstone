import { Unit, DbUnit, Corridor, Structure } from "../types";
import { getUnitDimensions, unitTypeFromBeds } from "../utils";
import type { LayoutPresetType } from "../components/FirstTimePresetModal";

export interface GeneratedFloorLayout {
    units: Unit[];
    corridors: Corridor[];
    structures: Structure[];
}

/**
 * Generates an architectural floor layout according to the requested preset type.
 * Accurately calculates corridor placement, unit dimensions, and spacing.
 */
export function generatePresetLayout(
    presetType: LayoutPresetType,
    unitsPool: DbUnit[],
    floorNumber: number
): GeneratedFloorLayout {
    const sortedPool = [...unitsPool].sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    let unitIdx = 0;
    const getNextUnit = () => {
        if (unitIdx < sortedPool.length) return sortedPool[unitIdx++];
        return null;
    };

    const createUnit = (x: number, y: number, overrideW?: number, overrideH?: number): Unit | null => {
        const dbu = getNextUnit();
        if (!dbu) return null;
        const dims = getUnitDimensions(dbu.beds);
        const w = overrideW ?? dims.w;
        const h = overrideH ?? dims.h;
        return {
            id: dbu.id,
            dbId: dbu.id,
            name: dbu.name,
            type: unitTypeFromBeds(dbu.beds),
            status: (dbu.status as Unit["status"]) ?? "vacant",
            tenant: dbu.tenant_name,
            tenantAvatarUrl: dbu.tenant_avatar_url,
            tenantAvatarBgColor: dbu.tenant_avatar_bg_color,
            bedrooms: dbu.beds,
            baths: dbu.baths,
            areaSqm: dbu.sqft ? Math.round(dbu.sqft * 0.092903) : undefined,
            rentAmount: dbu.rent_amount,
            x,
            y,
            w,
            h,
            floor: dbu.floor ?? floorNumber,
        };
    };

    const newUnits: Unit[] = [];
    const newCorridors: Corridor[] = [];
    const GAP = 20;
    const CORRIDOR_H = 80;
    const MARGIN = 80;
    const count = sortedPool.length;

    if (presetType === "double-loaded") {
        const topCount = Math.ceil(count / 2);
        const bottomCount = count - topCount;

        const topUnits = sortedPool.slice(0, topCount);
        const bottomUnits = sortedPool.slice(topCount, count);

        let topRowW = 0;
        topUnits.forEach((u, i) => {
            topRowW += getUnitDimensions(u?.beds).w + (i > 0 ? GAP : 0);
        });

        let bottomRowW = 0;
        bottomUnits.forEach((u, i) => {
            bottomRowW += getUnitDimensions(u?.beds).w + (i > 0 ? GAP : 0);
        });

        const maxTopH = topUnits.length > 0 ? Math.max(...topUnits.map(u => getUnitDimensions(u?.beds).h)) : 140;
        const contentW = Math.max(topRowW, bottomRowW, 800);
        const corridorW = contentW + 80;
        const startX = MARGIN;
        const corridorX = startX - 40;
        const startY = MARGIN;

        // Top row
        let curTopX = startX;
        for (let i = 0; i < topCount; i++) {
            const dbu = topUnits[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(curTopX, startY + (maxTopH - dims.h), dims.w, dims.h);
            if (u) newUnits.push(u);
            curTopX += dims.w + GAP;
        }

        // Central corridor
        const corridorY = startY + maxTopH + GAP;
        newCorridors.push({
            id: `corridor-${floorNumber}-${Date.now()}-c`,
            label: "Central Corridor",
            x: corridorX,
            y: corridorY,
            w: corridorW,
            h: CORRIDOR_H,
        });

        // Bottom row
        let curBottomX = startX;
        for (let i = 0; i < bottomCount; i++) {
            const dbu = bottomUnits[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(curBottomX, corridorY + CORRIDOR_H + GAP, dims.w, dims.h);
            if (u) newUnits.push(u);
            curBottomX += dims.w + GAP;
        }
    } else if (presetType === "single-loaded") {
        let rowW = 0;
        for (let i = 0; i < count; i++) {
            const dims = getUnitDimensions(sortedPool[i]?.beds);
            rowW += dims.w + (i > 0 ? GAP : 0);
        }
        const maxUnitH = sortedPool.length > 0 ? Math.max(...sortedPool.map(u => getUnitDimensions(u?.beds).h)) : 140;
        const contentW = Math.max(rowW, 800);
        const corridorW = contentW + 80;
        const startX = MARGIN;
        const corridorX = startX - 40;
        const startY = MARGIN;

        let curX = startX;
        for (let i = 0; i < count; i++) {
            const dbu = sortedPool[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(curX, startY + (maxUnitH - dims.h), dims.w, dims.h);
            if (u) newUnits.push(u);
            curX += dims.w + GAP;
        }

        newCorridors.push({
            id: `corridor-${floorNumber}-${Date.now()}-main`,
            label: "Main Corridor",
            x: corridorX,
            y: startY + maxUnitH + GAP,
            w: corridorW,
            h: CORRIDOR_H,
        });
    } else if (presetType === "u-shape") {
        const nTop = Math.max(1, Math.ceil(count / 3));
        const nLeft = Math.max(1, Math.floor((count - nTop) / 2));
        const nRight = Math.max(0, count - nTop - nLeft);

        const topUnits = sortedPool.slice(0, nTop);
        const leftUnits = sortedPool.slice(nTop, nTop + nLeft);
        const rightUnits = sortedPool.slice(nTop + nLeft, count);

        const maxLeftW = leftUnits.length > 0 ? Math.max(...leftUnits.map(u => getUnitDimensions(u?.beds).w)) : 0;
        const maxTopH = topUnits.length > 0 ? Math.max(...topUnits.map(u => getUnitDimensions(u?.beds).h)) : 140;

        let topW = 0;
        topUnits.forEach((u, i) => {
            topW += getUnitDimensions(u?.beds).w + (i > 0 ? GAP : 0);
        });

        let leftH = 0;
        leftUnits.forEach((u, i) => {
            leftH += getUnitDimensions(u?.beds).h + (i > 0 ? GAP : 0);
        });

        let rightH = 0;
        rightUnits.forEach((u, i) => {
            rightH += getUnitDimensions(u?.beds).h + (i > 0 ? GAP : 0);
        });

        const westUnitsStartX = MARGIN;
        const leftCorridorX = nLeft > 0 ? westUnitsStartX + maxLeftW + GAP : MARGIN;
        const topCorridorX = leftCorridorX;
        const topCorridorW = Math.max(topW + (nRight > 0 ? CORRIDOR_H + GAP * 2 : 80), 640);
        const topUnitsStartX = topCorridorX + Math.max(GAP, Math.round((topCorridorW - topW) / 2));

        const startY = MARGIN;
        const topCorridorY = startY + maxTopH + GAP;
        const sideUnitsStartY = topCorridorY + CORRIDOR_H + GAP;
        const maxSideH = Math.max(leftH, rightH, 420);
        const sideCorridorH = maxSideH + CORRIDOR_H + GAP;

        // 1. Top row units
        let curTopX = topUnitsStartX;
        for (let i = 0; i < nTop; i++) {
            const dbu = topUnits[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(curTopX, startY + (maxTopH - dims.h), dims.w, dims.h);
            if (u) newUnits.push(u);
            curTopX += dims.w + GAP;
        }

        // 2. North Corridor
        newCorridors.push({
            id: `corridor-${floorNumber}-${Date.now()}-top`,
            label: "North Wing",
            x: topCorridorX,
            y: topCorridorY,
            w: topCorridorW,
            h: CORRIDOR_H,
        });

        // 3. West Wing Corridor & Units
        if (nLeft > 0) {
            newCorridors.push({
                id: `corridor-${floorNumber}-${Date.now()}-left`,
                label: "West Wing",
                x: leftCorridorX,
                y: topCorridorY,
                w: CORRIDOR_H,
                h: sideCorridorH,
            });

            let curLeftY = sideUnitsStartY;
            for (let i = 0; i < nLeft; i++) {
                const dbu = leftUnits[i];
                const dims = getUnitDimensions(dbu?.beds);
                const u = createUnit(leftCorridorX - dims.w - GAP, curLeftY, dims.w, dims.h);
                if (u) newUnits.push(u);
                curLeftY += dims.h + GAP;
            }
        }

        // 4. East Wing Corridor & Units
        if (nRight > 0) {
            const rightCorridorX = topCorridorX + topCorridorW - CORRIDOR_H;
            newCorridors.push({
                id: `corridor-${floorNumber}-${Date.now()}-right`,
                label: "East Wing",
                x: rightCorridorX,
                y: topCorridorY,
                w: CORRIDOR_H,
                h: sideCorridorH,
            });

            let curRightY = sideUnitsStartY;
            for (let i = 0; i < nRight; i++) {
                const dbu = rightUnits[i];
                const dims = getUnitDimensions(dbu?.beds);
                const u = createUnit(rightCorridorX + CORRIDOR_H + GAP, curRightY, dims.w, dims.h);
                if (u) newUnits.push(u);
                curRightY += dims.h + GAP;
            }
        }
    } else if (presetType === "l-shape") {
        const nTop = Math.max(1, Math.ceil(count / 2));
        const nLeft = Math.max(1, count - nTop);

        const topUnits = sortedPool.slice(0, nTop);
        const leftUnits = sortedPool.slice(nTop, count);

        const maxLeftW = leftUnits.length > 0 ? Math.max(...leftUnits.map(u => getUnitDimensions(u?.beds).w)) : 0;
        const maxTopH = topUnits.length > 0 ? Math.max(...topUnits.map(u => getUnitDimensions(u?.beds).h)) : 140;

        let topW = 0;
        topUnits.forEach((u, i) => {
            topW += getUnitDimensions(u?.beds).w + (i > 0 ? GAP : 0);
        });

        let leftH = 0;
        leftUnits.forEach((u, i) => {
            leftH += getUnitDimensions(u?.beds).h + (i > 0 ? GAP : 0);
        });

        const westUnitsStartX = MARGIN;
        const leftCorridorX = westUnitsStartX + maxLeftW + GAP;
        const topCorridorX = leftCorridorX;
        const topCorridorW = Math.max(topW + 80, 600);
        const topUnitsStartX = topCorridorX + Math.max(GAP, Math.round((topCorridorW - topW) / 2));

        const startY = MARGIN;
        const topCorridorY = startY + maxTopH + GAP;
        const sideUnitsStartY = topCorridorY + CORRIDOR_H + GAP;
        const sideCorridorH = Math.max(leftH, 420) + CORRIDOR_H + GAP;

        // Top row
        let curTopX = topUnitsStartX;
        for (let i = 0; i < nTop; i++) {
            const dbu = topUnits[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(curTopX, startY + (maxTopH - dims.h), dims.w, dims.h);
            if (u) newUnits.push(u);
            curTopX += dims.w + GAP;
        }

        newCorridors.push({
            id: `corridor-${floorNumber}-${Date.now()}-top`,
            label: "Main Wing",
            x: topCorridorX,
            y: topCorridorY,
            w: topCorridorW,
            h: CORRIDOR_H,
        });

        newCorridors.push({
            id: `corridor-${floorNumber}-${Date.now()}-left`,
            label: "Side Wing",
            x: leftCorridorX,
            y: topCorridorY,
            w: CORRIDOR_H,
            h: sideCorridorH,
        });

        let curLeftY = sideUnitsStartY;
        for (let i = 0; i < nLeft; i++) {
            const dbu = leftUnits[i];
            const dims = getUnitDimensions(dbu?.beds);
            const u = createUnit(leftCorridorX - dims.w - GAP, curLeftY, dims.w, dims.h);
            if (u) newUnits.push(u);
            curLeftY += dims.h + GAP;
        }
    }

    return {
        units: newUnits,
        corridors: newCorridors,
        structures: [],
    };
}
