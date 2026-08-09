/**
 * Lease Status Transition Validation — Facade
 *
 * Logic has moved to the lease service module's status machine.
 * This file re-exports the same API so existing importers and tests
 * continue to work unchanged.
 */
export * from "@/lib/services/lease/lease-status-machine";