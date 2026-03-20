"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/types/database";

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

const ROLE_BADGE: Record<UserRole, string> = {
    tenant: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    landlord: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then(({ users }) => setUsers(users ?? []))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(
        (u) =>
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="text-neutral-400 text-sm mt-1">All registered users on the platform</p>
            </div>

            <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-5 w-full max-w-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20"
            />

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-neutral-500 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-sm">No users found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">User</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Role</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-white">{u.full_name}</p>
                                        <p className="text-neutral-500 text-xs">{u.email}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ROLE_BADGE[u.role]}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-neutral-400 text-xs">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
