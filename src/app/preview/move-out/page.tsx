"use client";

import { useState } from "react";
import { MoveOutRequestsList } from "@/components/landlord/move-out/MoveOutRequestsList";
import { MoveOutRequestDetails } from "@/components/landlord/move-out/MoveOutRequestDetails";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";
import { MoveOutStatusBadge } from "@/components/landlord/move-out/MoveOutStatusBadge";
import { MoveOutStatus } from "@/types/database";

const MOCK_REQUESTS = [
  {
    id: "req-1",
    status: "pending" as MoveOutStatus,
    requested_date: "2026-06-01",
    reason: "Relocating for a new job in the city.",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    denial_reason: null,
    denied_at: null,
    approved_at: null,
    inspection_date: null,
    inspection_notes: null,
    deposit_deductions: null,
    deposit_refund_amount: null,
    checklist_data: null,
    completed_at: null,
    lease: {
      id: "lease-1",
      start_date: "2025-06-01",
      end_date: "2026-06-01",
      monthly_rent: 25000,
      security_deposit: 50000,
      unit: {
        name: "Unit 402",
        property: {
          id: "prop-1",
          name: "Emerald Heights",
          address: "123 Skyline Ave, Metro Manila",
        },
      },
      tenant: {
        id: "tenant-1",
        full_name: "John Doe",
        email: "john.doe@example.com",
        phone: "+63 912 345 6789",
      },
    },
  },
  {
    id: "req-2",
    status: "approved" as MoveOutStatus,
    requested_date: "2026-05-20",
    reason: "Buying a new house.",
    notes: null,
    created_at: "2026-04-15T09:00:00Z",
    denial_reason: null,
    denied_at: null,
    approved_at: "2026-04-16T14:30:00Z",
    inspection_date: null,
    inspection_notes: null,
    deposit_deductions: null,
    deposit_refund_amount: null,
    checklist_data: { items: [{ id: "keys", label: "Return keys", completed: false }] },
    completed_at: null,
    lease: {
      id: "lease-2",
      start_date: "2024-05-20",
      end_date: "2026-05-20",
      monthly_rent: 18000,
      security_deposit: 36000,
      unit: {
        name: "Studio 12B",
        property: {
          id: "prop-2",
          name: "The Grand Atrium",
          address: "456 Central Blvd, Quezon City",
        },
      },
      tenant: {
        id: "tenant-2",
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+63 987 654 3210",
      },
    },
  },
  {
    id: "req-3",
    status: "completed" as MoveOutStatus,
    requested_date: "2026-04-30",
    reason: "Moving to another country.",
    notes: "Unit left in excellent condition.",
    created_at: "2026-03-01T08:00:00Z",
    denial_reason: null,
    denied_at: null,
    approved_at: "2026-03-05T11:00:00Z",
    inspection_date: "2026-04-30T10:00:00Z",
    inspection_notes: "Minor wear on walls, but otherwise perfect.",
    deposit_deductions: [{ description: "Wall cleaning", amount: 1500 }],
    deposit_refund_amount: 32000,
    checklist_data: { items: [{ id: "keys", label: "Return keys", completed: true }] },
    completed_at: "2026-04-30T16:00:00Z",
    lease: {
      id: "lease-3",
      start_date: "2023-05-01",
      end_date: "2026-04-30",
      monthly_rent: 20000,
      security_deposit: 40000,
      unit: {
        name: "Suite 901",
        property: {
          id: "prop-1",
          name: "Emerald Heights",
          address: "123 Skyline Ave, Metro Manila",
        },
      },
      tenant: {
        id: "tenant-3",
        full_name: "Alice Johnson",
        email: "alice.j@example.com",
        phone: null,
      },
    },
  },
];

export default function MoveOutPreviewPage() {
  const [view, setView] = useState<"landlord" | "tenant">("landlord");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background p-10">
      <div className="mx-auto max-w-7xl">
        {/* Toggle View */}
        <div className="mb-12 flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-foreground">Move-Out Workflow Preview</h1>
          <div className="flex rounded-2xl bg-muted p-1">
            <button
              onClick={() => { setView("landlord"); setSelectedRequest(null); }}
              className={`rounded-xl px-6 py-2 text-xs font-semibold uppercase tracking-widest transition-all ${
                view === "landlord" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Landlord View
            </button>
            <button
              onClick={() => { setView("tenant"); setSelectedRequest(null); }}
              className={`rounded-xl px-6 py-2 text-xs font-semibold uppercase tracking-widest transition-all ${
                view === "tenant" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tenant View
            </button>
          </div>
        </div>

        {view === "landlord" ? (
          <div className="space-y-12">
            {!selectedRequest ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">1. Request List</h2>
                  <span className="text-xs font-medium text-muted-foreground italic">(Mock Data)</span>
                </div>
                <div className="grid gap-4">
                  {MOCK_REQUESTS.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRequest(req); }}}
                      tabIndex={0}
                      role="button"
                      className="group flex cursor-pointer items-center justify-between rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-xl"
                    >
                      <div className="flex items-center gap-6">
                        <MoveOutStatusBadge status={req.status} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{req.lease.tenant.full_name}</p>
                          <p className="text-xs font-medium text-muted-foreground">{req.lease.unit.name} • {req.lease.unit.property.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Requested Date</p>
                        <p className="text-sm font-semibold text-foreground">{req.requested_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">2. Request Details</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
                  >
                    Back to List
                  </button>
                </div>
                <MoveOutRequestDetails
                  request={selectedRequest}
                  onBack={() => setSelectedRequest(null)}
                  onUpdate={() => {}}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">1. Submission Flow</h2>
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Hub Variant (No Request)</h3>
                  <MoveOutRequest variant="hub" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quick Action Trigger</h3>
                  <div className="flex h-full items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-muted/20">
                    <MoveOutRequest variant="quickAction" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">2. Active Request States</h2>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Pending Review</h3>
                  <MoveOutRequest variant="sidebar" initialRequest={{
                    ...MOCK_REQUESTS[0],
                    checklist_data: null,
                  }} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-blue-500">Approved (Checklist Active)</h3>
                  <MoveOutRequest variant="sidebar" initialRequest={{
                    ...MOCK_REQUESTS[1],
                    checklist_data: { items: [{ id: "keys", label: "Return keys", completed: false }] },
                  }} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Completed</h3>
                  <MoveOutRequest variant="sidebar" initialRequest={MOCK_REQUESTS[2]} />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">3. Edge Cases</h2>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-red-500">Denied</h3>
                  <MoveOutRequest variant="sidebar" initialRequest={{
                    ...MOCK_REQUESTS[0],
                    status: "denied",
                    denied_at: "2026-05-02T10:00:00Z",
                    denial_reason: "Minimum stay of 12 months not yet reached."
                  }} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Inspection Done</h3>
                  <MoveOutRequest variant="sidebar" initialRequest={{
                    ...MOCK_REQUESTS[1],
                    inspection_date: "2026-05-18T10:00:00Z",
                    deposit_deductions: [{ description: "Wall cleaning", amount: 1500 }],
                    deposit_refund_amount: 34500
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
