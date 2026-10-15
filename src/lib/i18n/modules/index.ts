import type { TranslationDictionary } from "../types";
import { landlordDashboard } from "./landlord-dashboard";
import { landlordUnitMap } from "./landlord-unit-map";
import { landlordApplicationsTenants } from "./landlord-applications-tenants";
import { landlordLeasesMoveout } from "./landlord-leases-moveout";
import { landlordPropertiesOps } from "./landlord-properties-ops";
import { landlordFinance } from "./landlord-finance";
import { landlordAccount } from "./landlord-account";
import { tenantComponents } from "./tenant-components";
import { tenantPages } from "./tenant-pages";
import { mobileLandlord } from "./mobile-landlord";
import { mobileTenantShared } from "./mobile-tenant-shared";
import { sharedUi } from "./shared-ui";
import { sharedFeatures } from "./shared-features";
import { publicPages } from "./public-pages";
import { runtimeMessages } from "./runtime-messages";
import { commonPhrases } from "./common";
import { settingsPages } from "./settings";

/**
 * Per-module Filipino phrase dictionaries, keyed by the exact English UI string.
 * Each feature area owns one file so translations can grow without merge conflicts.
 * Phrases shared across modules live once in common.ts so wording stays consistent.
 * The core dictionary (dictionaries/fil.ts) takes precedence over these on overlap.
 */
export const filModuleDictionary: TranslationDictionary = {
  // Runtime-built library text (validation, API errors, manuals) first so feature modules can override it.
  ...runtimeMessages,
  ...commonPhrases,
  ...sharedUi,
  ...sharedFeatures,
  ...publicPages,
  ...landlordDashboard,
  ...landlordUnitMap,
  ...landlordApplicationsTenants,
  ...landlordLeasesMoveout,
  ...landlordPropertiesOps,
  ...landlordFinance,
  ...landlordAccount,
  ...tenantComponents,
  ...tenantPages,
  ...mobileLandlord,
  ...mobileTenantShared,
  ...settingsPages,
};
