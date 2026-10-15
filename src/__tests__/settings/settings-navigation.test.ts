import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSettingsNavigation } from "@/components/settings/settings-ui";

const SECTION_IDS = ["business", "payments"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const NEXT_STATE = { __NA: true };

function currentPath() {
    return `${window.location.pathname}${window.location.search}`;
}

/** Press the browser Back button and wait until the history has settled. */
async function pressBack() {
    await act(async () => {
        window.history.back();
        await new Promise((resolve) => setTimeout(resolve, 30));
    });
}

function renderNavigation(initialDirty = false) {
    const onBlocked = vi.fn();
    const onLeaveBlocked = vi.fn();
    const hook = renderHook(
        ({ isDirty }: { isDirty: boolean }) =>
            useSettingsNavigation<SectionId>({
                sectionIds: SECTION_IDS,
                shouldBlock: () => isDirty,
                onBlocked,
                isDirty,
                onLeaveBlocked,
            }),
        { initialProps: { isDirty: initialDirty } },
    );
    return { ...hook, onBlocked, onLeaveBlocked };
}

describe("useSettingsNavigation: leaving Settings with the Back button", () => {
    beforeEach(() => {
        // Another page of the app, then a settings page opened straight from it.
        window.history.replaceState(NEXT_STATE, "", "/landlord/menu");
        window.history.pushState(NEXT_STATE, "", "/landlord/settings?section=business");
    });

    it("asks first when there are unsaved changes, and stays on the page", async () => {
        const { result, rerender, onLeaveBlocked } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));
        rerender({ isDirty: true });

        await pressBack();

        expect(onLeaveBlocked).toHaveBeenCalledTimes(1);
        expect(currentPath()).toBe("/landlord/settings?section=business");
        expect(result.current.section).toBe("business");
    });

    it("keeps asking on every Back press until the person decides", async () => {
        const { result, rerender, onLeaveBlocked } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));
        rerender({ isDirty: true });

        await pressBack();
        await pressBack();

        expect(onLeaveBlocked).toHaveBeenCalledTimes(2);
        expect(currentPath()).toBe("/landlord/settings?section=business");
    });

    it("leave() goes back to the page before Settings", async () => {
        const { result, rerender, onLeaveBlocked } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));
        rerender({ isDirty: true });
        await pressBack();
        expect(onLeaveBlocked).toHaveBeenCalledTimes(1);

        // The person chose "Leave without saving".
        rerender({ isDirty: false });
        await act(async () => {
            result.current.leave();
            await new Promise((resolve) => setTimeout(resolve, 30));
        });

        expect(currentPath()).toBe("/landlord/menu");
    });

    it("needs only one Back press once the changes are saved", async () => {
        const { result, rerender, onLeaveBlocked } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));
        rerender({ isDirty: true });
        rerender({ isDirty: false });

        await pressBack();
        await waitFor(() => expect(currentPath()).toBe("/landlord/menu"));
        expect(onLeaveBlocked).not.toHaveBeenCalled();
    });

    it("adds no history entry when nothing was changed", async () => {
        const lengthBefore = window.history.length;
        const { result } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));

        expect(window.history.length).toBe(lengthBefore);
        await pressBack();
        expect(currentPath()).toBe("/landlord/menu");
    });

    it("does not copy the guard marker onto pages opened afterwards", async () => {
        const { result, rerender } = renderNavigation();
        await waitFor(() => expect(result.current.ready).toBe(true));
        rerender({ isDirty: true });
        rerender({ isDirty: false });

        act(() => result.current.open("payments"));

        expect(currentPath()).toBe("/landlord/settings?section=payments");
        expect(Object.keys(window.history.state ?? {})).toEqual(["__NA"]);
    });
});
