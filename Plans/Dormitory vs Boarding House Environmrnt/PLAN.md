### Dormitory vs Boarding House Environment Spec (Decision-Complete)

#### Summary
Define a type-aware landlord operating environment with strict differences between `dormitory` and `boarding_house`, while preserving current core architecture (one active lease per unit).  
Enforcement will block lease/application progression when occupancy policy is violated.  
Configuration is property-level with optional unit overrides, and existing properties are auto-mapped then require landlord review before next tenant finalization.

#### Key Environment Differences
1. **Occupancy Model**
- Keep current one-active-lease-per-unit model in this phase.
- Add capacity controls to represent household size constraints per unit.
- `dormitory` defaults:
- Higher default `max_occupants_per_unit`.
- Occupancy logic framed as “room/bedspace capacity policy” (without multi-tenant lease model yet).
- `boarding_house` defaults:
- Lower default `max_occupants_per_unit`.
- Occupancy logic framed as “room household limit.”
- Enforcement rule:
- If projected occupants exceed limit, block application/lease finalization until corrected.

2. **Rules Model**
- Add structured rule packs plus existing free-text rules.
- Structured policy fields (property-level defaults + unit overrides):
- `curfew_enabled`, `curfew_time`
- `visitor_cutoff_enabled`, `visitor_cutoff_time`
- `quiet_hours_start`, `quiet_hours_end`
- `gender_restriction_mode` (none/male_only/female_only/custom)
- `utility_policy_mode` (included_in_rent/separate_metered/mixed)
- Dorm defaults:
- Student-style strict preset (curfew + visitor cutoff + quiet hours enabled).
- Boarding defaults:
- Independent-living balanced preset (no default curfew, moderate quiet/visitor policy).

3. **Payment Profile Behavior**
- Keep existing billing engine and utility tables.
- Add environment-based default billing profile at property setup:
- Dorm defaults: shared-utility leaning, per-person-style guidance labels, still invoiced through current lease/payment structures.
- Boarding defaults: per-room billing leaning with configurable utility inclusion.
- Landlord can customize all defaults after auto-profile assignment.

4. **Context UX**
- Show persistent environment banner/chip across relevant landlord modules for selected property context.
- Banner shows current mode (`Dormitory` / `Boarding House` / `Apartment`) and links to policy configuration.
- Use per-selected-property context resolution for mixed portfolios.

#### API / Schema / Type Changes
1. **Property Type**
- Extend `property_type` enum with `dormitory`, `boarding_house`.
- Operational app scope uses `apartment | dormitory | boarding_house`.

2. **New Policy Storage**
- Add `property_environment_policies` table keyed by `property_id`:
- environment mode snapshot
- occupancy fields
- structured rule fields
- payment profile defaults
- review state (`needs_review`, `reviewed_at`, `reviewed_by`).
- Add optional `unit_environment_overrides` table keyed by `unit_id` for per-unit overrides.

3. **Validation Gates**
- Application and lease-finalization endpoints enforce occupancy cap checks.
- If property is `needs_review`, block finalization and return actionable error until reviewed.

4. **Read Models**
- Extend landlord property detail/overview endpoints to include resolved policy (property defaults + unit override merge).

#### Rollout and Migration
1. Auto-map existing properties to default profiles based on `properties.type`.
2. Mark all auto-mapped records as `needs_review = true`.
3. Require review confirmation before next tenant finalization event per property.
4. Preserve existing lease/payment data untouched.

#### Test Plan
1. **Schema/Migration**
- Enum values and policy tables created.
- Auto-mapping fills policy rows and review flags correctly.
- Legacy data remains valid.

2. **Policy Resolution**
- Property-level defaults resolve correctly.
- Unit override precedence works deterministically.

3. **Enforcement**
- Capacity breach blocks finalize flows in:
- tenant-application progression
- lease finalization endpoints.
- Review-required gate blocks finalization until confirmation.

4. **Defaults by Environment**
- Dorm strict preset applied on create/import.
- Boarding balanced preset applied on create/import.
- Payment profile defaults map correctly to current billing configs.

5. **UX Regression**
- Environment banner appears in targeted landlord modules with correct selected-property context.
- Mixed portfolio switching updates environment context correctly.

#### Assumptions and Defaults
- “Projected occupants” in this phase is landlord-declared occupant count captured during application/finalization (not multi-lease occupancy yet).
- Multi-tenant active lease per unit is explicitly out of scope for this phase.
- Free-text `house_rules` remain supported alongside structured policy fields.
- Existing payment tables remain source of truth; environment profiles only seed defaults and validation behavior.
