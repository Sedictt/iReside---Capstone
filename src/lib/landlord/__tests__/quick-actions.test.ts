import { describe, it, expect } from "vitest";
import {
    DEFAULT_QUICK_ACTIONS,
    DEFAULT_QUICK_ACTIONS_ORDER,
    getInitialQuickActionsConfig,
    resolveDisplayedActions,
    resolveHiddenActions,
    sanitizeQuickActionsConfig,
    type QuickActionsConfig,
} from "../quick-actions";

describe("quick-actions pure utility functions", () => {
    it("returns default initial configuration with all 10 actions visible in custom mode", () => {
        const config = getInitialQuickActionsConfig();
        expect(config.order).toEqual(DEFAULT_QUICK_ACTIONS_ORDER);
        expect(config.order.length).toBe(10);
        expect(config.hidden).toEqual([]);
        expect(config.sortMode).toBe("custom");
        expect(config.usageCounts).toEqual({});
    });

    it("resolves displayed actions according to custom order and hides hidden items", () => {
        const config: QuickActionsConfig = {
            order: ["settings", "invoice-ledger", "utility-submeters"],
            hidden: ["invoice-ledger"],
            sortMode: "custom",
            usageCounts: {},
            version: 1,
        };

        const displayed = resolveDisplayedActions(config);
        expect(displayed.map((a) => a.id)).toEqual(["settings", "utility-submeters"]);

        const hidden = resolveHiddenActions(config);
        expect(hidden.map((a) => a.id)).toEqual(["invoice-ledger"]);
    });

    it("resolves displayed actions dynamically by usage count in frequently_used mode", () => {
        const config: QuickActionsConfig = {
            order: ["invoice-ledger", "utility-submeters", "tenant-records", "settings"],
            hidden: [],
            sortMode: "frequently_used",
            usageCounts: {
                "settings": 12,
                "tenant-records": 5,
                "invoice-ledger": 20,
                "utility-submeters": 5,
            },
            version: 1,
        };

        const displayed = resolveDisplayedActions(config);
        // invoice-ledger (20), settings (12), tenant-records (5 tie-break by order), utility-submeters (5 tie-break by order)
        // Wait, in order: utility-submeters is at index 1, tenant-records is at index 2, so utility-submeters has lower orderIndex
        expect(displayed[0].id).toBe("invoice-ledger");
        expect(displayed[1].id).toBe("settings");
        expect(displayed[2].id).toBe("utility-submeters");
        expect(displayed[3].id).toBe("tenant-records");
    });

    it("does not include hidden actions even if they have high usage counts in frequently_used mode", () => {
        const config: QuickActionsConfig = {
            order: ["invoice-ledger", "settings"],
            hidden: ["settings"],
            sortMode: "frequently_used",
            usageCounts: {
                "settings": 999,
                "invoice-ledger": 2,
            },
            version: 1,
        };

        const displayed = resolveDisplayedActions(config);
        expect(displayed.map((a) => a.id)).toEqual(["invoice-ledger"]);
    });

    it("sanitizes invalid or empty input safely to fallback defaults", () => {
        const sanitizedNull = sanitizeQuickActionsConfig(null);
        expect(sanitizedNull.order).toEqual(DEFAULT_QUICK_ACTIONS_ORDER);
        expect(sanitizedNull.hidden).toEqual([]);
        expect(sanitizedNull.sortMode).toBe("custom");

        const sanitizedGarbage = sanitizeQuickActionsConfig({
            order: ["non-existent-id", 123, null],
            hidden: ["unknown-action"],
            sortMode: "invalid-mode",
            usageCounts: { "invoice-ledger": -5, "tenant-records": "many" },
        });

        // Missing items appended, invalid ones discarded
        expect(sanitizedGarbage.order).toEqual(DEFAULT_QUICK_ACTIONS_ORDER);
        expect(sanitizedGarbage.hidden).toEqual([]);
        expect(sanitizedGarbage.sortMode).toBe("custom");
        expect(sanitizedGarbage.usageCounts).toEqual({});
    });

    it("prevents hiding all actions by keeping at least one visible", () => {
        const allIds = DEFAULT_QUICK_ACTIONS.map((a) => a.id);
        const sanitized = sanitizeQuickActionsConfig({
            order: allIds,
            hidden: allIds, // Trying to hide everything!
            sortMode: "custom",
            usageCounts: {},
        });

        expect(sanitized.hidden.length).toBeLessThan(allIds.length);
        expect(sanitized.hidden.includes(allIds[0])).toBe(false);
    });
});
