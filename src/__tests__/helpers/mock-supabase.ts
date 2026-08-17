/**
 * Reusable fluent chain mock builder for SupabaseClient.
 *
 * @module __tests__/helpers/mock-supabase
 */
import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface MockTableHandler {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

export interface MockSupabaseOptions {
  tables?: Record<string, MockTableHandler>;
  user?: {
    id: string;
    email?: string;
    role?: string;
  } | null;
}

export function createMockSupabaseQuery(handler: MockTableHandler = {}) {
  const defaultResult = {
    data: handler.data ?? [],
    error: handler.error ?? null,
    count: handler.count ?? null,
  };

  const query: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: Array.isArray(defaultResult.data) ? defaultResult.data[0] ?? null : defaultResult.data,
      error: defaultResult.error,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: Array.isArray(defaultResult.data) ? defaultResult.data[0] ?? null : defaultResult.data,
      error: defaultResult.error,
    }),
    then: (resolve: any) => Promise.resolve(defaultResult).then(resolve),
  };

  return query;
}

export function createMockSupabaseClient(
  options: MockSupabaseOptions = {},
): SupabaseClient<Database> {
  const tableHandlers = options.tables ?? {};
  const mockUser = options.user !== undefined ? options.user : { id: "mock-user-id", email: "user@example.com" };

  const client: any = {
    from: vi.fn().mockImplementation((tableName: string) => {
      const handler = tableHandlers[tableName] ?? {};
      return createMockSupabaseQuery(handler);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockUser ? { user: mockUser } : null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        getUserById: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "uploads/file.png" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://storage.example.com/uploads/file.png" } }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  };

  return client as SupabaseClient<Database>;
}
