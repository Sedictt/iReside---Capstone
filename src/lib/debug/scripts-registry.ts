export interface DebugScriptDefinition {
  id: string;
  name: string;
  category: "accounts" | "cleanup" | "database" | "quality";
  description: string;
  command: string;
  runner: "node" | "npx";
  file?: string;
  defaultArgs?: string[];
  dangerous?: boolean;
  inputs?: Array<{
    id: string;
    label: string;
    placeholder: string;
    type: "text" | "email";
    required?: boolean;
    defaultValue?: string;
  }>;
}

export const SCRIPT_REGISTRY: Record<string, DebugScriptDefinition> = {
  "purge-user": {
    id: "purge-user",
    name: "Purge & Delete User by Email",
    category: "cleanup",
    description: "Completely wipes an email from Supabase Auth, profiles, and database so the email can be reused immediately.",
    command: "node scripts/delete-user.mjs <email>",
    runner: "node",
    file: "scripts/delete-user.mjs",
    dangerous: true,
    inputs: [
      {
        id: "email",
        label: "Email or UUID to Purge",
        placeholder: "e.g. test.user@gmail.com",
        type: "email",
        required: true,
      },
    ],
  },
  "reset-starter": {
    id: "reset-starter",
    name: "Reset Starter Landlord",
    category: "accounts",
    description: "Resets Practice Landlord 1 back to un-claimed status with default password (LandlordDemo2026!) and cleans test properties.",
    command: "node scripts/reset-starter-account.mjs [email]",
    runner: "node",
    file: "scripts/reset-starter-account.mjs",
    inputs: [
      {
        id: "email",
        label: "Target Email (Optional - defaults to practice.landlord1@ireside.ph)",
        placeholder: "practice.landlord1@ireside.ph",
        type: "email",
      },
    ],
  },
  "create-claimable": {
    id: "create-claimable",
    name: "Generate Claimable Starter Landlord",
    category: "accounts",
    description: "Generates or verifies a claimable landlord account ready for testing activation, OTP, and setup flow.",
    command: "node scripts/create-starter-claimable-account.mjs",
    runner: "node",
    file: "scripts/create-starter-claimable-account.mjs",
  },
  "create-landlord": {
    id: "create-landlord",
    name: "Create Test Landlord (Pre-Configured)",
    category: "accounts",
    description: "Generates an active landlord with mock property, units, and billing ready for operations.",
    command: "npx tsx scripts/create-test-account.ts --role landlord",
    runner: "npx",
    defaultArgs: ["tsx", "scripts/create-test-account.ts", "--role", "landlord"],
  },
  "create-tenant": {
    id: "create-tenant",
    name: "Create Test Resident Account",
    category: "accounts",
    description: "Generates a tenant resident account with linked mock lease and unit assignment.",
    command: "npx tsx scripts/create-test-account.ts --role tenant",
    runner: "npx",
    defaultArgs: ["tsx", "scripts/create-test-account.ts", "--role", "tenant"],
  },
  "seed-turnkey-admin": {
    id: "seed-turnkey-admin",
    name: "Seed Default Admin Account",
    category: "accounts",
    description: "Seeds the default system administrator account (admin@turnkey.local).",
    command: "npx tsx scripts/create-test-account.ts --turnkey-default",
    runner: "npx",
    defaultArgs: ["tsx", "scripts/create-test-account.ts", "--turnkey-default"],
  },
  "db-inventory": {
    id: "db-inventory",
    name: "Database Inventory & Diagnostics",
    category: "database",
    description: "Audits live database table row counts, relational constraints, and storage bucket contents.",
    command: "node scripts/database-inventory.mjs",
    runner: "node",
    file: "scripts/database-inventory.mjs",
  },
  "seed-notifications": {
    id: "seed-notifications",
    name: "Seed Mock Notifications",
    category: "database",
    description: "Populates test activity notifications, announcements, and rent alerts.",
    command: "node scripts/seed-notifications.mjs",
    runner: "node",
    file: "scripts/seed-notifications.mjs",
  },
  "typecheck": {
    id: "typecheck",
    name: "Run TypeScript Check",
    category: "quality",
    description: "Executes `npx tsc --noEmit` across all pages, components, and API routes.",
    command: "npx tsc --noEmit",
    runner: "npx",
    defaultArgs: ["tsc", "--noEmit"],
  },
  "run-tests": {
    id: "run-tests",
    name: "Run Vitest Setup & Validation Tests",
    category: "quality",
    description: "Executes unit and integration test suites in `src/__tests__/setup` and `src/__tests__/validation`.",
    command: "npx vitest run src/__tests__/setup src/__tests__/validation",
    runner: "npx",
    defaultArgs: ["vitest", "run", "src/__tests__/setup", "src/__tests__/validation"],
  },
};
