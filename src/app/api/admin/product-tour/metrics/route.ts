import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const assertAdmin = async () => {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { user: null, error: "Unauthorized" as const };
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
        return { user: null, error: "Forbidden" as const };
    }

    return { user, error: null as const };
};

export async function GET(request: Request) {
    const auth = await assertAdmin();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const adminClient = createAdminClient();
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get("since");
    const since =
        sinceParam && !Number.isNaN(new Date(sinceParam).getTime())
            ? new Date(sinceParam).toISOString()
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: stateRows, error: stateError } = await (adminClient as any)
        .from("tenant_product_tour_states")
        .select("status, replay_count, started_at, completed_at");

    if (stateError) {
        return NextResponse.json({ error: `Failed to load tour states: ${stateError.message}` }, { status: 500 });
    }

    const { data: eventRows, error: eventError } = await (adminClient as any)
        .from("tenant_product_tour_events")
        .select("event_type, is_replay, created_at")
        .gte("created_at", since);

    if (eventError) {
        return NextResponse.json({ error: `Failed to load tour events: ${eventError.message}` }, { status: 500 });
    }

    const totals = {
        states: {
            not_started: 0,
            in_progress: 0,
            skipped: 0,
            completed: 0,
        },
        completions: {
            first_run: 0,
            replay: 0,
        },
        started: 0,
        skipped: 0,
        failed: 0,
    };

    for (const row of stateRows ?? []) {
        if (row.status in totals.states) {
            totals.states[row.status as keyof typeof totals.states] += 1;
        }
    }

    for (const row of eventRows ?? []) {
        if (row.event_type === "tour_started") totals.started += 1;
        if (row.event_type === "tour_skipped") totals.skipped += 1;
        if (row.event_type === "tour_failed") totals.failed += 1;
        if (row.event_type === "tour_completed") {
            if (row.is_replay) totals.completions.replay += 1;
            else totals.completions.first_run += 1;
        }
    }

    const startedOrProgressed = totals.started || totals.states.in_progress + totals.states.completed + totals.states.skipped;
    const completionRate =
        startedOrProgressed > 0
            ? Number(((totals.completions.first_run / startedOrProgressed) * 100).toFixed(2))
            : 0;

    return NextResponse.json({
        windowStart: since,
        totals,
        funnel: {
            entered: startedOrProgressed,
            completed: totals.completions.first_run,
            skipped: totals.skipped,
            completionRatePercent: completionRate,
        },
    });
}
