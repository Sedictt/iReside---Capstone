import Link from "next/link";
import { User, LogOut, Settings, LayoutDashboard, Building2, Grid } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                            iReside
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 py-1.5 pl-2 pr-4 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="hidden sm:inline-block">John Doe</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl lg:block">
                    <div className="flex h-full flex-col justify-between py-6">
                        <nav className="space-y-1 px-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 rounded-lg bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-400"
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/properties"
                                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                            >
                                <Building2 className="h-5 w-5" />
                                Properties
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                            >
                                <Settings className="h-5 w-5" />
                                Settings
                            </Link>
                            <Link
                                href="/dashboard/visual-planner"
                                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                            >
                                <Grid className="h-5 w-5" />
                                Visual Planner
                            </Link>
                        </nav>

                        <div className="px-4">
                            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:ml-64 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}


