import { describe, it, expect } from "vitest";
import {
  buildUserProfile,
  buildAuthenticatedContext,
  buildProperty,
  buildUnit,
  buildLease,
  buildPayment,
  buildInvoice,
  buildMaintenanceRequest,
  buildCommunityPost,
  buildComment,
} from "../index";
import { createMockSupabaseClient } from "../../helpers/mock-supabase";

describe("Test Factories", () => {
  it("builds user profile with defaults and overrides", () => {
    const defaultUser = buildUserProfile();
    expect(defaultUser.id).toBe("user-123");
    expect(defaultUser.email).toBe("user@example.com");

    const customUser = buildUserProfile({ id: "user-999", full_name: "Custom Name" });
    expect(customUser.id).toBe("user-999");
    expect(customUser.full_name).toBe("Custom Name");
  });

  it("builds authenticated context", () => {
    const context = buildAuthenticatedContext({ userId: "landlord-456", userRole: "landlord" });
    expect(context.userId).toBe("landlord-456");
    expect(context.userRole).toBe("landlord");
  });

  it("builds property and unit", () => {
    const property = buildProperty({ name: "Palm Heights" });
    expect(property.name).toBe("Palm Heights");
    expect(property.type).toBe("apartment");

    const unit = buildUnit({ name: "Penthouse 1", rent_amount: 50000 });
    expect(unit.name).toBe("Penthouse 1");
    expect(unit.rent_amount).toBe(50000);
  });

  it("builds lease", () => {
    const lease = buildLease({ monthly_rent: 25000 });
    expect(lease.status).toBe("active");
    expect(lease.monthly_rent).toBe(25000);
  });

  it("builds payment and invoice", () => {
    const payment = buildPayment({ amount: 12000, payment_method: "maya" });
    expect(payment.amount).toBe(12000);
    expect(payment.payment_method).toBe("maya");

    const invoice = buildInvoice({ invoice_number: "INV-999" });
    expect(invoice.invoice_number).toBe("INV-999");
  });

  it("builds maintenance request", () => {
    const request = buildMaintenanceRequest({ title: "Broken Window", priority: "urgent" });
    expect(request.title).toBe("Broken Window");
    expect(request.priority).toBe("urgent");
  });

  it("builds community post and comment", () => {
    const post = buildCommunityPost({ title: "Lost Cat" });
    expect(post.title).toBe("Lost Cat");

    const comment = buildComment({ content: "Hope you find it!" });
    expect(comment.content).toBe("Hope you find it!");
  });
});

describe("Mock Supabase Helper", () => {
  it("creates fluent chainable mock client with table handlers", async () => {
    const mockPost = buildCommunityPost({ id: "post-1" });
    const mockClient = createMockSupabaseClient({
      tables: {
        community_posts: { data: [mockPost], error: null },
      },
    });

    const { data } = await mockClient
      .from("community_posts")
      .select("*")
      .eq("id", "post-1")
      .single();

    expect(data).toEqual(mockPost);
  });

  it("provides mock auth user and session", async () => {
    const mockClient = createMockSupabaseClient({
      user: { id: "test-user-id", email: "test@example.com" },
    });

    const { data } = await mockClient.auth.getUser();
    expect(data.user?.id).toBe("test-user-id");
    expect(data.user?.email).toBe("test@example.com");
  });
});
