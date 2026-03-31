import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TenantTourContext = {
    supabase: any;
    adminClient: any;
    user: any;
    role: string;
};

export const resolveTenantRole = async (supabase: any, user: any) => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role ?? "tenant";
};

export const resolveTenantTourContext = async () => {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { error: "Unauthorized" as const, status: 401 as const };
    }

    const role = await resolveTenantRole(supabase as any, user);
    if (role !== "tenant") {
        return { error: "Forbidden" as const, status: 403 as const };
    }

    return {
        context: {
            supabase,
            adminClient,
            user,
            role,
        } as TenantTourContext,
        error: null,
        status: 200 as const,
    };
};
