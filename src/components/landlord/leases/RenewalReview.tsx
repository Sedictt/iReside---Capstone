"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, CheckCircle2, X, Calendar, ArrowRight, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { toast } from "sonner";
import { useProperty } from "@/context/PropertyContext";
import RenewalSettingsModal from "./RenewalSettingsModal";
import { Settings2 } from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { FieldError } from "@/components/ui/field-error";
import { useFormValidation } from "@/hooks/useFormValidation";
import { dateRule, moneyRule, parseNumericInput, textRule } from "@/lib/validation/rules";
import { renewalTermDatesRule } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { formatLeaseDate, isOpenEnded, leaseEndState, termLengthMonths, type LeaseTermLike } from "@/lib/lease-term";

interface RenewalRequest {
 id: string;
 status: string;
 created_at: string;
 proposed_start_date: string;
 proposed_end_date: string;
 proposed_monthly_rent: number;
 proposed_security_deposit: number;
 current_lease: {
 id: string;
 start_date: string;
 /** Null for open-ended (month-to-month) leases. */
 end_date: string | null;
 term_type?: string | null;
 monthly_rent: number;
 security_deposit: number;
 unit: {
 name: string;
 beds: number;
 baths: number;
 property: {
 name: string;
 address: string;
 };
 };
 };
 tenant: {
 id: string;
 full_name: string;
 email: string;
 phone: string;
 };
}

interface LandlordRenewalReviewProps {
 searchQuery?: string;
 viewMode?: "list" | "grid";
}

export default function LandlordRenewalReview({ searchQuery, viewMode = "grid" }: LandlordRenewalReviewProps) {
 const searchParams = useSearchParams();
 const { t, language } = useLanguageContext();

 /** Localized short term label ("Open-ended", "Ends Mar 15, 2027", ...). */
 const leaseTermLabel = (lease: LeaseTermLike) => {
 const state = leaseEndState(lease);
 switch (state.kind) {
 case "open_ended":
 return t("Open-ended");
 case "moving_out":
 return t("Moving out {date}", { date: formatLeaseDate(state.endDate, undefined, language) });
 case "fixed":
 return t("Ends {date}", { date: formatLeaseDate(state.endDate, undefined, language) });
 case "ended":
 return t("Ended {date}", { date: formatLeaseDate(state.endDate, undefined, language) });
 }
 };
 const isPreview = searchParams.get("preview_requests") === "true";

 const { selectedPropertyId } = useProperty();
 const [requests, setRequests] = useState<RenewalRequest[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null);
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [rejectNotes, setRejectNotes] = useState("");
 
 // Form state for editing terms
 const [proposedStartDate, setProposedStartDate] = useState("");
 const [proposedEndDate, setProposedEndDate] = useState("");
 const [proposedRent, setProposedRent] = useState("");
 const [proposedDeposit, setProposedDeposit] = useState("");

 const formatWithCommas = (val: string) => {
 const num = val.replace(/[^0-9.]/g, '');
 const parts = num.split('.');
 parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 return parts.join('.');
 };

 const handleMoneyInput = (val: string, setter: (v: string) => void) => {
 setter(formatWithCommas(val));
 };

 const parseMoney = (val: string) => {
 // Inline validation blocks malformed amounts, so this never silently becomes 0.
 return parseNumericInput(val) as number;
 };

 /** Whole months of a proposed term, or an em dash when a date is missing. */
 const proposedTermMonths = (request: RenewalRequest) => {
 const months = termLengthMonths(request.proposed_start_date, request.proposed_end_date);
 return months === null ? "—" : t("{count} Months", { count: months });
 };

 const selectedIsOpenEnded = selectedRequest ? isOpenEnded(selectedRequest.current_lease) : false;

 // Same rules as POST /api/landlord/renewals/[id] (approve).
 const renewalForm = useFormValidation(
 {
 proposedStartDate,
 proposedEndDate,
 proposedRent,
 proposedDeposit,
 rejectNotes,
 currentEndDate: selectedRequest?.current_lease?.end_date ?? "",
 },
 {
 proposedStartDate: (value, all) =>
 dateRule(value, { label: t("New start date") }) ??
 (renewalTermDatesRule(value, all.proposedEndDate, all.currentEndDate)?.field === "proposed_start_date"
 ? renewalTermDatesRule(value, all.proposedEndDate, all.currentEndDate)?.message
 : undefined),
 proposedEndDate: (value, all) =>
 dateRule(value, { label: t("New end date") }) ??
 (renewalTermDatesRule(all.proposedStartDate, value, all.currentEndDate)?.field === "proposed_end_date"
 ? renewalTermDatesRule(all.proposedStartDate, value, all.currentEndDate)?.message
 : undefined),
 proposedRent: (value) => moneyRule(value, { label: t("Monthly rent"), positive: true }),
 proposedDeposit: (value) => moneyRule(value, { label: t("Security deposit") }),
 rejectNotes: (value) => textRule(value, { label: t("Notes"), max: 250 }),
 }
 );

 useEffect(() => {
 fetchRequests();
 }, [selectedPropertyId]);

 const fetchRequests = async () => {
 if (isPreview) {
 setRequests([
 {
 id: "mock-1",
 status: "pending",
 created_at: new Date().toISOString(),
 proposed_start_date: "2027-01-01",
 proposed_end_date: "2027-12-31",
 proposed_monthly_rent: 15500,
 proposed_security_deposit: 15500,
 current_lease: {
 id: "current-1",
 start_date: "2026-01-01",
 end_date: "2026-12-31",
 monthly_rent: 15000,
 security_deposit: 15000,
 unit: {
 name: "Unit 402",
 beds: 2,
 baths: 2,
 property: {
 name: "Skyline Apartments",
 address: "456 Urban Ave, Metro City"
 }
 }
 },
 tenant: {
 id: "tenant-1",
 full_name: "Alexander Thompson",
 email: "alex.t@example.com",
 phone: "+1 (555) 012-3456"
 }
 },
 {
 id: "mock-2",
 status: "pending",
 created_at: new Date(Date.now() - 86400000).toISOString(),
 proposed_start_date: "2026-09-15",
 proposed_end_date: "2027-09-14",
 proposed_monthly_rent: 8750,
 proposed_security_deposit: 8750,
 current_lease: {
 id: "current-2",
 start_date: "2025-09-15",
 end_date: "2026-09-14",
 monthly_rent: 8500,
 security_deposit: 8500,
 unit: {
 name: "Studio 101",
 beds: 1,
 baths: 1,
 property: {
 name: "Green Gardens",
 address: "123 Nature Dr, Suburbia"
 }
 }
 },
 tenant: {
 id: "tenant-2",
 full_name: "Sarah Jenkins",
 email: "s.jenkins@example.com",
 phone: "+1 (555) 987-6543"
 }
 }
 ]);
 setLoading(false);
 return;
 }

 try {
 const params = new URLSearchParams({ 
 status: "pending",
 propertyId: selectedPropertyId 
 });
 const res = await fetch(`/api/landlord/renewals?${params.toString()}`);
 const renewalResponse = await res.json();
 if (res.ok) {
 setRequests(renewalResponse);
 }
 } catch (error) {
 console.error("Failed to fetch renewal requests:", error);
 } finally {
 setLoading(false);
 }
 };

 const handleApprove = async () => {
 if (!selectedRequest || submitting) return;
 if (!renewalForm.validateAll()) return;
 setSubmitting(true);
 try {
 const res = await fetch(`/api/landlord/renewals/${selectedRequest.id}`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 action: "approve",
 ...(proposedStartDate && { proposed_start_date: proposedStartDate }),
 ...(proposedEndDate && { proposed_end_date: proposedEndDate }),
 ...(proposedRent && { proposed_monthly_rent: parseMoney(proposedRent) }),
 ...(proposedDeposit && { proposed_security_deposit: parseMoney(proposedDeposit) }),
 })
 });
 const approveResponse = await res.json().catch(() => ({}));
 if (!res.ok) {
 const fe = approveResponse.fieldErrors ?? {};
 const mapped: Record<string, string> = {};
 if (fe.proposed_start_date) mapped.proposedStartDate = fe.proposed_start_date;
 if (fe.proposed_end_date) mapped.proposedEndDate = fe.proposed_end_date;
 if (fe.proposed_monthly_rent) mapped.proposedRent = fe.proposed_monthly_rent;
 if (fe.proposed_security_deposit) mapped.proposedDeposit = fe.proposed_security_deposit;
 renewalForm.setServerErrors(mapped);
 toast.error(t("Failed to approve"), { description: approveResponse.error });
 return;
 }
 toast.success(t("Renewal approved"), {
 description: t("New lease created. Tenant will be notified.")
 });
 setSelectedRequest(null);
 fetchRequests();
 } catch (error) {
 toast.error(t("Failed to approve request"));
 } finally {
 setSubmitting(false);
 }
 };

 const handleReject = async () => {
 if (!selectedRequest || submitting) return;
 if (renewalForm.errors.rejectNotes) {
 renewalForm.touch("rejectNotes");
 return;
 }
 setSubmitting(true);
 try {
 const res = await fetch(`/api/landlord/renewals/${selectedRequest.id}`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 action: "reject",
 landlord_notes: rejectNotes.trim()
 })
 });
 const rejectResponse = await res.json();
 if (!res.ok) {
 toast.error(t("Failed to reject"), { description: rejectResponse.error });
 return;
 }
 toast.success(t("Renewal rejected"), {
 description: t("Tenant will be notified.")
 });
 setSelectedRequest(null);
 setRejectNotes("");
 fetchRequests();
 } catch (error) {
 toast.error(t("Failed to reject request"));
 } finally {
 setSubmitting(false);
 }
 };

 const openReview = (request: RenewalRequest) => {
 renewalForm.reset();
 setSelectedRequest(request);
 setProposedStartDate(request.proposed_start_date || "");
 setProposedEndDate(request.proposed_end_date || "");
 setProposedRent(formatWithCommas(request.proposed_monthly_rent?.toString() || ""));
 setProposedDeposit(formatWithCommas(request.proposed_security_deposit?.toString() || ""));
 };

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center p-12 space-y-4">
 <div className="p-4 rounded-3xl bg-primary/5">
 <RefreshCw className="size-8 animate-spin text-primary" />
 </div>
 <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
 {t("Loading Requests...")}
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-8">
 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-4">
 <h3 className="text-xl font-black text-foreground tracking-tight">{t("Pending Renewals")}</h3>
 {isPreview && (
 <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
 {t("Preview Mode")}
 </span>
 )}
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={() => setIsSettingsOpen(true)}
 disabled={!selectedPropertyId || selectedPropertyId === "all"}
 className="flex items-center gap-2 px-4 py-2 rounded-full neumorphic-panel text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:neumorphic-inset hover:text-foreground transition-all disabled:opacity-30"
 title={(!selectedPropertyId || selectedPropertyId === "all") ? t("Select a property to configure its renewal policy") : t("Configure Renewal Policy")}
 >
 <Settings2 className="size-3.5" />
 {t("Renewal Policy")}
 </button>
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full neumorphic-inset ">
 <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
 {t("{count} Pending", { count: requests.length })}
 </span>
 </div>
 </div>
 </div>

 {requests.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[2.5rem] neumorphic-inset">
 <div className="p-4 rounded-full neumorphic-inset mb-4">
 <CheckCircle2 className="size-8 text-muted-foreground/30" />
 </div>
 <p className="font-black text-foreground">{t("All Caught Up")}</p>
 <p className="text-sm text-muted-foreground">{t("No new renewal requests to process at this time.")}</p>
 </div>
 ) : viewMode === "list" ? (
 <div className="flex flex-col gap-3">
 {requests.map((request) => (
 <div
 key={request.id}
 className="group relative flex flex-col md:flex-row md:items-center justify-between neumorphic-panel rounded-2xl overflow-hidden hover:border-primary/40 hover:neumorphic-inset transition-all duration-200 p-4 sm:p-5 gap-4"
 >
 {/* Left: Tenant & Unit */}
 <div className="flex items-center gap-3.5 min-w-[220px]">
 <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base shrink-0">
 {request.tenant.full_name.charAt(0)}
 </div>
 <div className="min-w-0 flex-1">
 <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
 {request.tenant.full_name}
 </h4>
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
 {request.current_lease.unit.property.name} • {t("Unit {name}", { name: request.current_lease.unit.name })}
 </p>
 </div>
 </div>

 {/* Middle: Expiry & Duration */}
 <div className="flex items-center gap-6 min-w-[200px]">
 <div>
 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("Current Term")}</p>
 <p className="text-xs font-black text-foreground">
 {leaseTermLabel(request.current_lease)}
 </p>
 </div>
 <div>
 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("Proposed Term")}</p>
 <p className="text-xs font-black text-foreground">
 {proposedTermMonths(request)}
 </p>
 </div>
 </div>

 {/* Financials */}
 <div className="min-w-[140px] text-left md:text-right">
 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("Proposed Rent")}</p>
 <p className="font-mono text-base font-black tracking-tight text-foreground tabular-nums">
 PHP {request.proposed_monthly_rent?.toLocaleString()}
 </p>
 </div>

 {/* Status & Action */}
 <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
 <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
 {t("Pending Review")}
 </span>
 <button
 onClick={() => openReview(request)}
 className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-black uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <FileText className="size-3.5" />
 <span>{t("Review")}</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 {requests.map((request) => (
 <div key={request.id} className="group relative neumorphic-panel rounded-[2.5rem] p-8 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-black/5">
 <div className="flex justify-between items-start mb-8">
 <div className="flex items-center gap-4">
 <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
 {request.tenant.full_name.charAt(0)}
 </div>
 <div>
 <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{request.tenant.full_name}</h4>
 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
 {request.current_lease.unit.property.name} • {t("Unit {name}", { name: request.current_lease.unit.name })}
 </p>
 </div>
 </div>
 <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
 {t("Pending Review")}
 </span>
 </div>
 
 <div className="grid grid-cols-2 gap-6 mb-8">
 <div className="space-y-1">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{t("Current Term")}</p>
 <p className="font-black text-foreground">{leaseTermLabel(request.current_lease)}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{t("Proposed Length")}</p>
 <p className="font-black text-foreground">
 {proposedTermMonths(request)}
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{t("Proposed Rent")}</p>
 <p className="font-black text-foreground">PHP {request.proposed_monthly_rent?.toLocaleString()}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{t("Submitted On")}</p>
 <p className="font-black text-foreground"><ClientOnlyDate date={request.created_at} /></p>
 </div>
 </div>

 <button
 onClick={() => openReview(request)}
 className="w-full py-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <FileText className="size-4" />
 {t("Review Request")}
 </button>
 </div>
 ))}
 </div>
 )}

 {/* Review Modal */}
 {selectedRequest && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
 <div className="relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
 <div className="p-8 border-b border-white/5 flex justify-between items-center neumorphic-inset">
 <div className="flex items-center gap-4">
 <div className="p-3 rounded-2xl bg-primary/10 text-primary">
 <RefreshCw className="size-6" />
 </div>
 <div>
 <h3 className="text-xl font-black text-foreground tracking-tight">{t("Review Renewal Terms")}</h3>
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
 {t("Reviewing request for {name}", { name: selectedRequest.tenant.full_name })}
 </p>
 </div>
 </div>
 <button
 onClick={() => setSelectedRequest(null)}
 aria-label={t("Close")}
 className="p-3 rounded-xl hover:neumorphic-inset transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="p-8 overflow-y-auto space-y-8">
 <div className="grid grid-cols-2 gap-4">
 <div className="neumorphic-inset rounded-3xl p-6 /50">
 <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-4">{t("Current Lease")}</p>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-xs text-muted-foreground">{t("Term")}</span>
 <span className="text-sm font-black">{leaseTermLabel(selectedRequest.current_lease)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs text-muted-foreground">{t("Monthly Rent")}</span>
 <span className="text-sm font-black">PHP {selectedRequest.current_lease.monthly_rent?.toLocaleString()}</span>
 </div>
 </div>
 </div>
 <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20">
 <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-black mb-4">{t("Tenant Proposal")}</p>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-xs text-primary/70">{t("Target Start")}</span>
 <span className="text-sm font-black text-primary"><ClientOnlyDate date={selectedRequest.proposed_start_date} /></span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs text-primary/70">{t("Target Rent")}</span>
 <span className="text-sm font-black text-primary">PHP {selectedRequest.proposed_monthly_rent?.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>

 {selectedIsOpenEnded ? (
 <div className="flex items-start gap-3 rounded-3xl neumorphic-inset p-6">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
 <Calendar className="size-5" />
 </div>
 <div className="space-y-1">
 <p className="text-sm font-black text-foreground">{t("This lease is open-ended and doesn't need renewal.")}</p>
 <p className="text-xs text-muted-foreground">
 {t("The tenancy continues month-to-month for as long as rent is paid. If the tenant wants a dated term instead, set a fixed end date from the lease card.")}
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">{t("Finalize New Terms")}</h4>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label htmlFor="new-start-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("New Start Date")}</label>
 <input min="1990-01-01" max="2100-12-31"
 {...renewalForm.fieldProps("proposedStartDate")}
 id="new-start-date"
 type="date"
 value={proposedStartDate}
 onChange={(e) => setProposedStartDate(e.target.value)}
 className={cn("w-full p-4 rounded-2xl neumorphic-panel text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all", renewalForm.errorFor("proposedStartDate") && "ring-1 ring-rose-500/60")}
 />
 <FieldError id={renewalForm.errorId("proposedStartDate")} message={renewalForm.errorFor("proposedStartDate")} />
 </div>
 <div className="space-y-2">
 <label htmlFor="new-end-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("New End Date")}</label>
 <input min="1990-01-01" max="2100-12-31"
 {...renewalForm.fieldProps("proposedEndDate")}
 id="new-end-date"
 type="date"
 value={proposedEndDate}
 onChange={(e) => setProposedEndDate(e.target.value)}
 className={cn("w-full p-4 rounded-2xl neumorphic-panel text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all", renewalForm.errorFor("proposedEndDate") && "ring-1 ring-rose-500/60")}
 />
 <FieldError id={renewalForm.errorId("proposedEndDate")} message={renewalForm.errorFor("proposedEndDate")} />
 </div>
 <div className="space-y-2">
 <label htmlFor="monthly-rent" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("Monthly Rent (PHP)")}</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">₱</span>
 <input maxLength={14}
 {...renewalForm.fieldProps("proposedRent")}
 id="monthly-rent"
 type="text"
 inputMode="decimal"
 value={proposedRent}
 onChange={(e) => handleMoneyInput(e.target.value, setProposedRent)}
 className={cn("w-full p-4 pl-8 rounded-2xl neumorphic-panel text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all", renewalForm.errorFor("proposedRent") && "ring-1 ring-rose-500/60")}
 />
 </div>
 <FieldError id={renewalForm.errorId("proposedRent")} message={renewalForm.errorFor("proposedRent")} />
 </div>
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label htmlFor="security-deposit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("Security Deposit (PHP)")}</label>
 <button 
 onClick={() => setProposedDeposit(formatWithCommas(selectedRequest.current_lease.security_deposit?.toString() || "0"))}
 className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
 >
 {t("Use Current Balance")}
 </button>
 </div>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">₱</span>
 <input maxLength={14}
 {...renewalForm.fieldProps("proposedDeposit")}
 id="security-deposit"
 type="text"
 inputMode="decimal"
 value={proposedDeposit}
 onChange={(e) => handleMoneyInput(e.target.value, setProposedDeposit)}
 className={cn("w-full p-4 pl-8 rounded-2xl neumorphic-panel text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all", renewalForm.errorFor("proposedDeposit") && "ring-1 ring-rose-500/60")}
 />
 </div>
 <FieldError id={renewalForm.errorId("proposedDeposit")} message={renewalForm.errorFor("proposedDeposit")} />
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neumorphic-inset /50">
 <span className="text-[9px] font-black text-muted-foreground uppercase">{t("Current Held:")}</span>
 <span className="text-[9px] font-black text-foreground">PHP {selectedRequest.current_lease.security_deposit?.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 )}

 <div className="space-y-2">
 <label htmlFor="landlord-notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{t("Landlord Notes (Optional)")}</label>
 <textarea maxLength={250}
 {...renewalForm.fieldProps("rejectNotes")}
 id="landlord-notes"
 value={rejectNotes}
 onChange={(e) => setRejectNotes(e.target.value)}
 placeholder={t("Explain your decision or adjustments...")}
 className="w-full p-4 rounded-2xl neumorphic-panel text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
 />
 </div>
 </div>

 <div className="p-6 border-t border-border neumorphic-inset flex gap-4">
 <button
 onClick={handleReject}
 disabled={submitting}
 className="px-6 py-4 rounded-2xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs transition-all flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
 >
 <AlertTriangle className="size-4" />
 {t("Reject Request")}
 </button>
 {!selectedIsOpenEnded && (
 <button
 onClick={handleApprove}
 disabled={submitting}
 className="px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all flex flex-[1.5] items-center justify-center gap-2 shadow-primary/20 disabled:opacity-50"
 >
 {submitting ? t("Creating Lease...") : t("Approve & Generate Lease")}
 <CheckCircle2 className="size-4" />
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 {/* Settings Modal */}
 {selectedPropertyId && selectedPropertyId !== "all" && (
 <RenewalSettingsModal
 propertyId={selectedPropertyId}
 propertyName={t("Active Property")} // You could fetch the real name if needed
 isOpen={isSettingsOpen}
 onClose={() => setIsSettingsOpen(false)}
 />
 )}
 </div>
 );
}

