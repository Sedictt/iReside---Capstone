## Property Type + Utility Split Personalization Plan

### Summary
- Consolidate `property_type` end-state to only `apartment`, `dormitory`, `boarding_house` and migrate all legacy property types to `apartment`.
- Add structured utility split storage on `property_environment_policies`, including method and fixed-fee amount support.
- Personalize landlord property creation wizard and smart contract builder by property type, with synchronized hard occupancy enforcement and tailored contract language.
- Keep scope aligned to your decisions: 3 split options in UI, `equal_per_unit` backend-ready only, update builder + Tool Access preview surfaces only.

### Implementation Changes
- **Database + migration layer**
  - Add a new migration that:
    - Maps legacy `properties.type` values (`condo`, `house`, `townhouse`, `studio`) to `apartment`.
    - Recreates `public.property_type` via a new enum type and column cast, then swaps it in place.
    - Adds enum `utility_split_method` with values: `equal_per_head`, `equal_per_unit`, `fixed_charge`, `individual_meter`.
    - Adds to `property_environment_policies`:
      - `utility_split_method utility_split_method`
      - `utility_fixed_charge_amount numeric(12,2)` (nullable)
    - Backfills `utility_split_method` using your chosen mapping:
      - `mixed` -> `equal_per_head`
      - `separate_metered` -> `individual_meter`
      - `included_in_rent` -> `fixed_charge`
    - Normalizes `property_environment_policies.environment_mode` legacy values to `apartment` where needed.
  - Update seed/schema artifacts so fresh resets won’t reintroduce removed property types.

- **Type consolidation + API shape**
  - Update TS union types for property type to exactly `apartment | dormitory | boarding_house` (remove legacy variants).
  - Extend property-load response used by landlord property edit flow to include current environment policy fields required by the wizard (occupancy limit, split method, fixed amount).
  - Keep backward-safe handling for old `contract_template` payloads (missing new answers keys).

- **Personalized property wizard** ([page.tsx](/C:/Users/JV/Documents/GitHub/iReside/src/app/landlord/properties/new/page.tsx))
  - Restrict selectable property types to Apartment, Dormitory, Boarding House.
  - Make step context dynamic by selected type:
    - Dormitory: “Head Limit (Bedspace Capacity)”, default `4`.
    - Boarding House: “Room Limit (Head Limit)”, default `2`.
    - Apartment: “Household Capacity (Head Limit)”, keep apartment behavior/default.
  - Add Billing & Splitting section:
    - Dorm/Boarding: ask shared utility handling with 3 options only:
      - Split by Head (`equal_per_head`)
      - Fixed Monthly Fee (`fixed_charge`)
      - Individual Meter (`individual_meter`)
    - Apartment: default/suggest Individual Meter.
    - If `fixed_charge`, require amount input; default to `500`.
  - Save/update `property_environment_policies` with:
    - `environment_mode`
    - `max_occupants_per_unit`
    - `utility_split_method`
    - `utility_fixed_charge_amount`
  - On edit mode, hydrate these values from persisted policy.
  - Synchronize hard occupancy value coming from contract builder back into wizard state and persistence payload (single source of truth).

- **Smart contract personalization** ([SmartContractBuilderModal.tsx](/C:/Users/JV/Documents/GitHub/iReside/src/components/landlord/properties/SmartContractBuilderModal.tsx))
  - Add a mandatory “Hard Occupancy Limit” question with property-type-specific wording.
  - Add property-context-driven branding:
    - Dormitory -> `Dormitory Student Agreement`
    - Boarding House -> `Boarding House Residence Policy`
    - Apartment -> existing residential title
  - Utility clause generation rules:
    - Dormitory: include your exact head-count sharing sentence.
    - Boarding House: dynamic by selected split option (your chosen behavior):
      - `equal_per_head`: head-count wording
      - `fixed_charge`: fixed-rate wording with `[X]` from amount
      - `individual_meter`: individual metering wording
    - Apartment: individual metering default wording.
  - Persist new contract answers keys (decision-complete contract JSON shape):
    - `hard_occupancy_limit`
    - `utility_split_method`
    - `utility_fixed_charge_amount` (when applicable)

- **Tool preview consistency** ([ToolAccessBar.tsx](/C:/Users/JV/Documents/GitHub/iReside/src/components/landlord/applications/ToolAccessBar.tsx))
  - Update contract template preview renderer to use the same dynamic header and utility verbiage rules as the builder.
  - Keep change scope limited to this landlord preview surface (no tenant lease-view rewrite in this pass).

### Public Interfaces / Types Affected
- SQL enum contract:
  - `public.property_type` values change to exactly `apartment | dormitory | boarding_house`.
  - New `public.utility_split_method` enum.
- Table contract:
  - `public.property_environment_policies.utility_split_method` (new)
  - `public.property_environment_policies.utility_fixed_charge_amount` (new)
- Frontend/domain contract:
  - `PropertyType` TS union narrowed to 3 values.
  - `SmartContractTemplate.answers` now formally supports occupancy/split keys above.
- API response contract:
  - Landlord property detail fetch used by wizard edit mode includes environment policy fields needed to rehydrate personalized wizard inputs.

### Test Plan
- **Migration verification**
  - Run migrations on a DB containing legacy property types and confirm:
    - no remaining non-supported `properties.type` values
    - enum values exactly match target set
    - `utility_split_method` backfilled per mapping
- **Wizard behavior**
  - Create property as Dormitory/Boarding/Apartment and verify:
    - dynamic step labels/context
    - default occupancy values (4/2/apartment default)
    - split options and fixed-fee amount behavior
    - correct rows written to `property_environment_policies`
  - Edit existing property and verify hydration + updates persist.
- **Contract flows**
  - In builder, hard occupancy is required and syncs to policy persistence.
  - Verify header and utility clause output per property type and split option.
  - Verify Tool Access contract preview renders same branding/clause behavior.
- **Regression checks**
  - Typecheck/build/lint pass with narrowed `PropertyType`.
  - Confirm no runtime failure when opening properties with legacy `contract_template` JSON lacking new keys.

### Assumptions and Defaults
- `equal_per_unit` remains supported at schema level but is intentionally not exposed in this UI release.
- Default fixed monthly fee input is `₱500`.
- Legacy `included_in_rent` backfills to `fixed_charge`; amount remains nullable until explicitly set.
- Scope intentionally excludes tenant-facing lease document screens and broader billing engine recalculation logic beyond storing/selecting split policy.
