
import { Sidebar } from "@/components/landlord/Sidebar";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#0a0a0a]">
            <Sidebar />
            <main className="flex-1 ml-64 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
