"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Bell,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Building,
  Calendar,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RecipientPreviewTable } from "./RecipientPreviewTable";
import {
  type AudienceFilterType,
  type ActiveLeaseSummary,
  type LandlordPropertySummary,
  filterAudience,
} from "@/lib/services/iris/iris-operations.service";
import type { IrisTemplateKey } from "@/lib/services/iris/iris-templates";

export interface IrisBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: AudienceFilterType;
  initialPropertyId?: string;
  onSuccess?: (result: {
    success: boolean;
    count: number;
    recipients: unknown[];
    channelsDelivered: string[];
  }) => void;
}

const FILTER_OPTIONS: { id: AudienceFilterType; label: string; defaultTemplate: IrisTemplateKey }[] = [
  { id: "overdue_5d", label: "Unpaid Rent (Overdue 5+ Days)", defaultTemplate: "payment_overdue" },
  { id: "due_soon", label: "Rent Due Soon (Next 5 Days)", defaultTemplate: "payment_gentle" },
  { id: "expiring_leases_60d", label: "Leases Expiring Soon (Next 60 Days)", defaultTemplate: "lease_renewal" },
  { id: "all_active_tenants", label: "All Current Residents", defaultTemplate: "general_notice" },
];

const TEMPLATE_OPTIONS: { id: IrisTemplateKey; label: string; description: string }[] = [
  { id: "payment_gentle", label: "Gentle Rent Reminder", description: "Polite reminder of upcoming rent settlement." },
  { id: "payment_overdue", label: "Urgent Overdue Notice", description: "Official notification of overdue rent balance." },
  { id: "lease_renewal", label: "Lease Renewal Invitation", description: "Inquire if resident intends to renew upcoming lease term." },
  { id: "maintenance_advisory", label: "Maintenance Advisory", description: "Notice regarding scheduled building or unit maintenance." },
  { id: "general_notice", label: "General Announcement", description: "General community notice to residents." },
];

export function IrisBroadcastModal({
  isOpen,
  onClose,
  initialFilter = "overdue_5d",
  initialPropertyId,
  onSuccess,
}: IrisBroadcastModalProps) {
  const [filterType, setFilterType] = useState<AudienceFilterType>(initialFilter);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId ?? "");
  const [templateKey, setTemplateKey] = useState<IrisTemplateKey>("payment_overdue");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [maintenanceDate, setMaintenanceDate] = useState<string>("");

  const [inAppNotification, setInAppNotification] = useState<boolean>(true);
  const [directMessage, setDirectMessage] = useState<boolean>(true);

  const [properties, setProperties] = useState<LandlordPropertySummary[]>([]);
  const [allLeases, setAllLeases] = useState<ActiveLeaseSummary[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(false);
  const [selectedLeaseIds, setSelectedLeaseIds] = useState<Set<string>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Sync initial props
  useEffect(() => {
    if (isOpen) {
      setFilterType(initialFilter);
      setSelectedPropertyId(initialPropertyId ?? "");
      const defaultTpl =
        FILTER_OPTIONS.find((f) => f.id === initialFilter)?.defaultTemplate ?? "payment_overdue";
      setTemplateKey(defaultTpl);
      setErrorMessage(null);
      setFeedbackSuccess(null);
    }
  }, [isOpen, initialFilter, initialPropertyId]);

  // Load operational context
  const loadContext = useCallback(async () => {
    setIsLoadingContext(true);
    setErrorMessage(null);
    try {
      const url = selectedPropertyId
        ? `/api/landlord/iris/context?propertyId=${encodeURIComponent(selectedPropertyId)}`
        : `/api/landlord/iris/context`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load operational context (${res.status})`);
      }
      const json = await res.json();
      if (json.data) {
        setProperties(json.data.properties ?? []);
        setAllLeases(json.data.activeLeases ?? []);
      }
    } catch (err) {
      console.error("Context fetch error:", err);
      setErrorMessage("Could not load resident list. Please try again.");
    } finally {
      setIsLoadingContext(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (isOpen) {
      void loadContext();
    }
  }, [isOpen, loadContext]);

  // Filter audience dynamically
  const filteredRecipients = useMemo(() => {
    return filterAudience(allLeases, filterType, {
      propertyId: selectedPropertyId || undefined,
    });
  }, [allLeases, filterType, selectedPropertyId]);

  // When filteredRecipients change, default to selecting all
  useEffect(() => {
    setSelectedLeaseIds(new Set(filteredRecipients.map((r) => r.id)));
  }, [filteredRecipients]);

  const handleFilterChange = (newFilter: AudienceFilterType) => {
    setFilterType(newFilter);
    const target = FILTER_OPTIONS.find((f) => f.id === newFilter);
    if (target) {
      setTemplateKey(target.defaultTemplate);
    }
  };

  const handleToggleSelect = (leaseId: string) => {
    setSelectedLeaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(leaseId)) {
        next.delete(leaseId);
      } else {
        next.add(leaseId);
      }
      return next;
    });
  };

  const handleToggleAll = (select: boolean) => {
    if (select) {
      setSelectedLeaseIds(new Set(filteredRecipients.map((r) => r.id)));
    } else {
      setSelectedLeaseIds(new Set());
    }
  };

  const selectedCount = selectedLeaseIds.size;
  const atLeastOneChannelSelected = inAppNotification || directMessage;
  const canSend = selectedCount > 0 && atLeastOneChannelSelected && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedbackSuccess(null);

    try {
      const payload = {
        filterType,
        propertyId: selectedPropertyId || undefined,
        templateKey,
        customMessage: customMessage.trim() || undefined,
        maintenanceDate: maintenanceDate || undefined,
        selectedLeaseIds: Array.from(selectedLeaseIds),
        channels: {
          inAppNotification,
          directMessage,
        },
      };

      const res = await fetch("/api/landlord/iris/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to send broadcast (${res.status})`);
      }

      setFeedbackSuccess(`Successfully sent to ${json.count} resident${json.count === 1 ? "" : "s"}!`);
      onSuccess?.(json);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send messages");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "neumorphic-panel bg-background border border-border/80 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in duration-200",
          "rounded-t-3xl sm:rounded-3xl"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between gap-4 bg-card/60">
          <div>
            <h2 id="broadcast-modal-title" className="text-lg font-bold text-foreground">
              Send Reminders & Announcements
            </h2>
            <p className="text-xs text-muted-foreground">
              Select audience, customize your message, and dispatch via notifications or chat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {feedbackSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Target Audience Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Target Audience Filter
              </label>

              {properties.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    aria-label="Filter by property"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Properties</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FILTER_OPTIONS.map((f) => {
                const isSelected = filterType === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFilterChange(f.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col gap-1",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40 font-semibold"
                        : "border-border/70 hover:border-border hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Template Selector */}
          <div className="space-y-2">
            <label
              htmlFor="template-selector"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Notice Template
            </label>
            <select
              id="template-selector"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value as IrisTemplateKey)}
              className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary shadow-2xs"
            >
              {TEMPLATE_OPTIONS.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.label} — {tpl.description}
                </option>
              ))}
            </select>
          </div>

          {/* Section 3: Conditional Parameter Inputs */}
          {templateKey === "maintenance_advisory" && (
            <div className="space-y-2">
              <label
                htmlFor="maintenance-date-input"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Scheduled Maintenance Date
              </label>
              <input
                id="maintenance-date-input"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full sm:w-60 text-sm rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>
          )}

          {(templateKey === "general_notice" || templateKey === "maintenance_advisory") && (
            <div className="space-y-2">
              <label
                htmlFor="custom-message-input"
                className="text-xs font-semibold text-foreground"
              >
                Custom Notice Details (Max 500 characters)
              </label>
              <Textarea
                id="custom-message-input"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={
                  templateKey === "maintenance_advisory"
                    ? "e.g. Water supply will be temporarily shut off between 1:00 PM and 4:00 PM for pipeline replacement."
                    : "e.g. Please note garbage collection will happen early tomorrow morning."
                }
                showCount={true}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Section 4: Audience Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Audience Preview ({filteredRecipients.length} matching)
              </label>
              <span className="text-xs text-muted-foreground">
                Uncheck any resident you wish to exclude
              </span>
            </div>

            <RecipientPreviewTable
              recipients={filteredRecipients}
              selectedLeaseIds={selectedLeaseIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              templateKey={templateKey}
              customMessage={customMessage}
              maintenanceDate={maintenanceDate}
              isLoading={isLoadingContext}
            />
          </div>

          {/* Section 5: Delivery Channels */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Delivery Channels
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/30 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inAppNotification}
                  onChange={(e) => setInAppNotification(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">In-App Notification</div>
                  <div className="text-muted-foreground">Alerts resident inside iReside</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/30 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={directMessage}
                  onChange={(e) => setDirectMessage(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Direct Chat Message</div>
                  <div className="text-muted-foreground">Official notice sent in tenant DM</div>
                </div>
              </label>
            </div>

            {!atLeastOneChannelSelected && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Please select at least one delivery channel.
              </p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/60 bg-card/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {selectedCount === 0
                    ? "Select Residents"
                    : `Send to ${selectedCount} Resident${selectedCount === 1 ? "" : "s"}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
