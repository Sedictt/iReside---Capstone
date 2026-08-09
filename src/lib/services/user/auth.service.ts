/**
 * AuthService — wraps Supabase authentication operations.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { UserAccessError } from "./user.errors";

export class AuthService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Retrieve the current active session.
   *
   * @returns Session or null.
   */
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    return session;
  }

  /**
   * Retrieve the currently authenticated user with verification against Supabase Auth.
   *
   * @returns User object.
   * @throws UserAccessError if no user is authenticated.
   */
  async requireUser(): Promise<User> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new UserAccessError("Unauthorized: Authentication required.");
    }
    return user;
  }

  /**
   * Retrieve the currently authenticated user if one exists.
   *
   * @returns User or null.
   */
  async getUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  }

  /**
   * Sign out the currently authenticated user session.
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }
}
