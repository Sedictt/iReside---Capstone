import { describe, it, expect, beforeEach, vi } from "vitest";
import { OfflineStorage, OfflineBlobStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";

describe("Deep Offline Resilience Expansion", () => {
  beforeEach(() => {
    localStorage.clear();
    mutationQueue.clear();
    vi.clearAllMocks();
  });

  describe("Tenant Payments Hub Offline Caching", () => {
    it("stores and hydrates payment ledger payload with zero latency", () => {
      const mockPayload = {
        nextPayment: {
          id: "inv-101",
          invoiceNumber: "INV-2026-001",
          totalAmount: 10222.5,
          paidAmount: 0,
          status: "pending",
          dueDate: "2026-09-05",
        } as any,
        history: [],
        lease: {
          id: "lease-101",
          monthlyRent: 7500,
          propertyName: "Valenzuela Grand Residences",
          unitName: "Unit 101",
        },
        upcomingMonths: [],
      };

      // Set snapshot
      OfflineStorage.set("tenant_payments_payload", mockPayload, null, "payments");

      // Retrieve snapshot
      const cached = OfflineStorage.get<typeof mockPayload>("tenant_payments_payload");
      expect(cached).not.toBeNull();
      expect(cached?.data.nextPayment?.invoiceNumber).toBe("INV-2026-001");
      expect(cached?.data.lease?.propertyName).toBe("Valenzuela Grand Residences");
    });
  });

  describe("GCash Checkout Offline Staging & Blob Storage", () => {
    it("stages payment receipt image into OfflineBlobStorage and enqueues mutation", async () => {
      const invoiceId = "inv-101";
      const sampleReceiptDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      // 1. Save receipt in OfflineBlobStorage
      await OfflineBlobStorage.saveBlob(
        `payment_receipt_${invoiceId}`,
        sampleReceiptDataUrl,
        {
          contentType: "image/png",
          name: "gcash_receipt_001.png",
          createdAt: new Date().toISOString(),
        }
      );

      // 2. Verify blob retrieval
      const blob = await OfflineBlobStorage.getBlob(`payment_receipt_${invoiceId}`);
      expect(blob).not.toBeNull();
      expect(blob?.blobData).toBe(sampleReceiptDataUrl);
      expect(blob?.metadata.name).toBe("gcash_receipt_001.png");

      // 3. Enqueue payment submission mutation
      const mutation = mutationQueue.enqueue(
        "STAGE_PAYMENT_PROOF",
        `/api/tenant/payments/${invoiceId}/submit`,
        "POST",
        {
          invoiceId,
          method: "gcash",
          referenceNumber: "9023 8812 4410",
          note: "Paid via GCash",
          receiptBlobKey: `payment_receipt_${invoiceId}`,
        },
        `Offline GCash payment for Invoice #${invoiceId}`
      );

      expect(mutation.type).toBe("STAGE_PAYMENT_PROOF");
      expect(mutationQueue.getQueue()).toHaveLength(1);
    });
  });

  describe("Community Hub Offline Caching & Post Staging", () => {
    it("caches community feed snapshot and retrieves offline", () => {
      const mockPosts = [
        {
          id: "post-1",
          title: "Scheduled Water Interruption",
          content: "Maynilad pipe maintenance this Friday.",
          post_type: "announcement",
          author: { id: "admin-1", full_name: "Property Admin", role: "landlord" },
          created_at: new Date().toISOString(),
          is_pinned: true,
        },
      ];

      OfflineStorage.set("community_posts_default", mockPosts, null, "community");

      const cached = OfflineStorage.get<typeof mockPosts>("community_posts_default");
      expect(cached).not.toBeNull();
      expect(cached?.data).toHaveLength(1);
      expect(cached?.data[0].title).toBe("Scheduled Water Interruption");
    });

    it("enqueues offline community post with photo blobs", async () => {
      const photoKey = "post_photo_101_0";
      const samplePhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

      await OfflineBlobStorage.saveBlob(photoKey, samplePhoto, {
        contentType: "image/jpeg",
        name: "lobby_photo.jpg",
      });

      const mutation = mutationQueue.enqueue(
        "CREATE_COMMUNITY_POST",
        "/api/community/posts",
        "POST",
        {
          title: "Lobby Quiet Hours",
          content: "Reminder regarding weekend quiet hours.",
          type: "discussion",
          photoBlobKeys: [photoKey],
        },
        "Offline community post: Lobby Quiet Hours"
      );

      expect(mutationQueue.getQueue()).toHaveLength(1);
      expect(mutation.payload.title).toBe("Lobby Quiet Hours");
    });
  });
});
