import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeaseOfflineSigner } from "@/lib/offline/leaseOfflineSigner";
import { mutationQueue } from "@/lib/offline/mutationQueue";

describe("LeaseOfflineSigner", () => {
  beforeEach(() => {
    localStorage.clear();
    mutationQueue.clear();
  });

  it("stages offline landlord signature envelope correctly", async () => {
    const mockSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const envelope = await LeaseOfflineSigner.stageOfflineSignature({
      leaseId: "lease_test_99",
      signerRole: "landlord",
      signerName: "Juan Landlord",
      signatureDataUrl: mockSig,
      lockVersion: 2,
    });

    expect(envelope.leaseId).toBe("lease_test_99");
    expect(envelope.signerRole).toBe("landlord");
    expect(envelope.envelopeHash).toBeDefined();
    expect(envelope.offlineStatus).toBe("staged_locally");

    // Verify it is cached and queued in mutationQueue
    expect(LeaseOfflineSigner.hasPendingOfflineSignature("lease_test_99")).toBe(true);
    expect(mutationQueue.getQueue().length).toBe(1);
    expect(mutationQueue.getQueue()[0].endpoint).toBe("/api/landlord/leases/lease_test_99/sign");
  });

  it("stages offline tenant signature envelope correctly", async () => {
    const mockSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const envelope = await LeaseOfflineSigner.stageOfflineSignature({
      leaseId: "lease_test_88",
      signerRole: "tenant",
      signerName: "Maria Resident",
      signatureDataUrl: mockSig,
    });

    expect(envelope.signerRole).toBe("tenant");
    expect(mutationQueue.getQueue()[0].endpoint).toBe("/api/tenant/leases/lease_test_88/sign");
  });
});
