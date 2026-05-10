"use client";

import dynamic from 'next/dynamic';

const ConsultationDashboard = dynamic(() => import('./ConsultationDashboard'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center justify-center font-sans">
      <div className="relative mb-8">
        <div className="size-20 border-2 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 size-20 border-t-2 border-indigo-500 rounded-full animate-spin" />
      </div>
      <h2 className="text-2xl font-black tracking-tighter uppercase text-indigo-400">Loading Dashboard</h2>
    </div>
  )
});

export default function ConsultationToolPage() {
  return <ConsultationDashboard />;
}

