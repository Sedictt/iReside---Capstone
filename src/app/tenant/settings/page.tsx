"use client";

import { TenantNavbar } from '@/components/tenant/TenantNavbar';

export default function TenantSettingsPage() {

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">

            <TenantNavbar />

            <main className="max-w-3xl mx-auto p-6 md:p-8 space-y-12">

                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-4xl font-display text-foreground">Settings</h1>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 gap-16">

                    {/* Security */}
                    <section>
                        <h3 className="text-3xl font-display text-foreground mb-2">Security</h3>
                        <p className="text-muted-foreground italic text-sm mb-8">Protecting your private portfolio.</p>

                        <div className="space-y-6 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Current Password</label>
                                <input type="password" value="............" readOnly className="w-full bg-transparent border-b border-border py-2 text-foreground text-lg tracking-widest focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">New Password</label>
                                <input type="password" className="w-full bg-transparent border-b border-border py-2 text-foreground focus:outline-none focus:border-primary transition-colors" />
                            </div>

                            <button className="mt-4 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-primary/20">
                                Update Signature
                            </button>
                        </div>
                    </section>

                    {/* Signal */}
                    <section>
                        <h3 className="text-3xl font-display text-foreground mb-2">Signal</h3>
                        <p className="text-muted-foreground italic text-sm mb-8">How you receive residency news.</p>

                        <div className="space-y-6 max-w-xl">
                            <div className="flex items-center justify-between group cursor-pointer">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Rent Reminders</span>
                                <div className="h-4 w-8 rounded-full bg-border relative transition-colors">
                                    <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-muted-foreground/50"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between group cursor-pointer">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Maintenance Signals</span>
                                <div className="h-4 w-8 rounded-full bg-primary/20 relative transition-colors">
                                    <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary shadow-custom-primary"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between group cursor-pointer">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Curated Offers</span>
                                <div className="h-4 w-8 rounded-full bg-border relative transition-colors">
                                    <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-muted-foreground/50"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
        .shadow-custom-primary {
          box-shadow: 0 0 10px rgba(109, 152, 56, 0.5);
        }
      `}</style>
        </div>
    );
}
