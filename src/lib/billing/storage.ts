import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeFileName } from "@/lib/billing/utils";

export const BILLING_BUCKETS = {
    landlordQr: "landlord-payment-qr",
    paymentProofs: "payment-proofs",
    readingProofs: "utility-reading-proofs",
} as const;

const DEFAULT_LIMITS: Record<(typeof BILLING_BUCKETS)[keyof typeof BILLING_BUCKETS], string> = {
    "landlord-payment-qr": `${5 * 1024 * 1024}`,
    "payment-proofs": `${8 * 1024 * 1024}`,
    "utility-reading-proofs": `${8 * 1024 * 1024}`,
};

export async function ensureBucket(bucketName: (typeof BILLING_BUCKETS)[keyof typeof BILLING_BUCKETS]) {
    const admin = createAdminClient();
    const { data: bucket, error } = await admin.storage.getBucket(bucketName);

    if (!error && bucket) return;

    const { error: createError } = await admin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: DEFAULT_LIMITS[bucketName],
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw createError;
    }
}

export async function uploadBillingFile({
    bucketName,
    ownerId,
    scope,
    file,
    upsert = true,
}: {
    bucketName: (typeof BILLING_BUCKETS)[keyof typeof BILLING_BUCKETS];
    ownerId: string;
    scope: string;
    file: File;
    upsert?: boolean;
}) {
    const admin = createAdminClient();
    await ensureBucket(bucketName);

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
    const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "upload";
    const path = `${ownerId}/${scope}/${Date.now()}-${safeBase}.${safeExt}`;

    const bytes = await file.arrayBuffer();
    const { error } = await admin.storage.from(bucketName).upload(path, bytes, {
        contentType: file.type,
        upsert,
    });

    if (error) {
        throw error;
    }

    const {
        data: { publicUrl },
    } = admin.storage.from(bucketName).getPublicUrl(path);

    return { path, publicUrl };
}

export async function removeBillingFile(bucketName: (typeof BILLING_BUCKETS)[keyof typeof BILLING_BUCKETS], path: string | null) {
    if (!path) return;

    const admin = createAdminClient();
    const { error } = await admin.storage.from(bucketName).remove([path]);

    if (error && !error.message.toLowerCase().includes("not found")) {
        throw error;
    }
}
