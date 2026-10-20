import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
    COMPLETED_MISSIONS_METADATA_KEY,
    MISSIONS_CONFIG,
    getCompletedMissionIds,
    getMissionProgressPercent,
} from "@/lib/missions-config";

describe("missions config", () => {
    it("has a picture on disk for every slide", () => {
        for (const mission of MISSIONS_CONFIG) {
            for (const slide of mission.slides) {
                expect(existsSync(join(process.cwd(), "public", slide.image)), slide.image).toBe(true);
            }
        }
    });

    it("no longer has the dashboard mission that onboarding already covers", () => {
        expect(MISSIONS_CONFIG.map((m) => m.id)).not.toContain("dashboard");
    });

    it("reads finished missions from metadata and ignores unknown ids", () => {
        const metadata = { [COMPLETED_MISSIONS_METADATA_KEY]: ["finance", "dashboard", "nope"] };
        expect(getCompletedMissionIds(metadata)).toEqual(["finance"]);
        expect(getMissionProgressPercent(metadata)).toBe(Math.round(100 / MISSIONS_CONFIG.length));
    });

    it("treats missing or malformed metadata as nothing finished", () => {
        expect(getCompletedMissionIds(null)).toEqual([]);
        expect(getCompletedMissionIds({ [COMPLETED_MISSIONS_METADATA_KEY]: "finance" })).toEqual([]);
        expect(getMissionProgressPercent(undefined)).toBe(0);
    });
});
