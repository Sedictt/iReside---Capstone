"use client";

import { useEffect, useState, useReducer, useCallback, useMemo, useRef, type ReactNode } from "react";
import {
 Building2,
 Droplets,
 Loader2,
 Plus,
 QrCode,
 Save,
 Smartphone,
 Zap,
 CheckCircle2,
 Globe,
 Target,
 Trash2,
 Info,
 ArrowRight,
 ShieldCheck,
 CreditCard,
 DollarSign,
 Calendar,
 ChevronDown,
 ChevronUp,
 HelpCircle,
 X,
 User,
 Phone,
 Upload,
 Check,
 	AlertCircle,
	RotateCcw,
	Eye,
	AlertTriangle,
	Boxes
} from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import Image from "next/image";
import { m as motion, AnimatePresence } from "framer-motion";

import type { BillingWorkspace } from "@/lib/billing/server";
import { cn } from "@/lib/utils";

type UtilityConfigDraft = {
 localId: string;
 id?: string;
 property_id: string;
 unit_id: string | null;
 utility_type: "water" | "electricity";
 billing_mode: "included_in_rent" | "tenant_paid";
 rate_per_unit: number;
 unit_label: "kwh" | "cubic_meter";
 is_active: boolean;
 effective_from: string;
 effective_to: string | null;
 note: string | null;
 responsibility_mode?: "landlord_bills" | "tenant_direct";
};

export interface ConfigDiffItem {
 type: "modified" | "added" | "deleted";
 localId: string;
 propertyId: string;
 propertyName: string;
 unitId: string | null;
 unitName: string | null;
 utilityType: "water" | "electricity";
 summary: string;
 oldValue?: string;
 newValue?: string;
}

const today = new Date().toISOString().slice(0, 10);

const makeDraft = (seed: Partial<UtilityConfigDraft>): UtilityConfigDraft => ({
 localId: seed.localId ?? crypto.randomUUID(),
 property_id: seed.property_id ?? "",
 unit_id: seed.unit_id ?? null,
 utility_type: seed.utility_type ?? "water",
 billing_mode: seed.billing_mode ?? "included_in_rent",
 rate_per_unit: seed.rate_per_unit ?? 0,
 unit_label: seed.unit_label ?? "cubic_meter",
 is_active: seed.is_active ?? true,
 effective_from: seed.effective_from ?? today,
 effective_to: seed.effective_to ?? null,
 note: seed.note ?? null,
 id: seed.id,
 responsibility_mode: seed.responsibility_mode ?? "landlord_bills"
});

const utilityMeta = {
 water: { label: "Water", icon: Droplets, tint: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
 electricity: { label: "Electricity", icon: Zap, tint: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

type State = {
 workspace: BillingWorkspace | null;
 configs: UtilityConfigDraft[];
 deletedConfigIds: string[];
 loading: boolean;
 saving: boolean;
 message: { type: "error" | "success"; value: string } | null;
 isFooterExpanded: boolean;
 showBreakdown: boolean;
 helpContent: { title: string; content: ReactNode } | null;
 accountName: string;
 accountNumber: string;
 isEnabled: boolean;
 qrFile: File | null;
 qrPreview: string | null;
 removeQr: boolean;
};

type Action =
 | { type: "SET_WORKSPACE"; payload: BillingWorkspace }
 | { type: "SET_CONFIGS"; payload: UtilityConfigDraft[] }
 | { type: "UPDATE_CONFIG"; id: string; payload: Partial<UtilityConfigDraft> }
 | { type: "ADD_CONFIG"; payload: UtilityConfigDraft }
 | { type: "REMOVE_CONFIG"; id: string }
 | { type: "CLEAR_DELETED_CONFIGS" }
 | { type: "SET_LOADING"; payload: boolean }
 | { type: "SET_SAVING"; payload: boolean }
 | { type: "SET_MESSAGE"; payload: { type: "error" | "success"; value: string } | null }
 | { type: "SET_FOOTER_EXPANDED"; payload: boolean }
 | { type: "SET_SHOW_BREAKDOWN"; payload: boolean }
 | { type: "SET_HELP"; payload: { title: string; content: ReactNode } | null }
 | { type: "UPDATE_PAYMENT"; payload: Partial<Pick<State, 'accountName' | 'accountNumber' | 'isEnabled' | 'qrFile' | 'qrPreview' | 'removeQr'>> };

function reducer(state: State, action: Action): State {
 switch (action.type) {
 case "SET_WORKSPACE":
 return { ...state, workspace: action.payload };
 case "SET_CONFIGS":
 return { ...state, configs: action.payload };
 case "UPDATE_CONFIG":
 return {
 ...state,
 configs: state.configs.map((c) =>
 c.localId === action.id ? { ...c, ...action.payload } : c
 ),
 };
 case "ADD_CONFIG":
 return { ...state, configs: [...state.configs, action.payload] };
 case "REMOVE_CONFIG": {
 const target = state.configs.find((c) => c.localId === action.id);
 const nextDeleted = target?.id && !state.deletedConfigIds.includes(target.id)
 ? [...state.deletedConfigIds, target.id]
 : state.deletedConfigIds;
 return {
 ...state,
 configs: state.configs.filter((c) => c.localId !== action.id),
 deletedConfigIds: nextDeleted,
 };
 }
 case "CLEAR_DELETED_CONFIGS":
 return { ...state, deletedConfigIds: [] };
 case "SET_LOADING":
 return { ...state, loading: action.payload };
 case "SET_SAVING":
 return { ...state, saving: action.payload };
 case "SET_MESSAGE":
 return { ...state, message: action.payload };
 case "SET_FOOTER_EXPANDED":
 return { ...state, isFooterExpanded: action.payload };
 case "SET_SHOW_BREAKDOWN":
 return { ...state, showBreakdown: action.payload };
 case "SET_HELP":
 return { ...state, helpContent: action.payload };
 case "UPDATE_PAYMENT":
 return { ...state, ...action.payload };
 default:
 return state;
 }
}

const initialState: State = {
 workspace: null,
 configs: [],
 deletedConfigIds: [],
 loading: true,
 saving: false,
 message: null,
 isFooterExpanded: true,
 showBreakdown: false,
 helpContent: null,
 accountName: "",
 accountNumber: "",
 isEnabled: true,
 qrFile: null,
 qrPreview: null,
 removeQr: false,
};

export function BillingOperationsPanel({
	viewMode = "rates",
	propertyId = "all",
	utilityType,
	embedded = false,
	onDirtyChange,
	onRegisterSave,
	onRegisterDiscard,
	onSaved,
}: {
	viewMode?: "rates" | "gcash";
	propertyId?: string;
	utilityType?: "water" | "electricity";
	embedded?: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
	onRegisterSave?: (saveFn: () => Promise<boolean>) => void;
	onRegisterDiscard?: (discardFn: () => void) => void;
	onSaved?: (workspace: BillingWorkspace) => void;
}) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const {
		workspace,
		configs,
		loading,
		saving,
		message,
		isFooterExpanded,
		showBreakdown,
		helpContent,
		accountName,
		accountNumber,
		isEnabled,
		qrPreview,
		removeQr
	} = state;

	const [mounted, setMounted] = useState(false);
	const [viewingInventoryProperty, setViewingInventoryProperty] = useState<any | null>(null);
	useEffect(() => {
		setMounted(true);
	}, []);

	const initialPaymentRef = useRef<{
		accountName: string;
		accountNumber: string;
		isEnabled: boolean;
		qrPreview: string | null;
	} | null>(null);

	const originalConfigsRef = useRef<UtilityConfigDraft[] | null>(null);

	const [showSaveConfirm, setShowSaveConfirm] = useState(false);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			try {
				const response = await fetch("/api/landlord/payment-settings", { cache: "no-store" });
				if (!response.ok) throw new Error();
				const payload = (await response.json()) as BillingWorkspace;
				if (!alive) return;
				
				const seededConfigs = payload.utilityConfigs.map((config) =>
					makeDraft({
						localId: config.id,
						id: config.id,
						property_id: config.property_id,
						unit_id: config.unit_id,
						utility_type: config.utility_type,
						billing_mode: config.billing_mode,
						rate_per_unit: Number(config.rate_per_unit),
						unit_label: config.unit_label as "kwh" | "cubic_meter",
						is_active: config.is_active,
						effective_from: config.effective_from,
						effective_to: config.effective_to,
						note: config.note,
						responsibility_mode: config.note === "tenant_direct" ? "tenant_direct" : "landlord_bills",
					}),
				);

				for (const property of payload.properties) {
					for (const utility of ["water", "electricity"] as const) {
						const exists = seededConfigs.some((config) => 
							config.property_id === property.id && 
							config.utility_type === utility && 
							config.unit_id === null
						);
						if (!exists) {
							seededConfigs.push(makeDraft({ 
								property_id: property.id, 
								utility_type: utility, 
								unit_label: utility === "water" ? "cubic_meter" : "kwh" 
							}));
						}
					}
				}
				
				initialPaymentRef.current = {
					accountName: (payload.paymentDestination as any)?.account_name ?? "",
					accountNumber: (payload.paymentDestination as any)?.account_number ?? "",
					isEnabled: (payload.paymentDestination as any)?.is_enabled ?? true,
					qrPreview: (payload.paymentDestination as any)?.qr_image_url ?? null
				};

				originalConfigsRef.current = seededConfigs.map(c => ({ ...c }));

				dispatch({ type: "SET_WORKSPACE", payload });
				dispatch({ type: "SET_CONFIGS", payload: seededConfigs });
				dispatch({ type: "CLEAR_DELETED_CONFIGS" });
				dispatch({ 
					type: "UPDATE_PAYMENT", 
					payload: {
						accountName: (payload.paymentDestination as any)?.account_name ?? "",
						accountNumber: (payload.paymentDestination as any)?.account_number ?? "",
						isEnabled: (payload.paymentDestination as any)?.is_enabled ?? true,
						qrPreview: (payload.paymentDestination as any)?.qr_image_url ?? null
					}
				});
			} catch (err) {
				console.error(err);
				if (alive) dispatch({ type: "SET_MESSAGE", payload: { type: "error", value: "Unable to load billing settings." } });
			} finally {
				if (alive) dispatch({ type: "SET_LOADING", payload: false });
			}
		};
		load();
		return () => { alive = false; };
	}, []);

	const updateConfig = useCallback((localId: string, patch: Partial<UtilityConfigDraft>) => {
		dispatch({ type: "UPDATE_CONFIG", id: localId, payload: patch });
	}, []);

	const addOverride = useCallback((pId: string, type: "water" | "electricity") => {
		dispatch({ type: "ADD_CONFIG", payload: makeDraft({ property_id: pId, utility_type: type, unit_label: type === "water" ? "cubic_meter" : "kwh", unit_id: "" }) });
	}, []);

	const removeConfig = useCallback((localId: string) => {
		dispatch({ type: "REMOVE_CONFIG", id: localId });
	}, []);

	const isGcashDirty = useMemo(() => {
		if (!initialPaymentRef.current) return false;
		const init = initialPaymentRef.current;
		return (
			accountName !== init.accountName ||
			accountNumber !== init.accountNumber ||
			isEnabled !== init.isEnabled ||
			removeQr ||
			state.qrFile !== null
		);
	}, [accountName, accountNumber, isEnabled, removeQr, state.qrFile]);

	const diff = useMemo(() => {
		if (!originalConfigsRef.current || !workspace) {
			return {
				items: [] as ConfigDiffItem[],
				totalCount: 0,
				isDirty: false,
			};
		}

		const propertyMap = new Map(workspace.properties.map(p => [p.id, p]));
		const originalMap = new Map(originalConfigsRef.current.map(c => [c.localId, c]));
		const originalById = new Map<string, UtilityConfigDraft>();
		for (const orig of originalConfigsRef.current) {
			if (orig.id) originalById.set(orig.id, orig);
		}

		const items: ConfigDiffItem[] = [];

		const getStrategyLabel = (c: UtilityConfigDraft) => {
			if (c.billing_mode === "included_in_rent") return "Included in Rent";
			if (c.responsibility_mode === "tenant_direct") return "Direct to Provider";
			return `Submetered (₱${c.rate_per_unit}/${c.unit_label === "kwh" ? "kWh" : "m³"})`;
		};

		for (const curr of configs) {
			const prop = propertyMap.get(curr.property_id);
			const propertyName = prop?.name || "Property";
			const unit = prop?.units.find(u => u.id === curr.unit_id);
			const unitName = unit ? unit.name : (curr.unit_id ? "Custom Unit" : null);

			const orig = originalMap.get(curr.localId) || (curr.id ? originalById.get(curr.id) : undefined);

			if (!orig) {
				// Newly added override
				items.push({
					type: "added",
					localId: curr.localId,
					propertyId: curr.property_id,
					propertyName,
					unitId: curr.unit_id,
					unitName,
					utilityType: curr.utility_type,
					summary: `New rule added for ${unitName || "unassigned unit"}`,
					newValue: getStrategyLabel(curr),
				});
			} else {
				// Compare with original
				const isStrategyDiff = curr.billing_mode !== orig.billing_mode || curr.responsibility_mode !== orig.responsibility_mode;
				const isRateDiff = Number(curr.rate_per_unit) !== Number(orig.rate_per_unit);
				const isUnitDiff = curr.unit_id !== orig.unit_id;
				const isDateDiff = curr.effective_from !== orig.effective_from;

				if (isStrategyDiff || isRateDiff || isUnitDiff || isDateDiff) {
					const oldLabel = getStrategyLabel(orig);
					const newLabel = getStrategyLabel(curr);
					let changeDesc = "";
					if (isStrategyDiff) {
						changeDesc = `Strategy changed from ${orig.billing_mode === "included_in_rent" ? "Included" : (orig.responsibility_mode === "tenant_direct" ? "Direct" : "Submetered")} to ${curr.billing_mode === "included_in_rent" ? "Included" : (curr.responsibility_mode === "tenant_direct" ? "Direct" : "Submetered")}`;
					} else if (isRateDiff) {
						changeDesc = `Rate updated from ₱${orig.rate_per_unit} to ₱${curr.rate_per_unit}`;
					} else if (isUnitDiff) {
						changeDesc = "Assigned unit changed";
					} else if (isDateDiff) {
						changeDesc = `Effective date changed from ${orig.effective_from} to ${curr.effective_from}`;
					}

					items.push({
						type: "modified",
						localId: curr.localId,
						propertyId: curr.property_id,
						propertyName,
						unitId: curr.unit_id,
						unitName,
						utilityType: curr.utility_type,
						summary: changeDesc,
						oldValue: oldLabel,
						newValue: newLabel,
					});
				}
			}
		}

		// Check deleted overrides
		for (const deletedId of state.deletedConfigIds) {
			const orig = originalById.get(deletedId);
			if (orig) {
				const prop = propertyMap.get(orig.property_id);
				const unit = prop?.units.find(u => u.id === orig.unit_id);
				items.push({
					type: "deleted",
					localId: orig.localId,
					propertyId: orig.property_id,
					propertyName: prop?.name || "Property",
					unitId: orig.unit_id,
					unitName: unit ? unit.name : "Unit",
					utilityType: orig.utility_type,
					summary: `Unit rule removed (reverts to Property Default)`,
					oldValue: getStrategyLabel(orig),
					newValue: "Property Default",
				});
			}
		}

		return {
			items,
			totalCount: items.length,
			isDirty: items.length > 0,
		};
	}, [configs, state.deletedConfigIds, workspace]);

	const isRatesDirty = diff.isDirty;
	const isPanelDirty = viewMode === "gcash" ? isGcashDirty : isRatesDirty;

	useEffect(() => {
		if (embedded && onDirtyChange) {
			onDirtyChange(isPanelDirty);
		}
	}, [embedded, onDirtyChange, isPanelDirty]);

	const save = useCallback(async (): Promise<boolean> => {
		try {
			dispatch({ type: "SET_SAVING", payload: true });
			dispatch({ type: "SET_MESSAGE", payload: null });
			const formData = new FormData();

			if (viewMode === "gcash") {
				const cleanName = accountName.trim();
				const cleanNumber = accountNumber.replace(/\D/g, "");

				if (!cleanName || cleanName.length < 2) {
					dispatch({
						type: "SET_MESSAGE",
						payload: { type: "error", value: "Please provide a valid Account Name (minimum 2 characters)." }
					});
					return false;
				}

				if (!/^09\d{9}$/.test(cleanNumber)) {
					dispatch({
						type: "SET_MESSAGE",
						payload: { type: "error", value: "Please provide a valid 11-digit GCash mobile number starting with 09 (e.g. 09171234567)." }
					});
					return false;
				}

				formData.append("saveType", "gcash");
				formData.append("accountName", cleanName);
				formData.append("accountNumber", cleanNumber);
				formData.append("isEnabled", String(isEnabled));
				formData.append("removeQr", String(removeQr));
				if (state.qrFile) formData.append("qr", state.qrFile);
			} else {
				formData.append("saveType", "rates");
				const validConfigs = configs
					.filter((c) => c.property_id && c.property_id !== "all")
					.map((config) => ({
						id: config.id,
						property_id: config.property_id,
						unit_id: config.unit_id && typeof config.unit_id === "string" && config.unit_id.trim() ? config.unit_id.trim() : null,
						utility_type: config.utility_type,
						billing_mode: config.billing_mode,
						rate_per_unit: Number(config.rate_per_unit) || 0,
						unit_label: config.unit_label,
						is_active: Boolean(config.is_active),
						effective_from: config.effective_from || today,
						effective_to: config.effective_to || null,
						note: config.responsibility_mode === "tenant_direct" ? "tenant_direct" : (config.note || null),
					}));
				formData.append("utilityConfigs", JSON.stringify(validConfigs));
				if (state.deletedConfigIds.length > 0) {
					formData.append("deletedConfigIds", JSON.stringify(state.deletedConfigIds));
				}
			}

			const response = await fetch("/api/landlord/payment-settings", { method: "POST", body: formData });
			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to save settings.");
			}
			const payload = (await response.json()) as BillingWorkspace;
			
			dispatch({ type: "SET_WORKSPACE", payload });
			initialPaymentRef.current = {
				accountName: (payload.paymentDestination as any)?.account_name ?? accountName.trim(),
				accountNumber: (payload.paymentDestination as any)?.account_number ?? accountNumber.replace(/\D/g, ""),
				isEnabled: (payload.paymentDestination as any)?.is_enabled ?? isEnabled,
				qrPreview: (payload.paymentDestination as any)?.qr_image_url ?? qrPreview
			};

			if (viewMode === "rates") {
				const freshConfigs = payload.utilityConfigs.map((config) =>
					makeDraft({
						localId: config.id,
						id: config.id,
						property_id: config.property_id,
						unit_id: config.unit_id,
						utility_type: config.utility_type,
						billing_mode: config.billing_mode,
						rate_per_unit: Number(config.rate_per_unit),
						unit_label: config.unit_label as "kwh" | "cubic_meter",
						is_active: config.is_active,
						effective_from: config.effective_from,
						effective_to: config.effective_to,
						note: config.note,
						responsibility_mode: config.note === "tenant_direct" ? "tenant_direct" : "landlord_bills",
					}),
				);

				for (const property of payload.properties) {
					for (const utility of ["water", "electricity"] as const) {
						const exists = freshConfigs.some((config) => 
							config.property_id === property.id && 
							config.utility_type === utility && 
							config.unit_id === null
						);
						if (!exists) {
							freshConfigs.push(makeDraft({ 
								property_id: property.id, 
								utility_type: utility, 
								unit_label: utility === "water" ? "cubic_meter" : "kwh" 
							}));
						}
					}
				}

				originalConfigsRef.current = freshConfigs.map(c => ({ ...c }));
				dispatch({ type: "SET_CONFIGS", payload: freshConfigs });
				dispatch({ type: "CLEAR_DELETED_CONFIGS" });
			}

			dispatch({ 
				type: "UPDATE_PAYMENT", 
				payload: {
					qrFile: null,
					removeQr: false,
					qrPreview: (payload.paymentDestination as any)?.qr_image_url ?? null
				}
			});
			dispatch({ type: "SET_SHOW_BREAKDOWN", payload: false });
			const successMsg = viewMode === "gcash" ? "GCash settings saved successfully." : "Utility rates saved successfully.";
			dispatch({ type: "SET_MESSAGE", payload: { type: "success", value: successMsg } });
			onSaved?.(payload);
			return true;
		} catch (error: any) {
			dispatch({ type: "SET_MESSAGE", payload: { type: "error", value: error?.message || "Failed to save settings." } });
			return false;
		} finally {
			dispatch({ type: "SET_SAVING", payload: false });
		}
	}, [viewMode, accountName, accountNumber, isEnabled, removeQr, state.qrFile, configs, qrPreview, state.deletedConfigIds, onSaved]);

	const discard = useCallback(() => {
		if (viewMode === "gcash") {
			if (initialPaymentRef.current) {
				dispatch({
					type: "UPDATE_PAYMENT",
					payload: {
						accountName: initialPaymentRef.current.accountName,
						accountNumber: initialPaymentRef.current.accountNumber,
						isEnabled: initialPaymentRef.current.isEnabled,
						qrPreview: initialPaymentRef.current.qrPreview,
						qrFile: null,
						removeQr: false,
					}
				});
				dispatch({ type: "SET_MESSAGE", payload: null });
			}
		} else {
			if (originalConfigsRef.current) {
				dispatch({
					type: "SET_CONFIGS",
					payload: originalConfigsRef.current.map(c => ({ ...c }))
				});
				dispatch({ type: "CLEAR_DELETED_CONFIGS" });
				dispatch({ type: "SET_SHOW_BREAKDOWN", payload: false });
				dispatch({ type: "SET_MESSAGE", payload: null });
			}
		}
	}, [viewMode]);

	const handleRequestDiscard = useCallback(() => {
		setShowDiscardConfirm(true);
	}, []);

	const handleRequestSave = useCallback(() => {
		if (viewMode === "gcash") {
			const cleanName = accountName.trim();
			const cleanNumber = accountNumber.replace(/\D/g, "");

			if (!cleanName || cleanName.length < 2) {
				dispatch({
					type: "SET_MESSAGE",
					payload: { type: "error", value: "Please provide a valid Account Name (minimum 2 characters)." }
				});
				return;
			}

			if (!/^09\d{9}$/.test(cleanNumber)) {
				dispatch({
					type: "SET_MESSAGE",
					payload: { type: "error", value: "Please provide a valid 11-digit GCash mobile number starting with 09 (e.g. 09171234567)." }
				});
				return;
			}
		}
		setShowSaveConfirm(true);
	}, [viewMode, accountName, accountNumber]);

	const handleConfirmDiscard = useCallback(() => {
		discard();
		setShowDiscardConfirm(false);
	}, [discard]);

	const handleConfirmSave = useCallback(async () => {
		const success = await save();
		if (success) {
			setShowSaveConfirm(false);
		}
	}, [save]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				if (isPanelDirty && !saving) {
					e.preventDefault();
					handleRequestSave();
				}
			} else if (e.key === "Escape") {
				if (showSaveConfirm && !saving) setShowSaveConfirm(false);
				else if (showDiscardConfirm) setShowDiscardConfirm(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isPanelDirty, saving, handleRequestSave, showSaveConfirm, showDiscardConfirm]);

	useEffect(() => {
		if (embedded) {
			onRegisterSave?.(save);
			onRegisterDiscard?.(discard);
		}
	}, [embedded, onRegisterSave, onRegisterDiscard, save, discard]);


	if (loading) {
		return (
			<div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-3xl neumorphic-panel">
				<Loader2 className="size-8 animate-spin text-primary" />
				<p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading settings...</p>
			</div>
		);
	}

	if (!workspace) return null;

	const pendingChangesCount = diff.totalCount;

	return (
		<div className="space-y-12">
			<AnimatePresence>
				{showBreakdown && (
					<div className="fixed inset-0 z-[110] flex items-end justify-center p-6 sm:items-center">
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
							className="absolute inset-0 bg-background/60 backdrop-blur-sm"
						/>
						<motion.div 
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] neumorphic-panel flex flex-col max-h-[80vh]"
						>
							<div className="p-8 border-b border-border/40 flex items-center justify-between sticky top-0 bg-card z-10">
								<div>
									<div className="flex items-center gap-3">
										<h3 className="text-xl font-black text-foreground">Review Pending Changes</h3>
										<span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
											{pendingChangesCount} {pendingChangesCount === 1 ? "Update" : "Updates"}
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{pendingChangesCount > 0 
											? "Verify your changes before writing them to the live utility configuration."
											: "No pending changes. All configurations match the saved settings."}
									</p>
								</div>
								<button 
									onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
									className="size-10 flex items-center justify-center rounded-xl hover:neumorphic-inset transition-colors cursor-pointer"
								>
									<X className="size-5 text-muted-foreground" />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 space-y-3">
								{diff.items.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<CheckCircle2 className="size-12 text-emerald-500 mb-3 opacity-80" />
										<p className="text-sm font-bold text-foreground">All Configurations Up to Date</p>
										<p className="text-xs text-muted-foreground mt-1 max-w-xs">
											There are no unsaved edits. Any changes made to building rates or unit rules will appear here for review.
										</p>
									</div>
								) : (
									diff.items.map((item) => {
										const Meta = utilityMeta[item.utilityType];
										return (
											<div 
												key={item.localId} 
												className="p-4 rounded-2xl neumorphic-inset border border-border/30 flex flex-col gap-3 transition-colors"
											>
												<div className="flex items-center justify-between gap-3">
													<div className="flex items-center gap-3">
														<div className={cn("size-9 flex items-center justify-center rounded-xl border shrink-0", Meta.bg, Meta.tint, Meta.border)}>
															<Meta.icon className="size-4" />
														</div>
														<div>
															<p className="text-sm font-black text-foreground">
																{item.propertyName}
																<span className="text-muted-foreground font-normal ml-1.5">
																	• {item.unitName || "Building Default"}
																</span>
															</p>
															<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
																{item.utilityType} Management
															</span>
														</div>
													</div>
													<div>
														{item.type === "added" && (
															<span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
																New Rule
															</span>
														)}
														{item.type === "modified" && (
															<span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
																Modified
															</span>
														)}
														{item.type === "deleted" && (
															<span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
																Removed
															</span>
														)}
													</div>
												</div>

												<div className="pl-12">
													<p className="text-xs text-foreground/80 font-medium">
														{item.summary}
													</p>
													{item.oldValue && item.newValue && (
														<div className="flex items-center gap-2 mt-2 text-xs">
															<span className="px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground line-through text-[11px] font-medium">
																{item.oldValue}
															</span>
															<ArrowRight className="size-3 text-muted-foreground shrink-0" />
															<span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
																{item.newValue}
															</span>
														</div>
													)}
												</div>
											</div>
										);
									})
								)}
							</div>

							<div className="p-6 border-t border-border/40 neumorphic-inset flex items-center justify-between gap-3">
								{diff.items.length > 0 ? (
									<>
										<button 
											onClick={handleRequestDiscard}
											className="px-4 py-3 rounded-xl border border-red-500/20 text-red-600 hover:bg-red-500/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2"
										>
											<RotateCcw className="size-3.5" />
											Discard All
										</button>
										<div className="flex items-center gap-2">
											<button 
												onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
												className="px-5 py-3 rounded-xl hover:neumorphic-inset text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer"
											>
												Back to Editor
											</button>
											<button 
												onClick={handleRequestSave}
												disabled={saving}
												className="px-6 py-3 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-widest text-primary-foreground hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-2"
											>
												{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
												Save Changes
											</button>
										</div>
									</>
								) : (
									<button 
										onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
										className="w-full py-3.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer"
									>
										Close
									</button>
								)}
							</div>
						</motion.div>
					</div>
				)}

				{helpContent && (
					<div className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center p-6">
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
							className="absolute inset-0 bg-background/60 backdrop-blur-md"
						/>
						<motion.div 
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] neumorphic-panel p-10 "
						>
							<div className="absolute -right-12 -top-12 opacity-[0.03]">
								<HelpCircle className="size-48" />
							</div>

							<div className="relative z-10 space-y-6">
								<div className="flex items-center justify-between">
									<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
										<Info className="size-3" />
										Strategy Guide
									</div>
									<button 
										onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
										className="size-10 flex items-center justify-center rounded-xl hover:neumorphic-inset transition-colors"
									>
										<X className="size-5 text-muted-foreground" />
									</button>
								</div>

								<div className="space-y-2">
									<h4 className="text-2xl font-black text-foreground">{helpContent.title}</h4>
									<div className="size-12 bg-primary rounded-full" />
								</div>

								<div className="text-sm text-muted-foreground leading-relaxed">
									{helpContent.content}
								</div>

								<button
									onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
									className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
								>
									Got it, thanks!
								</button>
							</div>
						</motion.div>
					</div>
				)}

					{/* Unit Inventory Modal */}
					{viewingInventoryProperty && (
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 10 }}
								className="w-full max-w-lg rounded-3xl neumorphic-panel p-5 sm:p-7 space-y-5 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-border/60 bg-card"
							>
								<div className="flex items-center justify-between pb-3 border-b border-border/40">
									<div className="flex items-center gap-3 min-w-0">
										<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
											<Boxes className="size-5" />
										</div>
										<div className="min-w-0">
											<h3 className="text-base sm:text-lg font-black text-foreground truncate">
												{viewingInventoryProperty.name}
											</h3>
											<p className="text-xs text-muted-foreground font-semibold">
												Unit Inventory & Status ({viewingInventoryProperty.units?.length ?? 0} {viewingInventoryProperty.units?.length === 1 ? 'unit' : 'units'})
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setViewingInventoryProperty(null)}
										className="size-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
										aria-label="Close modal"
									>
										<X className="size-4" />
									</button>
								</div>

								<div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[140px] max-h-[50vh]">
									{!viewingInventoryProperty.units || viewingInventoryProperty.units.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground">
											<Building2 className="size-10 mx-auto mb-2 opacity-30" />
											<p className="text-sm font-semibold">No units registered for this property yet.</p>
											<p className="text-xs opacity-70 mt-1">Add units in Property Management to configure rates and utilities.</p>
										</div>
									) : (
										viewingInventoryProperty.units.map((unit: any) => {
											const activeLease = workspace?.activeLeases?.find(
												(l) => l.unit?.id === unit.id || (l as any).unit_id === unit.id
											);
											const isOccupied = unit.status === 'occupied' || !!activeLease;
											const isMaintenance = unit.status === 'maintenance';

											return (
												<div
													key={unit.id}
													className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors gap-3"
												>
													<div className="space-y-1 min-w-0">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-bold text-sm text-foreground">{unit.name}</span>
															<span
																className={cn(
																	"text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
																	isOccupied
																		? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
																		: isMaintenance
																		? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
																		: "bg-sky-500/10 text-sky-600 dark:text-sky-400"
																)}
															>
																{isOccupied ? "Occupied" : isMaintenance ? "Maintenance" : "Vacant"}
															</span>
														</div>
														{activeLease?.tenant?.full_name ? (
															<p className="text-xs text-muted-foreground truncate">
																Tenant: <span className="font-semibold text-foreground/80">{activeLease.tenant.full_name}</span>
															</p>
														) : (
															<p className="text-[11px] text-muted-foreground/60">No active lease</p>
														)}
													</div>

													<div className="text-right shrink-0">
														<span className="text-xs sm:text-sm font-black text-foreground">
															₱{Number(activeLease?.monthly_rent ?? unit.rent_amount ?? 0).toLocaleString()}
														</span>
														<span className="text-[10px] text-muted-foreground block">/mo</span>
													</div>
												</div>
											);
										})
									)}
								</div>

								<div className="pt-3 border-t border-border/40">
									<button
										type="button"
										onClick={() => setViewingInventoryProperty(null)}
										className="w-full py-2.5 sm:py-3 rounded-xl border border-border/60 hover:bg-muted text-xs font-bold text-muted-foreground transition-all cursor-pointer text-center"
									>
										Close
									</button>
								</div>
							</motion.div>
						</div>
					)}

				{/* Discard Confirmation Modal */}
				{showDiscardConfirm && (
					<div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowDiscardConfirm(false)}
							className="absolute inset-0 bg-background/70 backdrop-blur-md"
						/>
						<motion.div 
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-md rounded-3xl neumorphic-panel border border-border/80 bg-card p-6 sm:p-7 shadow-2xl space-y-5"
						>
							<div className="flex items-start gap-3.5">
								<div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
									<RotateCcw className="size-5" />
								</div>
								<div className="space-y-1">
									<h3 className="text-lg font-black text-foreground">
										Discard Unsaved Changes?
									</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Are you sure you want to revert your edits? Any unsaved modifications will be permanently lost.
									</p>
								</div>
							</div>

							<div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground font-medium">Scope</span>
									<span className="font-bold text-foreground">
										{viewMode === "gcash" ? "GCash Payment Settings" : (propertyId !== "all" && workspace.properties.find(p => p.id === propertyId)?.name) || "All Properties"}
									</span>
								</div>
								{viewMode === "rates" && (
									<div className="flex justify-between items-center border-t border-border/40 pt-2">
										<span className="text-muted-foreground font-medium">Pending Edits</span>
										<span className="font-black text-amber-600 dark:text-amber-400">
											{pendingChangesCount} {pendingChangesCount === 1 ? "rule modification" : "rule modifications"}
										</span>
									</div>
								)}
								<div className="flex justify-between items-center border-t border-border/40 pt-2">
									<span className="text-muted-foreground font-medium">Action</span>
									<span className="font-medium text-foreground">
										Revert back to last saved state
									</span>
								</div>
							</div>

							<div className="flex items-center gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowDiscardConfirm(false)}
									className="flex-1 py-3 rounded-xl border border-border/80 hover:neumorphic-inset font-bold text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
								>
									Keep Editing
								</button>
								<button
									type="button"
									onClick={handleConfirmDiscard}
									className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
								>
									<RotateCcw className="size-3.5" />
									Discard Changes
								</button>
							</div>
						</motion.div>
					</div>
				)}

				{/* Save Confirmation Modal */}
				{showSaveConfirm && (
					<div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => !saving && setShowSaveConfirm(false)}
							className="absolute inset-0 bg-background/70 backdrop-blur-md"
						/>
						<motion.div 
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-md rounded-3xl neumorphic-panel border border-border/80 bg-card p-6 sm:p-7 shadow-2xl space-y-5"
						>
							<div className="flex items-start gap-3.5">
								<div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
									<Save className="size-5" />
								</div>
								<div className="space-y-1">
									<h3 className="text-lg font-black text-foreground">
										Confirm & Save Changes?
									</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{viewMode === "gcash"
											? "Apply your updated GCash recipient credentials. Tenants will see these details immediately when paying rent."
											: "Apply updated utility rates and rules to the live configuration for this property."}
									</p>
								</div>
							</div>

							<div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-2.5 text-xs">
								{viewMode === "rates" ? (
									<>
										<div className="flex justify-between items-center">
											<span className="text-muted-foreground font-medium">Target Property</span>
											<span className="font-bold text-foreground">
												{(propertyId !== "all" && workspace.properties.find(p => p.id === propertyId)?.name) || "All Properties"}
											</span>
										</div>
										<div className="flex justify-between items-center border-t border-border/40 pt-2">
											<span className="text-muted-foreground font-medium">Total Updates</span>
											<span className="font-black text-primary">
												{pendingChangesCount} {pendingChangesCount === 1 ? "rule" : "rules"}
											</span>
										</div>
										{diff.items.filter(i => i.type === "modified").length > 0 && (
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Modified Rules</span>
												<span className="font-bold text-foreground">
													{diff.items.filter(i => i.type === "modified").length}
												</span>
											</div>
										)}
										{diff.items.filter(i => i.type === "added").length > 0 && (
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">New Overrides</span>
												<span className="font-bold text-emerald-600 dark:text-emerald-400">
													+{diff.items.filter(i => i.type === "added").length}
												</span>
											</div>
										)}
										{diff.items.filter(i => i.type === "deleted").length > 0 && (
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Removed Overrides</span>
												<span className="font-bold text-red-500">
													-{diff.items.filter(i => i.type === "deleted").length}
												</span>
											</div>
										)}
									</>
								) : (
									<>
										<div className="flex justify-between items-center">
											<span className="text-muted-foreground font-medium">Account Name</span>
											<span className="font-bold text-foreground truncate max-w-[200px]">{accountName}</span>
										</div>
										<div className="flex justify-between items-center border-t border-border/40 pt-2">
											<span className="text-muted-foreground font-medium">GCash Number</span>
											<span className="font-mono font-bold text-foreground">{accountNumber}</span>
										</div>
										<div className="flex justify-between items-center border-t border-border/40 pt-2">
											<span className="text-muted-foreground font-medium">Rent Invoices</span>
											<span className={cn("font-bold", isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
												{isEnabled ? "Enabled (Active)" : "Disabled"}
											</span>
										</div>
									</>
								)}
							</div>

							<div className="flex items-center gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowSaveConfirm(false)}
									disabled={saving}
									className="flex-1 py-3 rounded-xl border border-border/80 hover:neumorphic-inset font-bold text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleConfirmSave}
									disabled={saving}
									className="flex-[1.3] py-3 rounded-xl neumorphic-primary text-primary-foreground font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
								>
									{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
									Confirm & Save
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Collapsible Sticky Action Footer (Rendered ONLY when changes exist and not embedded) */}
			{!embedded && (
				<AnimatePresence>
					{isPanelDirty && (
						<div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
							<motion.div 
								layout
								initial={{ opacity: 0, y: 40, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 40, scale: 0.96 }}
								transition={{ type: "spring", stiffness: 450, damping: 35 }}
								className={cn(
									"pointer-events-auto bg-background/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-border/80 relative overflow-hidden",
									isFooterExpanded ? "px-4 py-3 rounded-[2rem]" : "rounded-full"
								)}
							>
								<AnimatePresence mode="wait">
									{isFooterExpanded ? (
										<motion.div 
											key="expanded"
											initial={{ opacity: 0, x: -15 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -15 }}
											className="flex items-center gap-4 sm:gap-6 pl-3 pr-1"
										>
											<div className="flex flex-col text-left">
												<div className="flex items-center gap-2">
													<span className="size-2 rounded-full bg-amber-500 animate-pulse" />
													<span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
														Unsaved Changes
													</span>
												</div>
												<p className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5 font-medium">
													<span className="font-black text-foreground">
														{pendingChangesCount}
													</span> {pendingChangesCount === 1 ? "change pending" : "changes pending"}
													{propertyId !== "all" && workspace.properties.find(p => p.id === propertyId) ? (
														<span className="hidden sm:inline"> for {workspace.properties.find(p => p.id === propertyId)?.name}</span>
													) : null}
												</p>
											</div>

											<div className="h-8 w-px bg-border/60" />

											<div className="flex items-center gap-2">
												<button 
													type="button"
													onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: true })}
													className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border/70 hover:neumorphic-inset text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
													title="Review specific changes"
												>
													<Eye className="size-3.5" />
													<span className="hidden md:inline">Review</span>
												</button>

												<button
													type="button"
													onClick={handleRequestDiscard}
													disabled={saving}
													className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-500/20 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
													title="Revert all unsaved changes"
												>
													<RotateCcw className="size-3.5" />
													<span className="hidden md:inline">Discard</span>
												</button>

												<button
													type="button"
													onClick={handleRequestSave}
													disabled={saving}
													className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl neumorphic-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
												>
													{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
													Save Changes
												</button>
											</div>

											<button 
												type="button"
												onClick={() => dispatch({ type: 'SET_FOOTER_EXPANDED', payload: false })}
												className="size-8 flex items-center justify-center rounded-lg hover:neumorphic-inset transition-colors cursor-pointer"
												title="Collapse dock"
											>
												<ChevronDown className="size-4 text-muted-foreground" />
											</button>
										</motion.div>
									) : (
										<motion.button
											key="collapsed"
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											onClick={() => dispatch({ type: 'SET_FOOTER_EXPANDED', payload: true })}
											className="flex size-11 items-center justify-center text-primary transition-all hover:bg-primary/5 cursor-pointer relative"
											title={`Expand console (${pendingChangesCount} unsaved)`}
										>
											<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500" />
											<ChevronUp className="size-5" />
										</motion.button>
									)}
								</AnimatePresence>
							</motion.div>
						</div>
					)}
				</AnimatePresence>
			)}

				{message && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className={cn(
							"flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm",
							message.type === "success"
								? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
								: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
						)}
					>
						<div className="flex items-center gap-3">
							{message.type === "success" ? <CheckCircle2 className="size-5 text-emerald-500 shrink-0" /> : <Info className="size-5 text-red-500 shrink-0" />}
							<span className="text-sm font-bold">{message.value}</span>
						</div>
						<button
							type="button"
							onClick={() => dispatch({ type: 'SET_MESSAGE', payload: null })}
							className="size-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					</motion.div>
				)}

				{/* GCASH MODE */}
				{viewMode === "gcash" && (
					<section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
							{/* Configuration Form Card */}
							<div className="lg:col-span-7 space-y-6">
								<div className="rounded-3xl neumorphic-panel p-6 sm:p-8 space-y-6">
									{/* Card Header */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
										<div className="flex items-center gap-3.5">
											<div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
												<Smartphone className="size-6" />
											</div>
											<div>
												<h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">GCash Direct Payments</h3>
												<p className="text-xs text-muted-foreground mt-0.5">Receive rent and utility payments directly to your GCash account</p>
											</div>
										</div>

										<div className={cn(
											"inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black shrink-0 self-start sm:self-auto transition-all",
											isEnabled
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
												: "bg-muted text-muted-foreground border border-border"
										)}>
											<span className={cn("size-2 rounded-full", isEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50")} />
											<span>{isEnabled ? "Accepting Payments" : "Payments Disabled"}</span>
										</div>
									</div>

									{/* Input Fields */}
									<div className="grid gap-5 sm:grid-cols-2">
										<div className="space-y-1.5 min-w-0">
											<div className="flex items-center gap-1.5 px-1 whitespace-nowrap min-w-0">
												<User className="size-3.5 text-primary shrink-0" />
												<label className="text-xs font-black uppercase tracking-wider text-foreground/80 whitespace-nowrap">Account Name</label>
											</div>
											<input
												value={accountName}
												placeholder="e.g. Marina Reyes"
												maxLength={60}
												onChange={(event) => {
													const sanitized = event.target.value.replace(/[^a-zA-Z\s.,'-]/g, "");
													dispatch({ type: 'UPDATE_PAYMENT', payload: { accountName: sanitized } });
												}}
												className={cn(
													"w-full rounded-xl neumorphic-inset px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2",
													accountName.length > 0 && accountName.trim().length < 2
														? "ring-1 ring-rose-500/40 focus:ring-rose-500/30"
														: "focus:ring-primary/20"
												)}
											/>
											{accountName.length > 0 && accountName.trim().length < 2 ? (
												<p className="px-1 text-[11px] font-bold text-rose-500 flex items-center gap-1 whitespace-nowrap">
													<AlertCircle className="size-3 shrink-0" />
													Minimum 2 characters required
												</p>
											) : (
												<p className="px-1 text-[11px] text-muted-foreground whitespace-nowrap truncate">
													Must match your verified GCash name
												</p>
											)}
										</div>

										<div className="space-y-1.5 min-w-0">
											<div className="flex items-center gap-1.5 px-1 whitespace-nowrap min-w-0">
												<Phone className="size-3.5 text-primary shrink-0" />
												<label className="text-xs font-black uppercase tracking-wider text-foreground/80 whitespace-nowrap">GCash Number</label>
											</div>
											<input
												type="tel"
												inputMode="numeric"
												value={accountNumber}
												placeholder="09171234567"
												maxLength={11}
												onChange={(event) => {
													const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 11);
													dispatch({ type: 'UPDATE_PAYMENT', payload: { accountNumber: digitsOnly } });
												}}
												className={cn(
													"w-full rounded-xl neumorphic-inset px-4 py-3 text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2",
													accountNumber.length > 0 && !/^09\d{9}$/.test(accountNumber)
														? (accountNumber.length >= 2 && !accountNumber.startsWith("09"))
															? "ring-1 ring-rose-500/40 focus:ring-rose-500/30"
															: "ring-1 ring-amber-500/40 focus:ring-amber-500/30"
														: "focus:ring-primary/20"
												)}
											/>
											{accountNumber.length >= 2 && !accountNumber.startsWith("09") ? (
												<p className="px-1 text-[11px] font-bold text-rose-500 flex items-center gap-1 whitespace-nowrap">
													<AlertCircle className="size-3 shrink-0" />
													Must begin with 09 (e.g. 0917...)
												</p>
											) : accountNumber.length > 0 && accountNumber.length < 11 ? (
												<p className="px-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 whitespace-nowrap">
													<AlertCircle className="size-3 shrink-0" />
													{11 - accountNumber.length} more digit{11 - accountNumber.length > 1 ? "s" : ""} needed
												</p>
											) : (
												<p className="px-1 text-[11px] text-muted-foreground whitespace-nowrap truncate">
													11-digit mobile number starting with 09
												</p>
											)}
										</div>
									</div>

									{/* Payment Status Toggle Card */}
									<div className="rounded-2xl border border-border/80 neumorphic-inset/30 p-4 sm:p-5 flex items-center justify-between gap-4">
										<div className="space-y-0.5 pr-2">
											<div className="flex items-center gap-2">
												<span className="text-sm font-black text-foreground">Enable GCash for Rent Invoices</span>
												{isEnabled && (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
														Active
													</span>
												)}
											</div>
											<p className="text-xs text-muted-foreground leading-relaxed">
												When enabled, tenants will see this recipient and QR code when paying monthly rent.
											</p>
										</div>
										<button
											type="button"
											role="switch"
											aria-checked={isEnabled}
											onClick={() => dispatch({ type: 'UPDATE_PAYMENT', payload: { isEnabled: !isEnabled } })}
											className={cn(
												"relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30",
												isEnabled ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
											)}
										>
											<span
												className={cn(
													"pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
													isEnabled ? "translate-x-5" : "translate-x-0"
												)}
											/>
										</button>
									</div>



									{/* Footer Actions */}
									<div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<ShieldCheck className="size-4 text-emerald-500 shrink-0" />
											<span>Direct transfers • Zero platform deduction</span>
										</div>

										{!embedded && (
											<button
												type="button"
												onClick={handleRequestSave}
												disabled={saving}
												className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl neumorphic-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
											>
												{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
												Save GCash Settings
											</button>
										)}
									</div>
								</div>
							</div>

							{/* Tenant View Preview Card */}
							<div className="lg:col-span-5 sticky top-24">
								<div className="rounded-3xl neumorphic-panel p-6 sm:p-7 relative overflow-hidden border border-border/80 space-y-5">
									<div className="flex items-center justify-between pb-3 border-b border-border/60">
										<div className="flex items-center gap-2">
											<div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
											<span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tenant View Preview</span>
										</div>
										<span className="text-[10px] font-bold text-muted-foreground/60 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50">
											Live Card
										</span>
									</div>

									{/* Mobile Payment Card Mockup */}
									<div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-sm text-center space-y-4">
										{/* Top Brand Pill */}
										<div className="flex items-center justify-between px-1">
											<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
												<Smartphone className="size-3" />
												GCash Direct
											</div>
											<span className={cn("text-[10px] font-bold", isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
												● {isEnabled ? "Accepting" : "Disabled"}
											</span>
										</div>

										{/* Interactive QR Code Container & Controls */}
										<div className="space-y-3">
											<div className="group/qr relative mx-auto aspect-square w-48 overflow-hidden rounded-2xl bg-white p-3.5 shadow-md border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col items-center justify-center transition-all">
												{qrPreview ? (
													<>
														<Image src={qrPreview} alt="GCash QR Preview" width={180} height={180} unoptimized className="h-full w-full object-contain" />
														{/* Hover overlay */}
														<label
															htmlFor="side-qr-upload"
															className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer"
														>
															<Upload className="size-6 text-white" />
															<span className="text-xs font-black tracking-wide">Replace QR</span>
														</label>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																dispatch({ type: 'UPDATE_PAYMENT', payload: { removeQr: true, qrFile: null, qrPreview: null } });
															}}
															className="absolute top-2 right-2 z-10 size-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity shadow-sm cursor-pointer"
															title="Remove QR code"
														>
															<Trash2 className="size-3.5" />
														</button>
													</>
												) : (
													<label
														htmlFor="side-qr-upload"
														className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary rounded-xl text-muted-foreground hover:text-primary cursor-pointer transition-colors p-2 text-center group/empty"
													>
														<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover/empty:scale-110 transition-transform">
															<Upload className="size-4" />
														</div>
														<div className="space-y-0.5">
															<span className="text-[11px] font-black text-foreground block">Upload GCash QR</span>
															<span className="text-[9px] text-muted-foreground block">Click to select image</span>
														</div>
													</label>
												)}
											</div>

											{/* Hidden file input */}
											<input
												id="side-qr-upload"
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(event) => {
													const file = event.target.files?.[0] ?? null;
													if (file) {
														dispatch({ type: 'UPDATE_PAYMENT', payload: { qrFile: file, qrPreview: URL.createObjectURL(file), removeQr: false } });
													}
												}}
											/>

											{/* Remove action if QR exists */}
											{qrPreview && (
												<div className="flex items-center justify-center">
													<button
														type="button"
														onClick={() => dispatch({ type: 'UPDATE_PAYMENT', payload: { removeQr: true, qrFile: null, qrPreview: null } })}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-xs font-bold text-red-600 dark:text-red-400 transition-all cursor-pointer shadow-xs"
													>
														<Trash2 className="size-3" />
														<span>Remove QR</span>
													</button>
												</div>
											)}
										</div>

										{/* Recipient Info */}
										<div className="space-y-1 pt-1 border-t border-border/40">
											<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Official Recipient</p>
											<h4 className="text-base sm:text-lg font-black text-foreground truncate flex items-center justify-center gap-1.5">
												{accountName || "Juan Dela Cruz"}
												{accountName && <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
											</h4>
											<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl neumorphic-inset text-xs font-mono font-black text-primary mt-1">
												<Phone className="size-3 text-primary/70" />
												<span>{accountNumber || "0917 XXX XXXX"}</span>
											</div>
										</div>

										{/* Helper Notice */}
										<p className="text-[11px] text-muted-foreground leading-relaxed px-2 border-t border-border/40 pt-3">
											Tenants scan this QR code or use the number in their GCash app to send direct payments.
										</p>
									</div>

									<div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-muted-foreground/60 pt-1">
										<ShieldCheck className="size-3.5 text-primary/70" />
										<span>Verified iReside Landlord Payment Channel</span>
									</div>
								</div>
							</div>
						</div>
					</section>
				)}

 {/* RENT CONFIG MODE */}
 {viewMode === "rates" && (
 <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
 {workspace.properties
 .filter(p => propertyId === "all" || p.id === propertyId)
 .map(property => (
 <div key={property.id} className="space-y-8">
 {/* Property Header */}
					<div className="relative group overflow-hidden rounded-3xl neumorphic-panel p-5 sm:p-7 md:p-8 transition-all dark:bg-white/[0.01]">
						<div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
							<Building2 className="size-32 sm:size-40" />
						</div>

						<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
							<div className="flex items-center gap-4 sm:gap-6 min-w-0">
								<div className="size-12 sm:size-16 flex items-center justify-center rounded-2xl neumorphic-inset text-foreground shrink-0">
									<Building2 className="size-6 sm:size-8 text-primary" />
								</div>
								<div className="space-y-1 min-w-0">
									<h4 className="text-xl sm:text-2xl font-black text-foreground truncate">{property.name}</h4>
									<div className="flex flex-wrap items-center gap-2">
										<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md neumorphic-inset text-[10px] font-black text-muted-foreground uppercase tracking-wider">
											<Target className="size-3 text-primary" />
											{property.units.length} Units Active
										</span>
										<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
											<ShieldCheck className="size-3" />
											Verified
										</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<button 
									type="button"
									onClick={() => setViewingInventoryProperty(property)}
									className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 hover:border-primary/40 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-sm active:scale-95 cursor-pointer"
								>
									<Boxes className="size-3.5 text-primary shrink-0" />
									<span>View Inventory</span>
								</button>
							</div>
						</div>
					</div>

					{/* Utility Grid */}
 <div className={cn(
 "grid grid-cols-1 gap-8",
 !utilityType && "lg:grid-cols-2"
 )}>
 {(["water", "electricity"] as const)
 .filter(type => !utilityType || type === utilityType)
 .map(type => {
 const baseConfig = configs.find(c => c.property_id === property.id && c.utility_type === type && c.unit_id === null)!;
 const overrides = configs.filter(c => c.property_id === property.id && c.utility_type === type && c.unit_id !== null);
 const meta = utilityMeta[type];

 return (
 <div key={type} className="flex flex-col gap-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-2">
									<div className={cn("inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border text-xs sm:text-sm font-black uppercase tracking-wider w-fit", meta.tint, meta.bg, meta.border)}>
										<meta.icon className="size-4 shrink-0" />
										<span>{meta.label} Management</span>
									</div>
									<button
										type="button"
										onClick={() => addOverride(property.id, type)}
										className="group inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-all self-start sm:self-auto cursor-pointer"
									>
										<div className="size-7 sm:size-8 flex items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all shrink-0">
											<Plus className="size-3.5 sm:size-4" />
										</div>
										<span>Set Unit-Specific Rule</span>
									</button>
								</div>

								{/* Default Logic */}
								<div className="space-y-4">
									<UtilityConfigEditor
 config={baseConfig}
 units={property.units}
 isOverride={false}
 onChange={updateConfig}
 mounted={mounted}
 onHelp={() => {
 dispatch({
 type: 'SET_HELP',
 payload: {
 title: "Billing Strategy",
 content: (
 <div className="space-y-4">
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Included in Rent</p>
 <p>The utility cost is part of the rent. Tenants don&apos;t pay anything extra.</p>
 </div>
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Submetered (Landlord Managed)</p>
 <p>The property has one main bill that you pay. You use submeters to bill tenants for their specific usage through iReside.</p>
 </div>
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Direct to Provider</p>
 <p>Tenants have their own separate accounts and meters. They receive and pay their own bills directly to the utility company.</p>
 </div>
 </div>
 )
 }
 });
 }}
 />
 </div>

 {/* Overrides */}
 <div className="space-y-4 pt-6 border-t border-border mt-4 h-full flex flex-col">
 <div className="flex items-center gap-2 pl-4">
 <Target className={cn("size-4", overrides.length > 0 ? "text-amber-600" : "text-muted-foreground/30")} />
 <span className={cn("text-[10px] font-black uppercase tracking-widest", overrides.length > 0 ? "text-amber-600" : "text-muted-foreground/30")}>
 Unit Customizations
 </span>
 </div>

 {overrides.length > 0 ? (
 <div className="space-y-6">
 {overrides.map((ov) => (
 <UtilityConfigEditor
 key={ov.localId}
 config={ov}
 units={property.units}
 isOverride
 onChange={updateConfig}
 onRemove={() => removeConfig(ov.localId)}
 onHelp={() => {
 dispatch({
 type: 'SET_HELP',
 payload: {
 title: "Billing Strategy",
 content: (
 <div className="space-y-4">
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Included in Rent</p>
 <p>Utilities are covered by the rent payment.</p>
 </div>
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Submetered</p>
 <p>You bill tenants based on their submeter readings.</p>
 </div>
 <div className="p-4 rounded-2xl neumorphic-inset ">
 <p className="font-black text-foreground mb-1">Direct</p>
 <p>Tenants pay the utility company directly.</p>
 </div>
 </div>
 )
 }
 });
 }}
 />
 ))}
 </div>
 ) : (
 <div className="flex-1 min-h-[100px] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/50 neumorphic-inset opacity-40">
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No customizations active</p>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
					{embedded && (
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl neumorphic-panel mt-8">
							<div>
								<p className="text-sm font-black text-foreground">Save Utility Rate Rules</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{isPanelDirty
										? `${pendingChangesCount} unsaved ${pendingChangesCount === 1 ? "change" : "changes"} ready to apply.`
										: "All default rates and unit overrides are saved and up to date."}
								</p>
							</div>
							<div className="flex items-center gap-3">
								{isPanelDirty && (
									<>
										<button
											type="button"
											onClick={handleRequestDiscard}
											disabled={saving}
											className="px-4 py-2.5 rounded-xl border border-red-500/20 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
										>
											<RotateCcw className="size-3.5" />
											Discard
										</button>
										<button
											type="button"
											onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: true })}
											className="px-4 py-2.5 rounded-xl border border-border/60 hover:neumorphic-inset text-xs font-black text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center gap-1.5"
										>
											<Eye className="size-3.5" />
											Review Changes
										</button>
									</>
								)}
								<button
									type="button"
									onClick={handleRequestSave}
									disabled={saving || !isPanelDirty}
									className="inline-flex items-center gap-2 rounded-xl neumorphic-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
								>
									{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
									Save Changes
								</button>
							</div>
						</div>
					)}
 </section>
 )}
 </div>
 );
}

function Field({ 
 label, 
 children,
 onHelp
}: { 
 label: string; 
 children: ReactNode;
 onHelp?: () => void;
}) {
 return (
 <div className="block space-y-2 min-w-0">
 <div className="flex items-center gap-2 pl-1 whitespace-nowrap min-w-0">
 <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">{label}</span>
 {onHelp && (
 <button 
 type="button"
 onClick={onHelp}
 className="text-muted-foreground/40 hover:text-primary transition-colors"
 >
 <HelpCircle className="size-3" />
 </button>
 )}
 </div>
 {children}
 </div>
 );
}

function UtilityConfigEditor({
 config,
 units,
 isOverride,
 onChange,
 onRemove,
 onHelp,
 mounted
}: {
 config: UtilityConfigDraft;
 units: Array<{ id: string; name: string }>;
 isOverride: boolean;
 onChange: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
 onRemove?: () => void;
 onHelp?: () => void;
 mounted?: boolean;
}) {
 const Icon = config.utility_type === "water" ? Droplets : Zap;
 
 // Unified derived state
 const strategy = config.billing_mode === "included_in_rent" 
 ? "included" 
 : (config.responsibility_mode === "tenant_direct" ? "direct" : "submetered");

 const isSubmetered = strategy === "submetered";

 return (
 <div className={cn(
 "group rounded-3xl transition-all relative overflow-hidden",
 isOverride 
 ? "neumorphic-panel dark:border-amber-500/20 p-6" 
 : "neumorphic-panel p-8"
 )}>
 {/* Decorative Watermark */}
 <div className={cn(
 "absolute -bottom-6 -right-6 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]",
 config.utility_type === "water" ? "text-sky-500" : "text-amber-500"
 )}>
 <Icon className="size-28 rotate-12" />
 </div>

 <div className="relative z-10">
 <div className={cn(
 "mb-8 flex items-center justify-between",
 isOverride && "mb-6"
 )}>
 <div className="flex items-center gap-4">
 <div className={cn(
 "flex items-center justify-center rounded-2xl border transition-colors",
 isOverride 
 ? "size-10 bg-amber-500/10 text-amber-500 border-amber-500/20" 
 : "size-12 bg-primary/10 text-primary border-primary/20"
 )}>
 {isOverride ? <Target className="size-5" /> : <Globe className="size-6" />}
 </div>
 <div className="space-y-0.5">
 <span className={cn(
 "text-[10px] font-black uppercase tracking-[0.2em]",
 isOverride ? "text-amber-500" : "text-primary"
 )}>
 {isOverride ? "Unit Customization" : "Property Default"}
 </span>
 {!isOverride && (
 <p className="text-sm font-black text-foreground">
 Global settings for this building
 </p>
 )}
 </div>
 </div>

 {isOverride && (
 <div className="flex items-center gap-3">
 <select
 value={config.unit_id ?? ""}
 onChange={(e) => onChange(config.localId, { unit_id: e.target.value || null })}
 className="rounded-xl border border-amber-500/30 bg-card px-4 py-2 text-xs font-black text-amber-600 outline-none focus:ring-4 focus:ring-amber-500/10 "
 >
 <option value="">Select Unit...</option>
 {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
 </select>
 <button
 onClick={onRemove}
 className="size-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
 >
 <Trash2 className="size-4" />
 </button>
 </div>
 )}
 </div>

 <div className={cn("space-y-8", isOverride && "space-y-6")}>
 {/* Step 1: Logic Configuration */}
 <div className="space-y-6">
 {!isOverride && (
 <div className="relative flex items-center gap-4">
 <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">1. Select Logic</span>
 <div className="h-px flex-1 bg-border/40" />
 </div>
 )}
 
 <div className="space-y-6">
 <Field 
 label="Billing Strategy"
 onHelp={onHelp}
 >
 <div className="grid grid-cols-3 gap-1.5 rounded-2xl neumorphic-inset p-1 sm:p-1.5">
							<button 
								type="button"
								onClick={() => onChange(config.localId, { billing_mode: "included_in_rent", responsibility_mode: "landlord_bills" })}
								className={cn(
									"relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2.5 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider transition-all min-w-0 cursor-pointer",
									strategy === "included" 
										? "neumorphic-primary text-white" 
										: "text-muted-foreground hover:neumorphic-inset"
								)}
							>
								{strategy === "included" && <CheckCircle2 className="size-3 shrink-0" />}
								<span className="truncate">Included</span>
							</button>
							<button 
								type="button"
								onClick={() => onChange(config.localId, { billing_mode: "tenant_paid", responsibility_mode: "landlord_bills" })}
								className={cn(
									"relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2.5 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider transition-all min-w-0 cursor-pointer",
									strategy === "submetered" 
										? "neumorphic-primary text-white" 
										: "text-muted-foreground hover:neumorphic-inset"
								)}
							>
								{strategy === "submetered" && <CheckCircle2 className="size-3 shrink-0" />}
								<span className="truncate">Submetered</span>
							</button>
							<button 
								type="button"
								onClick={() => onChange(config.localId, { billing_mode: "tenant_paid", responsibility_mode: "tenant_direct" })}
								className={cn(
									"relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2.5 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider transition-all min-w-0 cursor-pointer",
									strategy === "direct" 
										? "neumorphic-primary text-white" 
										: "text-muted-foreground hover:neumorphic-inset"
								)}
							>
								{strategy === "direct" && <CheckCircle2 className="size-3 shrink-0" />}
								<span className="truncate">Direct</span>
							</button>
						</div>
					</Field>
 </div>
 </div>

 {/* Step 2: Rates & Billing */}
 <AnimatePresence mode="wait">
 {isSubmetered && (
 <motion.div 
 key="pricing"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 {!isOverride && (
 <div className="relative flex items-center gap-4">
 <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">2. Rates & Billing</span>
 <div className="h-px flex-1 bg-border/40" />
 </div>
 )}

 <div className={cn(
 "grid gap-6 sm:grid-cols-2 rounded-3xl neumorphic-panel dark:border-primary/10 dark:bg-primary/[0.02] relative overflow-hidden",
 isOverride ? "p-4 sm:p-6" : "p-4 sm:p-6 md:p-8"
 )}>
 <div className="absolute top-0 right-0 p-4 opacity-[0.03] grayscale">
 <DollarSign className="size-20" />
 </div>
 
 <Field label="Rate per Unit">
 <div className="relative group">
 <span className={cn(
 "absolute top-1/2 -translate-y-1/2 font-black text-primary/40 transition-colors group-focus-within:text-primary",
 isOverride ? "left-4 text-base" : "left-5 text-lg"
 )}>₱</span>
 <input 
 type="number" 
 step="0.01"
 min="0"
 max="99999"
 value={Number.isNaN(config.rate_per_unit) ? "" : config.rate_per_unit}
 onChange={(e) => {
 const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
 onChange(config.localId, { rate_per_unit: Number.isNaN(val) ? 0 : Math.max(0, val) });
 }}
 className={cn(
 "w-full rounded-2xl neumorphic-panel font-black tracking-tight text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5",
 isOverride ? "h-11 sm:h-12 pl-8 pr-4 text-base sm:text-lg" : "h-12 sm:h-14 md:h-16 pl-9 sm:pl-10 pr-4 text-xl sm:text-2xl",
 config.rate_per_unit <= 0 && "border-amber-500/50"
 )}
 />
 <div className={cn("absolute top-1/2 -translate-y-1/2 flex flex-col items-end", isOverride ? "right-4" : "right-5")}>
 <span className="text-[10px] font-black text-primary uppercase tracking-widest">{config.utility_type === "water" ? "m³" : "kWh"}</span>
 </div>
 </div>
 {config.rate_per_unit <= 0 && (
 <p className="mt-1 text-[11px] font-bold text-amber-500 flex items-center gap-1">
 <AlertCircle className="size-3 shrink-0" />
 Rate must be greater than ₱0.00
 </p>
 )}
 </Field>
 
 <Field label="Start Date">
 <div className="relative group">
 {/* Custom UI Trigger */}
 <div className={cn(
 "flex items-center gap-4 w-full rounded-2xl neumorphic-panel font-black text-foreground transition-all group-focus-within:border-primary group-focus-within:ring-4 group-focus-within:ring-primary/5",
 isOverride ? "h-11 sm:h-12 px-3 sm:px-4" : "h-12 sm:h-14 md:h-16 px-4 sm:px-5"
 )}>
 <Calendar className={cn(
 "text-muted-foreground/30 transition-colors group-focus-within:text-primary shrink-0",
 isOverride ? "size-4" : "size-5"
 )} />
 <span className={cn("flex-1 text-left", isOverride ? "text-xs" : "text-sm")}>
 <ClientOnlyDate date={config.effective_from} format={{ month: '2-digit', day: '2-digit', year: 'numeric' }} />
 </span>
 <div className="h-6 w-px bg-border/40 hidden md:block" />
 <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-primary/40 transition-all" />
 </div>

 {/* Hidden Native Picker */}
 <input 
 type="date"
 value={config.effective_from}
 onChange={(e) => onChange(config.localId, { effective_from: e.target.value })}
 className="absolute inset-0 opacity-0 cursor-pointer z-10"
 />
 </div>
 </Field>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Strategy Insight */}
 {!isOverride && (
 <div className={cn(
 "flex gap-5 p-6 rounded-3xl transition-colors",
 isSubmetered && config.rate_per_unit === 0 
 ? "neumorphic-inset dark:border-amber-500/20" 
 : "neumorphic-inset dark:border-border/50"
 )}>
 <div className={cn(
 "size-11 flex items-center justify-center rounded-xl shrink-0",
 isSubmetered && config.rate_per_unit === 0 ? "neumorphic-panel dark:border-amber-500/20" : "neumorphic-panel"
 )}>
 {isSubmetered && config.rate_per_unit === 0 ? (
 <Info className="size-5 text-amber-500" />
 ) : (
 <Info className="size-5 text-primary" />
 )}
 </div>
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Operational Strategy</p>
 {isSubmetered && config.rate_per_unit === 0 && (
 <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[8px] font-black uppercase text-amber-600 tracking-tighter">Action Required</span>
 )}
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed font-medium">
 {strategy === "included" && "Simplified strategy: This utility is fully subsidized within the base rent. No additional collections are processed."}
 {strategy === "submetered" && (
 config.rate_per_unit === 0 
 ? "Warning: You've selected Submetered Billing but set the rate to ₱0. No revenue will be recovered from tenants unless a rate is defined."
 : "Revenue Recovery: Landlord manages the primary utility account and recovers costs from tenants based on submeter consumption at the defined rate."
 )}
 {strategy === "direct" && "Zero-Liability: Tenants manage their own utility accounts and receive bills directly from the provider. iReside will not track or invoice these costs."}
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
