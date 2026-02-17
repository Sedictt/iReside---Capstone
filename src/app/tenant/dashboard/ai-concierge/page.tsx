"use client";

import Image from "next/image";
import Link from 'next/link';
import {
   Bell,
   Home,
   Droplets,
   MessageSquare,
   Send,
   MoreHorizontal,
   Wifi,
   Copy,
   FileText,
   CreditCard,
   PlusCircle,
   CheckCircle2,
   ChevronDown
} from "lucide-react";
import { Manrope } from "next/font/google";

const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function AIConciergePage() {
   return (
      <div className={`min-h-screen bg-[#0d1117] text-white ${body.className}`}>

         {/* Navbar */}
         <nav className="border-b border-white/5 bg-[#0d1117] sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                     <Home className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">iReside</span>
               </div>

               {/* Center Nav - Matching previous tenant nav style */}
               <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                  <Link href="/tenant/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/tenant/leases" className="hover:text-white transition-colors">Leases</Link>
                  <Link href="/tenant/payments" className="hover:text-white transition-colors">Payments</Link>
                  <Link href="/tenant/profile" className="hover:text-white transition-colors">Profile</Link>
                  <Link href="/tenant/dashboard/ai-concierge" className="text-white font-semibold">Concierge</Link>
               </div>

               <div className="flex items-center gap-4">
                  <button className="text-slate-400 hover:text-white transition-colors">
                     <Bell className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                     <div className="text-right hidden md:block">
                        <p className="text-sm font-bold leading-none">Sarah Chen</p>
                        <p className="text-xs text-slate-500 mt-1">Tenant</p>
                     </div>
                     <div className="h-9 w-9 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                        <Image
                           src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
                           alt="Sarah"
                           width={36}
                           height={36}
                           className="object-cover h-full w-full"
                        />
                     </div>
                  </div>
               </div>
            </div>
         </nav>

         <div className="max-w-[1600px] mx-auto p-6 md:p-8">

            {/* Page Header */}
            <div className="mb-8">
               <h1 className="text-3xl font-bold mb-2">Good morning, Sarah</h1>
               <p className="text-slate-400">Here is what is happening with your home today.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">

               {/* Left Column: Property & Finance */}
               <div className="space-y-6">

                  {/* Hero Card */}
                  <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border border-white/5 group">
                     <div className="absolute top-4 left-4 z-20 bg-emerald-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                        Active Lease
                     </div>
                     <Image
                        src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=2000&auto=format&fit=crop"
                        alt="Living Room"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-transparent" />

                     <div className="absolute bottom-0 left-0 p-8 z-10 w-full">
                        <h2 className="text-3xl font-bold mb-1">The Lofts at Downtown</h2>
                        <p className="text-slate-300 text-sm">Unit 4B • 2 Bed, 2 Bath</p>
                     </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {/* Balance */}
                     <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Current Balance</p>
                        <div className="text-2xl font-bold mb-1">₱0.00</div>
                        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                           <CheckCircle2 className="h-3 w-3" /> Paid
                        </div>
                     </div>

                     {/* Lease Term */}
                     <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Lease Term</p>
                        <div className="text-sm font-bold text-white mb-0.5">Jan 1, 2024</div>
                        <div className="text-xs text-slate-500">to Dec 31, 2024</div>
                     </div>

                     {/* Next Due */}
                     <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Next Due Date</p>
                        <div className="text-sm font-bold text-white mb-0.5">Nov 1, 2024</div>
                        <div className="text-xs text-slate-500">Rent & Utilities</div>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                     <button className="bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                        <CreditCard className="h-4 w-4" /> Pay Rent
                     </button>
                     <button className="bg-[#161b22] hover:bg-[#1e232a] border border-white/5 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                        <FileText className="h-4 w-4" /> View Lease
                     </button>
                  </div>

                  {/* Upcoming Payments */}
                  <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">Upcoming Payments</h3>
                        <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-white/5">
                           <span className="text-slate-400 text-xs font-medium">Auto-pay is</span>
                           <span className="text-blue-500 text-xs font-bold uppercase">ON</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {/* Rent Item */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0d1117] border border-white/5 hover:border-white/10 transition-colors">
                           <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <Home className="h-5 w-5" />
                           </div>
                           <div className="flex-1">
                              <p className="font-bold text-sm">November Rent</p>
                              <p className="text-xs text-slate-500">Due Nov 01 • Recurring</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-sm">₱1,850.00</p>
                              <p className="text-xs text-orange-400 font-medium">Pending</p>
                           </div>
                        </div>

                        {/* Utility Item */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0d1117] border border-white/5 hover:border-white/10 transition-colors">
                           <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <Droplets className="h-5 w-5" />
                           </div>
                           <div className="flex-1">
                              <p className="font-bold text-sm">Utility: Water & Sewer</p>
                              <p className="text-xs text-slate-500">Due Nov 01 • Variable</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-sm">₱45.20</p>
                              <p className="text-xs text-orange-400 font-medium">Pending</p>
                           </div>
                        </div>
                     </div>
                  </div>

               </div>

               {/* Right Column: AI Chat */}
               <div className="bg-[#161b22] border border-white/5 rounded-2xl flex flex-col h-[800px] overflow-hidden">

                  {/* Chat Header */}
                  <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#161b22]">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center relative shadow-lg shadow-blue-900/20">
                           <Home className="h-5 w-5 text-white" />
                           <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#161b22] rounded-full"></div>
                        </div>
                        <div>
                           <h3 className="font-bold text-sm">Concierge AI</h3>
                           <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Always Online</p>
                        </div>
                     </div>
                     <button className="text-slate-400 hover:text-white transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                     </button>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[#0d1117]">

                     <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-[#161b22] px-3 py-1.5 rounded-full border border-white/5">Today, 9:41 AM</span>
                     </div>

                     {/* Message: Concierge */}
                     <div className="flex gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center mt-1 shadow-lg shadow-blue-900/20">
                           <Home className="h-4 w-4 text-white" />
                        </div>
                        <div className="space-y-1 max-w-[85%]">
                           <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Concierge</span>
                           <div className="bg-[#1e2530] border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-sm">
                              Welcome back, Sarah! 👋 How can I help you settle in or manage your apartment today?
                           </div>
                        </div>
                     </div>

                     {/* Message: User */}
                     <div className="flex flex-row-reverse gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center mt-1 overflow-hidden border border-white/10">
                           <Image
                              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
                              alt="Sarah"
                              width={32} height={32}
                              className="object-cover h-full w-full"
                           />
                        </div>
                        <div className="space-y-1 max-w-[85%] flex flex-col items-end">
                           <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none text-sm text-white leading-relaxed shadow-md">
                              Hi there! I have a friend coming over. What is the WiFi password for the lobby guest network?
                           </div>
                           <span className="text-[10px] text-slate-500 mr-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              9:45 AM <CheckCircle2 className="h-3 w-3 text-blue-500" />
                           </span>
                        </div>
                     </div>

                     {/* Message: Concierge with specialized card */}
                     <div className="flex gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center mt-1 shadow-lg shadow-blue-900/20">
                           <Home className="h-4 w-4 text-white" />
                        </div>
                        <div className="space-y-1 max-w-[90%]">
                           <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Concierge</span>
                           <div className="bg-[#1e2530] border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-sm space-y-4">
                              <p>I can help with that! Here are the details for the Lobby network:</p>

                              {/* Wifi Card */}
                              <div className="bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden">
                                 <div className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group/item">
                                    <div>
                                       <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Network Name</p>
                                       <p className="font-mono text-blue-400 font-medium text-sm">TheLofts_Guest</p>
                                    </div>
                                    <Wifi className="h-4 w-4 text-slate-600 group-hover/item:text-blue-500 transition-colors" />
                                 </div>
                                 <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group/item">
                                    <div>
                                       <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Password</p>
                                       <p className="font-mono text-blue-400 font-medium text-sm tracking-wide">WelcomeHome2024</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-slate-600 group-hover/item:text-blue-500 transition-colors" />
                                 </div>
                              </div>

                              <p>Is there anything else you need?</p>
                           </div>
                        </div>
                     </div>

                  </div>

                  {/* Chat Footer */}
                  <div className="p-4 bg-[#161b22] border-t border-white/5 space-y-4">

                     {/* Quick Actions */}
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Maintenance Request', 'Amenity Hours', 'Parcel Info'].map((action) => (
                           <button key={action} className="whitespace-nowrap px-4 py-2 rounded-full bg-[#0d1117] border border-white/5 text-[11px] font-bold text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all uppercase tracking-wide">
                              {action}
                           </button>
                        ))}
                     </div>

                     {/* Input Area */}
                     <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center cursor-pointer hover:border-white hover:bg-white/10 transition-colors bg-[#0d1117]">
                           <PlusCircle className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <input
                           type="text"
                           placeholder="Type a message..."
                           className="w-full bg-[#0d1117] border border-white/10 rounded-full py-4 pl-14 pr-14 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-[#0d1117] transition-all"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 active:scale-95">
                           <Send className="h-4 w-4 text-white pl-0.5" />
                        </button>
                     </div>

                     <div className="text-center">
                        <p className="text-[10px] text-slate-600 font-medium tracking-wide">AI Concierge can make mistakes. Verify critical info.</p>
                     </div>
                  </div>

               </div>

            </div>
         </div>
         <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      </div>
   );
}
