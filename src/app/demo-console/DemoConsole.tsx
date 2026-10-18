"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DemoAccount, DemoAccountKey, DemoScenario } from "./scenarios";

interface Props {
    accounts: DemoAccount[];
    password: string;
    scenarios: DemoScenario[];
    resetAvailable: boolean;
}

const DEMO_WINDOW_NAME = "ireside-demo";

type Status = { kind: "idle" } | { kind: "busy"; text: string } | { kind: "ok"; text: string } | { kind: "error"; text: string };

const roleColor: Record<DemoAccount["role"], string> = {
    landlord: "#2f6f5e",
    tenant: "#3b5bdb",
    public: "#6b7280",
};

export function DemoConsole({ accounts, password, scenarios, resetAvailable }: Props) {
    const [status, setStatus] = useState<Status>({ kind: "idle" });
    const [current, setCurrent] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [resetLog, setResetLog] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const accountByKey = useMemo(() => Object.fromEntries(accounts.map((a) => [a.key, a])) as Record<DemoAccountKey, DemoAccount>, [accounts]);

    useEffect(() => {
        let cancelled = false;
        createClient()
            .auth.getUser()
            .then(({ data }) => {
                if (!cancelled) setCurrent(data.user?.email ?? null);
            })
            .catch(() => {
                if (!cancelled) setCurrent(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const visible = q
            ? scenarios.filter((s) => `${s.group} ${s.title} ${s.steps ?? ""} ${s.say ?? ""} ${accountByKey[s.as]?.label ?? ""}`.toLowerCase().includes(q))
            : scenarios;
        const map = new Map<string, DemoScenario[]>();
        for (const s of visible) {
            if (!map.has(s.group)) map.set(s.group, []);
            map.get(s.group)!.push(s);
        }
        return [...map.entries()];
    }, [scenarios, query, accountByKey]);

    /** Sign out, sign in as the requested demo account, then open the target screen. */
    const launch = async (scenario: DemoScenario, sameTab: boolean) => {
        const account = accountByKey[scenario.as];
        const supabase = createClient();
        try {
            setStatus({ kind: "busy", text: account.email ? `Signing in as ${account.label}…` : "Signing out…" });
            if (current !== account.email) {
                await supabase.auth.signOut({ scope: "local" });
                if (account.email) {
                    const { error } = await supabase.auth.signInWithPassword({ email: account.email, password });
                    if (error) throw error;
                }
            }
            setCurrent(account.email);
            setStatus({ kind: "ok", text: `${account.email ? `Signed in as ${account.label}` : "Signed out"} → ${scenario.path}` });
            if (sameTab) {
                window.location.assign(scenario.path);
            } else {
                const win = window.open(scenario.path, DEMO_WINDOW_NAME);
                win?.focus();
            }
        } catch (error) {
            setStatus({ kind: "error", text: error instanceof Error ? error.message : "Sign-in failed" });
        }
    };

    const runReset = async () => {
        if (!window.confirm("Reset the demo data now? This rebuilds every Gonzales record and signs all demo accounts out (about 1 minute).")) return;
        setResetting(true);
        setResetLog("Running scripts/seed-defense-demo.mjs …");
        try {
            const res = await fetch("/api/demo-console/reset", { method: "POST" });
            const body = await res.json();
            setResetLog(`${body.ok ? "✓ Demo reset" : "✗ Reset failed"} (${body.seconds ?? "?"}s)\n\n${body.output ?? body.error ?? ""}`);
            setCurrent(null);
        } catch (error) {
            setResetLog(`✗ ${error instanceof Error ? error.message : "Reset failed"}`);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f1512", color: "#e8efe9", fontFamily: "ui-sans-serif, system-ui, Segoe UI, sans-serif" }}>
            <style>{`
                .dc-btn { text-align:left; width:100%; border:1px solid #27352e; background:#162019; color:#e8efe9; border-radius:14px; padding:14px 16px; cursor:pointer; transition:transform .06s, border-color .12s, background .12s; }
                .dc-btn:hover { border-color:#4f8f7a; background:#1b2a21; }
                .dc-btn:active { transform:scale(.985); }
                .dc-btn:focus-visible { outline:3px solid #7fd1b4; outline-offset:2px; }
                .dc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:12px; }
                .dc-badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:3px 8px; border-radius:999px; color:#fff; }
                .dc-input { width:100%; max-width:520px; border:1px solid #27352e; background:#121a15; color:#e8efe9; border-radius:12px; padding:12px 14px; font-size:16px; }
                .dc-top { position:sticky; top:0; z-index:5; background:#0f1512; border-bottom:1px solid #1e2a24; }
                .dc-reset { border:1px solid #7a3b2e; background:#2a1612; color:#ffd8cf; border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer; }
                .dc-reset:disabled { opacity:.5; cursor:wait; }
                pre.dc-log { background:#0b100d; border:1px solid #1e2a24; border-radius:12px; padding:12px; font-size:12px; max-height:260px; overflow:auto; white-space:pre-wrap; }
            `}</style>

            <header className="dc-top">
                <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                    <div style={{ flex: "1 1 320px" }}>
                        <div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#7fd1b4", fontWeight: 700 }}>Private · Defense console</div>
                        <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800 }}>Fernando Gonzales Dormitory — demo launcher</h1>
                        <div style={{ fontSize: 13, color: "#9fb3a8", marginTop: 4 }}>
                            Click a scenario: it signs in as the right account and opens the screen in the <b>demo window</b>. Shift-click opens it in this tab.
                        </div>
                    </div>
                    <div style={{ flex: "0 0 auto", textAlign: "right", fontSize: 13 }}>
                        <div style={{ color: "#9fb3a8" }}>Signed in as</div>
                        <div style={{ fontWeight: 700 }}>{current ?? "nobody"}</div>
                        <div style={{ marginTop: 6, color: status.kind === "error" ? "#ff9f8f" : status.kind === "busy" ? "#ffd27f" : "#7fd1b4", minHeight: 18 }}>
                            {status.kind === "idle" ? "" : status.text}
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                    <input
                        className="dc-input"
                        placeholder="Type what the panel asked… e.g. signing, GCash, move-out, curfew"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {resetAvailable && (
                        <button className="dc-reset" onClick={runReset} disabled={resetting} type="button">
                            {resetting ? "Resetting… (~1 min)" : "↻ Reset demo data"}
                        </button>
                    )}
                </div>
            </header>

            <main style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 20px 60px" }}>
                {resetLog && <pre className="dc-log">{resetLog}</pre>}

                <section style={{ margin: "8px 0 22px" }}>
                    <h2 style={{ fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: "#9fb3a8", margin: "0 0 10px" }}>Accounts (password for all: <code>{password}</code>)</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {accounts.filter((a) => a.email).map((a) => (
                            <button
                                key={a.key}
                                type="button"
                                className="dc-btn"
                                style={{ width: "auto", padding: "8px 12px", borderRadius: 999, display: "flex", gap: 8, alignItems: "center" }}
                                title={`${a.email} — ${a.state}`}
                                onClick={(e) => launch({ id: `acct-${a.key}`, group: "Accounts", title: a.label, as: a.key, path: a.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard" }, e.shiftKey)}
                            >
                                <span className="dc-badge" style={{ background: roleColor[a.role] }}>{a.room ? `Rm ${a.room}` : a.role}</span>
                                <span style={{ fontWeight: 600 }}>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {groups.length === 0 && <p style={{ color: "#9fb3a8" }}>Nothing matches “{query}”.</p>}

                {groups.map(([group, items]) => (
                    <section key={group} style={{ marginBottom: 26 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px", color: "#cfe7dc" }}>{group}</h2>
                        <div className="dc-grid">
                            {items.map((s) => {
                                const account = accountByKey[s.as];
                                return (
                                    <button key={s.id} type="button" className="dc-btn" onClick={(e) => launch(s, e.shiftKey)}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>{s.title}</div>
                                            <span className="dc-badge" style={{ background: roleColor[account.role], flex: "0 0 auto" }}>
                                                {account.role === "public" ? "public" : account.room ? `Rm ${account.room}` : "landlord"}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "#9fb3a8", marginTop: 6 }}>
                                            {account.email ? account.label : "No login"} · <code style={{ color: "#b7cfc4" }}>{s.path}</code>
                                        </div>
                                        {s.steps && <div style={{ fontSize: 13, marginTop: 8, color: "#dbe7e0" }}>→ {s.steps}</div>}
                                        {s.say && <div style={{ fontSize: 12, marginTop: 6, color: "#7fd1b4", fontStyle: "italic" }}>Say: {s.say}</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}
