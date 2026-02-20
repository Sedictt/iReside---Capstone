"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from 'next/link';
import {
   MoreHorizontal,
   Plus,
   Image as ImageIcon,
   Sticker,
   Smile,
   ThumbsUp,
   Phone,
   Video,
   Wifi,
   Copy,
   Menu,
   Search,
   Info,
   ArrowUp,
   ArrowLeft,
   Settings,
   Wrench,
   Package,
   Calendar,
   CreditCard,
   Lock,
   Brain,
   Zap,
   ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function AIConciergePage() {
   const messagesEndRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, []);

   return (
      <div className="bg-[#f3f4f6] dark:bg-[#111827] text-gray-900 dark:text-gray-100 flex-1 w-full flex h-screen max-h-screen overflow-hidden transition-colors duration-300">

         {/* Sidebar / Aside (Hidden on small screens, shown on lg) */}
         <aside className="w-80 hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] z-20 transition-colors duration-300">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800/50">
               <Link
                  href="/tenant/dashboard"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-white/10"
               >
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10 transition-colors">
                     <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">Back to Home</span>
               </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
               <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">Frequent Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#6d9838] hover:bg-[#6d9838]/5 dark:hover:bg-[#6d9838]/10 transition group">
                        <Wrench className="text-gray-400 group-hover:text-[#6d9838] mb-2 w-5 h-5" />
                        <span className="text-xs font-medium text-center">Maintenance</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#6d9838] hover:bg-[#6d9838]/5 dark:hover:bg-[#6d9838]/10 transition group">
                        <Package className="text-gray-400 group-hover:text-[#6d9838] mb-2 w-5 h-5" />
                        <span className="text-xs font-medium text-center">Packages</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#6d9838] hover:bg-[#6d9838]/5 dark:hover:bg-[#6d9838]/10 transition group">
                        <Calendar className="text-gray-400 group-hover:text-[#6d9838] mb-2 w-5 h-5" />
                        <span className="text-xs font-medium text-center">Amenities</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#6d9838] hover:bg-[#6d9838]/5 dark:hover:bg-[#6d9838]/10 transition group">
                        <CreditCard className="text-gray-400 group-hover:text-[#6d9838] mb-2 w-5 h-5" />
                        <span className="text-xs font-medium text-center">Rent</span>
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-black/10 backdrop-blur-sm">
               <div className="relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/20 hover:shadow-xl group overflow-hidden">
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0 z-0">
                     <Image
                        src="/profile-bg.png"
                        alt="Profile Background"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 dark:opacity-20"
                     />
                     <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-white/10 dark:from-gray-900/95 dark:via-gray-900/70 dark:to-gray-900/20"></div>
                  </div>

                  <div className="relative z-10 flex items-center gap-3 w-full">
                     <div className="relative">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] shadow-lg">
                           <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-black text-white overflow-hidden uppercase">
                              JD
                           </div>
                        </div>
                        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-sm"></div>
                     </div>

                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate tracking-tight">John Doe</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 font-bold tracking-tight uppercase opacity-80">Unit 404 • Resident</p>
                     </div>

                     <div className="p-2 rounded-xl text-gray-500 dark:text-gray-400 group-hover:text-primary transition-all bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-transparent group-hover:border-primary/20">
                        <Settings className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
                     </div>
                  </div>
               </div>
            </div>
         </aside>

         <main className="flex-1 flex flex-col relative h-full overflow-hidden">
            <div className="ambient-glow absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(109,152,56,0.05) 0%, rgba(0,0,0,0) 70%)' }}></div>

            <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800/60 z-10 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl relative">
               {/* Subtle accent glow in header */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

               <div className="flex items-center gap-5">
                  <Link href="/tenant/dashboard" className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-all border border-gray-200 dark:border-gray-700">
                     <Menu className="w-5 h-5" />
                  </Link>

                  <div className="flex items-center gap-4">
                     <div className="relative group">
                        {/* Glow effect matching bubble colors */}
                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary/30 to-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                        <div className="relative h-12 w-12 rounded-full p-[2px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 shadow-inner">
                           <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 overflow-hidden flex items-center justify-center">
                              <Image
                                 src="/iris-avatar.png"
                                 alt="iRis Assistant Avatar"
                                 width={48} height={48}
                                 className="object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                           </div>
                        </div>
                        {/* Status with pulse */}
                        {/* More subtle pulse for status */}
                        <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-white dark:bg-[#111827] flex items-center justify-center">
                           <div className="h-2 w-2 rounded-full bg-[#6d9838]">
                              <div className="absolute inset-0 rounded-full bg-[#6d9838] animate-ping opacity-30"></div>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <h2 className="font-bold text-base tracking-tight text-gray-900 dark:text-gray-100">
                              iRis Assistant
                           </h2>
                           <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                              System
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  {/* Modernized search pill */}
                  <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-full px-4 py-1.5 border border-gray-200 dark:border-gray-700 transition-all hover:border-primary/30 focus-within:border-primary/50 group w-60">
                     <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                     <input
                        type="text"
                        placeholder="Search messages..."
                        className="ml-2 bg-transparent border-none focus:ring-0 text-[12px] text-gray-600 dark:text-gray-300 placeholder-gray-400 w-full"
                     />
                  </div>

                  <div className="flex items-center gap-2">
                     <div className="relative group/info">
                        <button className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                           <Info className="w-5 h-5" />
                        </button>

                        {/* Information Dropdown - Scaled to ~1.4x */}
                        <div className="absolute right-0 top-full mt-5 w-[420px] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-500 transform origin-top-right scale-95 group-hover/info:scale-100 z-50 pointer-events-none group-hover/info:pointer-events-auto">
                           <div className="bg-white dark:bg-[#1f2937] rounded-[24px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="p-7">
                                 <div className="flex items-center gap-6 mb-7">
                                    <div className="h-16 w-16 rounded-[16px] bg-primary/10 dark:bg-primary/20 flex items-center justify-center p-2">
                                       <Image src="/iris-avatar.png" width={52} height={52} alt="iRis" className="object-contain" />
                                    </div>
                                    <div>
                                       <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">Meet iRis</h4>
                                       <p className="text-[11px] text-primary font-black uppercase tracking-[0.12em] mt-1">Virtual Resident Assistant</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 gap-6">
                                    <div className="flex gap-4 items-start">
                                       <div className="mt-1 p-2 rounded-lg bg-amber-500/10"><Zap className="w-5 h-5 text-amber-500" /></div>
                                       <div>
                                          <p className="text-base font-black text-gray-800 dark:text-gray-100 mb-0.5">What is iRis?</p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Advanced AI assistant synthesizing property data into a seamless experience.</p>
                                       </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                       <div className="mt-1 p-2 rounded-lg bg-blue-500/10"><Brain className="w-5 h-5 text-blue-500" /></div>
                                       <div>
                                          <p className="text-base font-black text-gray-800 dark:text-gray-100 mb-0.5">How it works</p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic">Draws from a secure, landlord-curated knowledge base for property-specific answers.</p>
                                       </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                       <div className="mt-1 p-2 rounded-lg bg-green-500/10"><ShieldCheck className="w-5 h-5 text-green-500" /></div>
                                       <div>
                                          <p className="text-base font-black text-gray-800 dark:text-gray-100 mb-0.5">Core Purpose</p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Instant assistance for WiFi, maintenance triage, and policy guidance.</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/80 p-5 px-7 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                 <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest italic">iReside Intelligent Systems</p>
                                 <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-[9px] font-bold text-primary uppercase">v4.2.0 Stable</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-8 z-0 relative scroll-smooth pb-32">

               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center justify-center py-10 opacity-90"
               >
                  <div className="h-24 w-24 rounded-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-1 mb-4 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
                     <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        <Image
                           src="/iris-avatar.png"
                           alt="Large iRis Avatar"
                           width={80} height={80}
                           className="object-cover"
                        />
                     </div>
                  </div>
                  <h2 className="text-xl font-semibold mb-1">iRis Assistant</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You're chatting with iRis Assistant.</p>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-6 uppercase tracking-widest">Today at 9:41 AM</p>
               </motion.div>


               {/* iRis Greeting */}
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4 max-w-3xl mx-auto w-full group"
               >
                  <div className="flex-shrink-0 mt-auto">
                     <div className="h-8 w-8 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-900/50">
                        <Image
                           src="/iris-avatar.png"
                           alt="AI Avatar"
                           width={32} height={32}
                           className="object-cover"
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-1 items-start max-w-[85%]">
                     <div className="px-5 py-3.5 rounded-2xl rounded-bl-none bg-[#e5e7eb] dark:bg-[#374151] shadow-sm text-sm lg:text-base leading-relaxed text-gray-900 dark:text-gray-100">
                        <p>Welcome back, Sarah! 👋 How can I help you settle in or manage your apartment today?</p>
                     </div>
                  </div>
               </motion.div>

               {/* User Message */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-4 max-w-3xl mx-auto w-full flex-row-reverse group"
               >
                  <div className="flex-shrink-0 mt-auto">
                     <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                        JD
                     </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end max-w-[85%]">
                     <div className="px-5 py-3.5 rounded-2xl rounded-br-none bg-[#6d9838] text-white shadow-[0_0_20px_rgba(109,152,56,0.15)] text-sm lg:text-base leading-relaxed">
                        <p>Hi there! I have a friend coming over. What is the WiFi password for the lobby guest network?</p>
                     </div>
                     <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">Seen</span>
                  </div>
               </motion.div>

               {/* iRis Response */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-4 max-w-3xl mx-auto w-full group"
               >
                  <div className="flex-shrink-0 mt-auto">
                     <div className="h-8 w-8 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-900/50">
                        <Image
                           src="/iris-avatar.png"
                           alt="AI Avatar"
                           width={32} height={32}
                           className="object-cover"
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 items-start max-w-[90%] lg:max-w-[70%]">
                     <div className="px-5 py-3.5 rounded-2xl rounded-bl-none bg-[#e5e7eb] dark:bg-[#374151] shadow-sm text-sm lg:text-base leading-relaxed text-gray-900 dark:text-gray-100">
                        <p>I can help with that! Here are the details for the Lobby network:</p>
                     </div>

                     {/* Data Card */}
                     <div className="w-full bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg mt-1 backdrop-blur-sm">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                           <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1">Network Name</p>
                              <p className="text-[#3b82f6] dark:text-blue-400 font-mono font-medium text-sm md:text-base select-all">TheLofts_Guest</p>
                           </div>
                           <button className="p-2 text-gray-400 hover:text-[#3b82f6] dark:hover:text-blue-400 transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Copy SSID">
                              <Wifi className="w-5 h-5" />
                           </button>
                        </div>
                        <div className="p-4 flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer active:scale-[0.99] active:bg-gray-100 dark:active:bg-gray-700/50">
                           <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1">Password</p>
                              <p className="text-[#3b82f6] dark:text-blue-400 font-mono font-medium text-sm md:text-base select-all">WelcomeHome2024</p>
                           </div>
                           <button className="p-2 text-gray-400 group-hover/item:text-[#3b82f6] dark:group-hover/item:text-blue-400 transition rounded-lg" title="Copy Password">
                              <Copy className="w-5 h-5" />
                           </button>
                        </div>
                     </div>

                     <div className="px-5 py-3.5 mt-1 rounded-2xl bg-[#e5e7eb] dark:bg-[#374151] shadow-sm text-sm lg:text-base leading-relaxed text-gray-900 dark:text-gray-100">
                        <p>Is there anything else you need?</p>
                     </div>
                  </div>
               </motion.div>

               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-[#f3f4f6]/80 dark:bg-[#111827]/80 backdrop-blur-md pb-6 pt-4 px-4 lg:px-8 z-20 w-full border-t border-gray-200 dark:border-gray-800">
               <div className="max-w-4xl mx-auto relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6d9838] to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative flex items-center gap-2 p-1.5 pr-2 glass-input rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                     <button className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-900 text-white dark:bg-black dark:text-gray-200 hover:scale-105 transition active:scale-95">
                        <span className="font-bold text-xs">JD</span>
                     </button>
                     <input
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base px-2"
                        placeholder="Type a message..."
                        type="text"
                     />
                     <div className="flex items-center gap-1">
                        <button className="h-9 w-9 flex items-center justify-center rounded-full bg-[#6d9838] hover:bg-[#5a7e2f] text-white shadow-md transition transform active:scale-95 ml-1">
                           <ArrowUp className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
               <p className="text-center text-[10px] text-gray-400 mt-2 opacity-60">AI can make mistakes. Verify important info.</p>
            </div>
         </main>

         <style jsx global>{`
            .glass-panel {
               background: rgba(255, 255, 255, 0.7);
               backdrop-filter: blur(10px);
               -webkit-backdrop-filter: blur(10px);
            }
            :global(.dark) .glass-panel {
               background: rgba(31, 41, 55, 0.6);
            }
            .custom-scrollbar::-webkit-scrollbar {
               width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
               background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
               background: #cbd5e1;
               border-radius: 3px;
            }
            :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
               background: #4b5563;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
               background: #94a3b8;
            }
            :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
               background: #6b7280;
            }
         `}</style>
      </div>
   );
}
