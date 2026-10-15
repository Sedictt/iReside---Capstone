"use client";

/**
 * Settings-page presentation for BillingOperationsPanel (`embedded` mode): the "GCash payments"
 * and "Water and electricity rates" pages. The panel keeps all state, validation and saving;
 * these components only draw it with the shared settings kit (big type, visible labels,
 * plain words). Saving happens through the page's own save bar, so there are no save buttons here.
 */

import { useId, useRef } from "react";
import Image from "next/image";
import { CheckCircle2, ImagePlus, Loader2, Plus, Smartphone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import type { BillingWorkspace } from "@/lib/billing/server";
import { cn } from "@/lib/utils";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { utilityRateRule } from "@/lib/validation/schemas/properties.schema";
import { PH_MOBILE_DIGITS, isPhMobile, phMobileDigits, toPhMobileLocal } from "@/lib/phone";
import { PhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";
import {
    SettingsButton,
    SettingsCard,
    SettingsChoiceGroup,
    SettingsField,
    SettingsNotice,
    SettingsSwitchRow,
    fieldAria,
    settingsInputClass,
} from "@/components/settings/settings-ui";
import type { ConfigDiffItem, UtilityConfigDraft } from "@/components/landlord/BillingOperationsPanel";

type UtilityType = "water" | "electricity";
type Strategy = "included" | "submetered" | "direct";
type Translate = ReturnType<typeof useLanguageContext>["t"];

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function BillingSettingsLoading() {
    const { t } = useLanguageContext();
    return (
        <SettingsCard>
            <p role="status" className="flex items-center gap-3 text-lg font-semibold text-foreground">
                <Loader2 className="size-6 shrink-0 motion-safe:animate-spin" aria-hidden />
                {t("Loading your payment settings…")}
            </p>
        </SettingsCard>
    );
}

export function BillingSettingsMessage({ id, type, value, onClose }: { id: string; type: "error" | "success"; value: string; onClose: () => void }) {
    const { t } = useLanguageContext();
    return (
        <div id={id} className="scroll-mt-24">
            <SettingsNotice
                live
                tone={type === "error" ? "danger" : "success"}
                action={
                    <SettingsButton variant="secondary" onClick={onClose}>
                        {t("Close")}
                    </SettingsButton>
                }
            >
                {value}
            </SettingsNotice>
        </div>
    );
}

// ---------------------------------------------------------------------------
// GCash page
// ---------------------------------------------------------------------------

interface GcashSettingsViewProps {
    accountName: string;
    accountNumber: string;
    isEnabled: boolean;
    qrPreview: string | null;
    onChange: (patch: { accountName?: string; accountNumber?: string; isEnabled?: boolean; qrFile?: File | null; qrPreview?: string | null; removeQr?: boolean }) => void;
}

export function GcashSettingsView({ accountName, accountNumber, isEnabled, qrPreview, onChange }: GcashSettingsViewProps) {
    const { t } = useLanguageContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nameError = accountName.length > 0 && accountName.trim().length < 2 ? t("Please type at least 2 letters.") : undefined;
    const numberDigits = phMobileDigits(accountNumber);
    const numberError = numberDigits.length > 0 && !numberDigits.startsWith("9") ? t("The number after +63 must start with 9, like +63 917 123 4567.") : undefined;
    const digitsLeft = PH_MOBILE_DIGITS - numberDigits.length;
    const numberProgress =
        !numberError && numberDigits.length > 0 && digitsLeft > 0
            ? digitsLeft === 1
                ? t("Type 1 more number.")
                : t("Type {count} more numbers.", { count: digitsLeft })
            : null;

    const removeQr = () => onChange({ removeQr: true, qrFile: null, qrPreview: null });

    return (
        <>
            <SettingsCard
                title={t("Your GCash details")}
                description={t("Tenants send their rent to this GCash account. The money goes straight to you.")}
            >
                <div className="space-y-6">
                    <SettingsField
                        label={t("Name on your GCash account")}
                        htmlFor="gcash-account-name"
                        help={t("Type it the same way it shows in your GCash app.")}
                        error={nameError}
                    >
                        <input
                            {...fieldAria("gcash-account-name", { help: true, error: nameError })}
                            value={accountName}
                            placeholder={t("e.g. Marina Reyes")}
                            maxLength={60}
                            autoComplete="name"
                            onChange={(event) => {
                                const sanitized = event.target.value.replace(/[^a-zA-Z\s.,'-]/g, "");
                                onChange({ accountName: sanitized });
                            }}
                            className={settingsInputClass(Boolean(nameError))}
                        />
                    </SettingsField>

                    <SettingsField
                        label={t("GCash mobile number")}
                        htmlFor="gcash-account-number"
                        help={t("Type the 10 numbers after +63. Example: +63 917 123 4567")}
                        error={numberError}
                    >
                        <PhoneNumberInput
                            {...fieldAria("gcash-account-number", { help: true, error: numberError })}
                            value={accountNumber}
                            onValueChange={(next) => onChange({ accountNumber: next })}
                            className={settingsInputClass(Boolean(numberError), "tracking-wide")}
                        />
                        {numberProgress && <p className="text-base font-semibold text-amber-800 dark:text-amber-300">{numberProgress}</p>}
                    </SettingsField>

                    <SettingsSwitchRow
                        icon={Smartphone}
                        label={t("Let tenants pay with GCash")}
                        description={t("When this is on, tenants see your GCash number and QR code when they pay rent.")}
                        checked={isEnabled}
                        onChange={(next) => onChange({ isEnabled: next })}
                    />
                </div>
            </SettingsCard>

            <SettingsCard
                title={t("Your GCash QR code")}
                description={t("Tenants can scan this to pay you. Save your QR code from the GCash app as a picture, then add it here.")}
            >
                <div className="space-y-5">
                    {qrPreview ? (
                        <div className="mx-auto w-full max-w-[16rem] rounded-2xl border-2 border-foreground/15 bg-white p-4">
                            <Image
                                src={qrPreview}
                                alt={t("Your GCash QR code")}
                                width={224}
                                height={224}
                                unoptimized
                                className="h-auto w-full object-contain"
                            />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-foreground/30 bg-background px-6 py-10 text-center transition-colors cursor-pointer",
                                "hover:border-foreground/60 hover:bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                            )}
                        >
                            <ImagePlus className="size-10 text-foreground" aria-hidden />
                            <span className="text-lg font-bold text-foreground">{t("Add your QR code picture")}</span>
                            <span className="text-base text-muted-foreground">{t("A photo or screenshot, up to 5 MB.")}</span>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={MEDIA_ACCEPT_STRINGS.image}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden
                        onChange={(event) => {
                            const file = handleMediaSelection(event, {
                                preset: "image",
                                maxSizeBytes: 5 * 1024 * 1024,
                                notify: (msg, desc) => toast.error(tr(msg), { description: desc }),
                            });
                            if (file) onChange({ qrFile: file, qrPreview: URL.createObjectURL(file), removeQr: false });
                        }}
                    />

                    {qrPreview && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <SettingsButton variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>
                                {t("Use a different picture")}
                            </SettingsButton>
                            <SettingsButton
                                variant="secondary"
                                icon={Trash2}
                                onClick={removeQr}
                                className="text-rose-700 dark:text-rose-300"
                            >
                                {t("Remove QR code")}
                            </SettingsButton>
                        </div>
                    )}
                </div>
            </SettingsCard>

            <SettingsCard
                title={t("What tenants will see")}
                description={t("This is how your GCash details will look to tenants when they pay.")}
            >
                <div className="space-y-4">
                    {!isEnabled && (
                        <SettingsNotice tone="warning">
                            {t("GCash is turned off. Tenants will not see these details until you turn it on.")}
                        </SettingsNotice>
                    )}
                    <div className={cn("mx-auto max-w-sm space-y-4 rounded-3xl border-2 border-foreground/15 bg-background p-6 text-center", !isEnabled && "opacity-70")}>
                        <p className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-1.5 text-base font-bold text-white">
                            <Smartphone className="size-5" aria-hidden />
                            {t("Pay with GCash")}
                        </p>
                        {qrPreview ? (
                            <div className="mx-auto w-40 rounded-2xl border-2 border-foreground/10 bg-white p-2">
                                <Image src={qrPreview} alt="" width={160} height={160} unoptimized className="h-auto w-full object-contain" />
                            </div>
                        ) : (
                            <p className="text-base text-muted-foreground">{t("No QR code yet")}</p>
                        )}
                        <div className="space-y-1">
                            <p className="text-base text-muted-foreground">{t("Send to")}</p>
                            <p className="flex items-center justify-center gap-2 break-words text-xl font-bold text-foreground">
                                {accountName.trim() || <span className="text-muted-foreground">{t("Your name will show here")}</span>}
                                {accountName.trim() && <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
                            </p>
                            <p className="font-mono text-lg font-bold tracking-wider text-foreground">
                                {(isPhMobile(accountNumber) ? toPhMobileLocal(accountNumber) : null) || <span className="font-sans tracking-normal text-muted-foreground">{t("Your number will show here")}</span>}
                            </p>
                        </div>
                    </div>
                </div>
            </SettingsCard>
        </>
    );
}

// ---------------------------------------------------------------------------
// Water and electricity rates page
// ---------------------------------------------------------------------------

const strategyOf = (config: UtilityConfigDraft): Strategy =>
    config.billing_mode === "included_in_rent" ? "included" : config.responsibility_mode === "tenant_direct" ? "direct" : "submetered";

const STRATEGY_PATCH: Record<Strategy, Partial<UtilityConfigDraft>> = {
    included: { billing_mode: "included_in_rent", responsibility_mode: "landlord_bills" },
    submetered: { billing_mode: "tenant_paid", responsibility_mode: "landlord_bills" },
    direct: { billing_mode: "tenant_paid", responsibility_mode: "tenant_direct" },
};

function meterUnit(type: UtilityType) {
    return type === "water" ? "m³" : "kWh";
}

function formatDay(isoDate: string, locale: string) {
    const date = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/** "Part of the rent", "₱25 per m³", "Paid to the water company". */
function plainStrategy(config: UtilityConfigDraft, t: Translate) {
    const strategy = strategyOf(config);
    if (strategy === "included") return t("Part of the rent");
    if (strategy === "direct") return config.utility_type === "water" ? t("Paid to the water company") : t("Paid to the electric company");
    return t("₱{rate} per {unit}", { rate: Number(config.rate_per_unit).toFixed(2), unit: meterUnit(config.utility_type) });
}

interface RateEditorProps {
    config: UtilityConfigDraft;
    units: Array<{ id: string; name: string }>;
    isRoom: boolean;
    onChange: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
}

function RateEditor({ config, units, isRoom, onChange }: RateEditorProps) {
    const { t } = useLanguageContext();
    const baseId = useId();
    const isWater = config.utility_type === "water";
    const strategy = strategyOf(config);
    const rateError = utilityRateRule(config.rate_per_unit);
    const roomError = isRoom && !config.unit_id ? t("Choose a room.") : undefined;

    const legend = isRoom
        ? isWater ? t("How does this room pay for water?") : t("How does this room pay for electricity?")
        : isWater ? t("How do tenants pay for water?") : t("How do tenants pay for electricity?");

    return (
        <div className="space-y-6">
            {isRoom && (
                <SettingsField label={t("Which room?")} htmlFor={`${baseId}-room`} error={roomError}>
                    <select
                        {...fieldAria(`${baseId}-room`, { error: roomError })}
                        value={config.unit_id ?? ""}
                        onChange={(e) => onChange(config.localId, { unit_id: e.target.value || null })}
                        className={settingsInputClass(Boolean(roomError), "cursor-pointer")}
                    >
                        {/* Disabled once a room is picked so the row can't lose its room. */}
                        <option value="" disabled>
                            {t("Choose a room")}
                        </option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </SettingsField>
            )}

            <SettingsChoiceGroup<Strategy>
                legend={legend}
                columns={1}
                value={strategy}
                onChange={(next) => onChange(config.localId, STRATEGY_PATCH[next])}
                options={[
                    {
                        value: "included",
                        label: t("It is part of the rent"),
                        description: isWater
                            ? t("Tenants do not get a separate water bill.")
                            : t("Tenants do not get a separate electricity bill."),
                    },
                    {
                        value: "submetered",
                        label: t("I charge them by their meter reading"),
                        description: t("You pay the main bill. Each month you read each room's meter, and iReside adds the cost to the tenant's bill."),
                    },
                    {
                        value: "direct",
                        label: isWater ? t("They pay the water company themselves") : t("They pay the electric company themselves"),
                        description: t("Each room has its own account and meter. This bill does not show up in iReside."),
                    },
                ]}
            />

            {strategy === "submetered" && (
                <div className="grid gap-6 sm:grid-cols-2">
                    <SettingsField
                        label={isWater ? t("Price per cubic meter (m³)") : t("Price per kilowatt-hour (kWh)")}
                        htmlFor={`${baseId}-rate`}
                        help={t("What you charge for each unit on the meter.")}
                        error={rateError ? t(rateError) : undefined}
                    >
                        <div className="relative">
                            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-foreground">
                                ₱
                            </span>
                            <input
                                {...fieldAria(`${baseId}-rate`, { help: true, error: rateError })}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                max="99999"
                                value={Number.isNaN(config.rate_per_unit) ? "" : config.rate_per_unit}
                                onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                    onChange(config.localId, { rate_per_unit: Number.isNaN(val) ? 0 : Math.max(0, val) });
                                }}
                                className={settingsInputClass(Boolean(rateError), "pl-10 pr-16")}
                            />
                            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
                                {meterUnit(config.utility_type)}
                            </span>
                        </div>
                        {!rateError && config.rate_per_unit <= 0 && (
                            <p className="text-base font-semibold text-amber-800 dark:text-amber-300">
                                {t("The price is ₱0. Type your price so iReside can work out each bill.")}
                            </p>
                        )}
                    </SettingsField>

                    <SettingsField
                        label={t("Use this price starting")}
                        htmlFor={`${baseId}-from`}
                        help={t("The date the price starts to count.")}
                    >
                        <input
                            {...fieldAria(`${baseId}-from`, { help: true })}
                            type="date"
                            min="2000-01-01"
                            max="2099-12-31"
                            value={config.effective_from}
                            onChange={(e) => onChange(config.localId, { effective_from: e.target.value })}
                            className={settingsInputClass(false, "cursor-pointer")}
                        />
                    </SettingsField>
                </div>
            )}
        </div>
    );
}

interface UtilityRatesSettingsViewProps {
    properties: BillingWorkspace["properties"];
    propertyId: string;
    utilityType?: UtilityType;
    configs: UtilityConfigDraft[];
    originalConfigs: UtilityConfigDraft[];
    changes: ConfigDiffItem[];
    onUpdateConfig: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
    onAddRoom: (propertyId: string, type: UtilityType) => void;
    onRemoveConfig: (localId: string) => void;
}

export function UtilityRatesSettingsView({
    properties,
    propertyId,
    utilityType,
    configs,
    originalConfigs,
    changes,
    onUpdateConfig,
    onAddRoom,
    onRemoveConfig,
}: UtilityRatesSettingsViewProps) {
    const { t, locale } = useLanguageContext();
    const shown = properties.filter((p) => propertyId === "all" || p.id === propertyId);
    const types = (["water", "electricity"] as const).filter((type) => !utilityType || type === utilityType);
    const originalByLocalId = new Map(originalConfigs.map((c) => [c.localId, c]));
    const currentByLocalId = new Map(configs.map((c) => [c.localId, c]));

    if (shown.length === 0) {
        return (
            <SettingsNotice tone="info" title={t("No property yet")}>
                {t("Add a property first. Then you can set its water and electricity rates here.")}
            </SettingsNotice>
        );
    }

    return (
        <>
            {changes.length > 0 && (
                <SettingsCard
                    title={t("Changes not saved yet")}
                    description={t("Press Save changes at the bottom of the screen when you are done.")}
                    className="border-amber-400 dark:border-amber-500/60"
                >
                    <ul className="space-y-3">
                        {changes.map((item) => {
                            const utility = item.utilityType === "water" ? t("Water") : t("Electricity");
                            const before = originalByLocalId.get(item.localId);
                            const after = currentByLocalId.get(item.localId);
                            const isBuilding = (after ?? before)?.unit_id === null;
                            const where = `${item.propertyName} · ${isBuilding ? t("Whole building") : item.unitName ?? t("Room not chosen yet")}`;
                            let what: string;
                            if (item.type === "deleted") {
                                what = t("Special price removed. This room will use the building price again.");
                            } else if (item.type === "added" || !before || !after) {
                                what = after ? t("New special price: {value}", { value: plainStrategy(after, t) }) : t("New special price");
                            } else if (plainStrategy(before, t) !== plainStrategy(after, t)) {
                                what = t("Was {before}. Now {after}.", { before: plainStrategy(before, t), after: plainStrategy(after, t) });
                            } else if (before.effective_from !== after.effective_from) {
                                what = t("Start date changed to {date}", { date: formatDay(after.effective_from, locale) });
                            } else {
                                what = t("Room changed");
                            }
                            return (
                                <li key={`${item.type}-${item.localId}`} className="rounded-2xl border-2 border-foreground/10 p-4">
                                    <p className="text-lg font-bold text-foreground">
                                        {utility} — {where}
                                    </p>
                                    <p className="mt-1 text-base text-foreground/90">{what}</p>
                                </li>
                            );
                        })}
                    </ul>
                </SettingsCard>
            )}

            {shown.map((property) =>
                types.map((type) => {
                    const baseConfig = configs.find((c) => c.property_id === property.id && c.utility_type === type && c.unit_id === null);
                    const rooms = configs.filter((c) => c.property_id === property.id && c.utility_type === type && c.unit_id !== null);
                    const isWater = type === "water";
                    return (
                        <div key={`${property.id}-${type}`} className="space-y-8">
                            <SettingsCard
                                title={property.name}
                                description={isWater ? t("The water price for every room in this building.") : t("The electricity price for every room in this building.")}
                            >
                                {baseConfig ? (
                                    <RateEditor config={baseConfig} units={property.units} isRoom={false} onChange={onUpdateConfig} />
                                ) : null}
                            </SettingsCard>

                            <SettingsCard
                                title={t("Rooms with a different price")}
                                description={t("Use this only if a room pays differently from the rest of the building.")}
                            >
                                <div className="space-y-5">
                                    {rooms.length === 0 ? (
                                        <p className="text-base text-muted-foreground">
                                            {t("No rooms have a different price. Every room uses the price above.")}
                                        </p>
                                    ) : (
                                        <ul className="space-y-5">
                                            {rooms.map((room) => (
                                                <li key={room.localId} className="space-y-6 rounded-2xl border-2 border-foreground/15 p-4 sm:p-5">
                                                    <p className="text-lg font-bold text-foreground">
                                                        {property.units.find((u) => u.id === room.unit_id)?.name ?? t("New room")}
                                                    </p>
                                                    <RateEditor config={room} units={property.units} isRoom onChange={onUpdateConfig} />
                                                    <SettingsButton
                                                        variant="secondary"
                                                        icon={Trash2}
                                                        onClick={() => onRemoveConfig(room.localId)}
                                                        className="text-rose-700 dark:text-rose-300"
                                                    >
                                                        {t("Remove this room's price")}
                                                    </SettingsButton>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {property.units.length > 0 && (
                                        <SettingsButton variant="secondary" icon={Plus} onClick={() => onAddRoom(property.id, type)}>
                                            {t("Add a room with a different price")}
                                        </SettingsButton>
                                    )}
                                </div>
                            </SettingsCard>
                        </div>
                    );
                }),
            )}
        </>
    );
}
