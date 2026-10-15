import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Regression test for the password-update hang.
 *
 * supabase-js awaits every onAuthStateChange subscriber while it still holds
 * its internal auth lock. If the subscriber awaits another auth call
 * (getUser), the originating call (updateUser) can never finish. The provider
 * must therefore run its session work on a later tick instead of inside the
 * subscriber.
 */

const getUser = vi.fn();
const getSession = vi.fn();
let authCallback: ((event: string, session: unknown) => unknown) | null = null;

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser,
      getSession,
      onAuthStateChange: (cb: (event: string, session: unknown) => unknown) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    channel: () => ({ on: function () { return this; }, subscribe: () => ({}) }),
    removeChannel: vi.fn(),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: "no profile" } }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

import { AuthProvider } from "../AuthContext";

const session = { user: { id: "u1", email: "u1@example.com" }, access_token: "t" };

describe("AuthProvider auth-change subscriber", () => {
  beforeEach(() => {
    authCallback = null;
    getUser.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue({ data: { session: null } });
    getUser.mockResolvedValue({ data: { user: session.user }, error: null });
  });

  it("does not call auth methods synchronously inside the subscriber", async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>,
    );
    await waitFor(() => expect(authCallback).toBeTruthy());
    getUser.mockClear();

    let returned: unknown;
    act(() => {
      returned = authCallback!("USER_UPDATED", session);
    });

    // The subscriber must return synchronously and must not have touched auth yet.
    expect(returned).toBeUndefined();
    expect(getUser).not.toHaveBeenCalled();

    // The session work still happens, just on a later tick.
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));
  });

  it("lets a simulated updateUser that awaits subscribers resolve", async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>,
    );
    await waitFor(() => expect(authCallback).toBeTruthy());

    // Mimic supabase-js: hold a lock, notify subscribers and await them, and
    // make any nested auth call block until the lock is released.
    let lockHeld = true;
    getUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          const tick = () => {
            if (!lockHeld) resolve({ data: { user: session.user }, error: null });
            else setTimeout(tick, 1);
          };
          tick();
        }),
    );
    const updateUser = async () => {
      await Promise.resolve(authCallback!("USER_UPDATED", session));
      lockHeld = false;
      return { error: null };
    };

    const result = await Promise.race([
      updateUser(),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 500)),
    ]);
    expect(result).toEqual({ error: null });
  });
});
