import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database";

type ToolAccessBarProps = {
  propertyId?: string | null;
  className?: string;
};

const tools = [
  {
    key: "templates",
    label: "Contract Templates",
    icon: FileText,
  },
  {
    key: "policies",
    label: "Property Policies",
    icon: ShieldCheck,
  },
  {
    key: "amenities",
    label: "Amenities",
    icon: Sparkles,
  },
] as const;

const TOOL_GLOWS: Record<(typeof tools)[number]["key"], { c1: string, c2: string }> = {
  templates: { c1: "bg-violet-500/20", c2: "bg-indigo-500/15" },
  policies: { c1: "bg-blue-500/20", c2: "bg-cyan-500/15" },
  amenities: { c1: "bg-emerald-500/20", c2: "bg-lime-500/15" },
};

const TOOL_ACCENTS: Record<(typeof tools)[number]["key"], { iconBg: string, iconBorder: string }> = {
  templates: { iconBg: "bg-violet-500/20", iconBorder: "border-violet-500/30" },
  policies: { iconBg: "bg-blue-500/20", iconBorder: "border-blue-500/30" },
  amenities: { iconBg: "bg-emerald-500/20", iconBorder: "border-emerald-500/30" },
};

const Noise = () => (
    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-soft-light" 
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2003/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
    />
);

const BackgroundGlow = ({ color1, color2 }: { color1: string, color2: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
            animate={{ 
                x: [0, 50, -50, 0], 
                y: [0, -30, 30, 0],
                scale: [1, 1.2, 0.8, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={cn("absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full", color1)}
        />
        <motion.div 
            animate={{ 
                x: [0, -40, 40, 0], 
                y: [0, 50, -50, 0],
                scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className={cn("absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full", color2)}
        />
    </div>
);

export function ToolAccessBar({ propertyId, className }: ToolAccessBarProps) {
  const disabled = !propertyId;
  const [activeTool, setActiveTool] = useState<(typeof tools)[number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<{
    id: string;
    name: string;
    amenities: string[];
    house_rules: string[];
    contract_template: Json | null;
  } | null>(null);

  useEffect(() => {
    if (!activeTool || !propertyId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`/api/landlord/properties/${propertyId}`);
        const payload = (await response.json()) as {
          property?: {
            id: string;
            name: string;
            amenities?: string[] | null;
            house_rules?: string[] | null;
            contract_template?: Json | null;
          };
          error?: string;
        };
        if (!response.ok || !payload.property) {
          throw new Error(payload.error || "Failed to load property data.");
        }

        if (cancelled) return;
        setPropertyData({
          id: payload.property.id,
          name: payload.property.name,
          amenities: Array.isArray(payload.property.amenities) ? payload.property.amenities : [],
          house_rules: Array.isArray(payload.property.house_rules) ? payload.property.house_rules : [],
          contract_template: payload.property.contract_template ?? null,
        });
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load property data.");
        setPropertyData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTool, propertyId]);

  const content = useMemo(() => {
    if (!activeTool) return null;

    if (loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md px-8 py-6 flex flex-col items-center gap-4 shadow-2xl"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-black uppercase tracking-widest text-neutral-300">Loading property data...</span>
          </motion.div>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="h-full flex flex-col items-center justify-center relative z-10 p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-md p-8 flex flex-col items-center gap-4 text-center shadow-2xl"
          >
            <div className="h-14 w-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-black text-red-300 tracking-tight">Unable to Load Tools</p>
              <p className="text-sm font-medium text-red-200/80 mt-2">{loadError}</p>
            </div>
          </motion.div>
        </div>
      );
    }

    if (!propertyData) return null;

    if (activeTool.key === "amenities") {
      return (
        <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
          <div className="mb-10 text-center sm:text-left">
            <h4 className="text-3xl font-black text-white tracking-tighter">Amenities</h4>
            <p className="text-xs font-bold tracking-[0.2em] text-neutral-400 mt-2 uppercase">Configuration for {propertyData.name}</p>
          </div>
          {propertyData.amenities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm font-bold tracking-tight text-neutral-400">
              No amenities configured for this property.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyData.amenities.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item} 
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center gap-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_30px_rgba(var(--emerald-rgb),0.2)] hover:-translate-y-1"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="font-bold text-white text-[15px] tracking-tight">{item}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTool.key === "policies") {
      return (
        <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
          <div className="mb-10 text-center sm:text-left">
            <h4 className="text-3xl font-black text-white tracking-tighter">Property Policies</h4>
            <p className="text-xs font-bold tracking-[0.2em] text-neutral-400 mt-2 uppercase">House Rules for {propertyData.name}</p>
          </div>
          {propertyData.house_rules.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm font-bold tracking-tight text-neutral-400">
              No property policies configured yet.
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl max-h-full">
              {propertyData.house_rules.map((rule, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={rule} 
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 flex items-start gap-5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_30px_rgba(var(--blue-rgb),0.2)] hover:scale-[1.01]"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-blue-300 font-black text-sm">{index + 1}</span>
                  </div>
                  <p className="text-base font-semibold text-neutral-200 leading-relaxed mt-1.5">{rule}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const template = propertyData.contract_template;
    return (
      <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
        <div className="mb-10 text-center sm:text-left">
          <h4 className="text-3xl font-black text-white tracking-tighter">Contract Template</h4>
          <p className="text-xs font-bold tracking-[0.2em] text-neutral-400 mt-2 uppercase">Terms for {propertyData.name}</p>
        </div>
        {!template ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm font-bold tracking-tight text-neutral-400">
            No contract template configured yet.
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="w-full bg-[#fdfdfd] text-black p-8 sm:p-14 font-serif min-h-[700px] relative cursor-text">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
                    <h1 className="text-[12rem] font-black rotate-[-45deg] select-none text-black tracking-tighter">TEMPLATE</h1>
                </div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2 border-b-2 border-neutral-300 pb-8 mb-8">
                        <h1 className="text-[1.35rem] font-bold uppercase tracking-widest text-black">Residential Lease Agreement</h1>
                        <p className="text-neutral-500 italic text-sm">This is the blueprint contract template for {propertyData.name}.</p>
                    </div>

                    <div className="space-y-8 text-[15px] leading-relaxed text-neutral-800">
                        {(() => {
                            const parsed = template as unknown as {
                                answers?: Record<string, string | string[]>;
                                customClauses?: { title?: string; description?: string }[];
                            };
                            const answers = parsed?.answers || {};
                            const customClauses = parsed?.customClauses || [];

                            return (
                                <>
                                    <div className="space-y-5">
                                        <p>
                                            <strong className="text-black">1. LEASE TERM:</strong> The duration of this lease is <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers['duration'] || 'Not Specified'}</span>. The tenant agrees to rent the premises for this agreed upon period.
                                        </p>

                                        <p>
                                            <strong className="text-black">2. RENT & DEPOSIT:</strong> The tenant agrees to pay a monthly base rent of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers['rent'] || '_____'}</span></strong>. A security deposit of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers['deposit'] || '_____'}</span></strong> is required prior to move-in.
                                        </p>

                                        <p>
                                            <strong className="text-black">3. UTILITIES:</strong> The landlord is responsible for paying the following utilities: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{Array.isArray(answers['utilities']) && answers['utilities'].length > 0 ? answers['utilities'].join(', ') : 'None Included'}</span>. All other utilities are the responsibility of the tenant.
                                        </p>

                                        <p>
                                            <strong className="text-black">4. PROPERTY POLICIES:</strong> The premises adheres to the following pet policy: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers['pets'] || 'Not Specified'}</span>. Furthermore, it is strictly understood that: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers['smoking'] || 'Not Specified'}</span> within or strictly on the premises.
                                        </p>
                                    </div>

                                    {/* Inject Custom Clauses here */}
                                    {customClauses.filter(c => c.title && c.description).length > 0 && (
                                        <div className="pt-6 mt-6 border-t border-neutral-200 space-y-4">
                                            <h3 className="font-bold text-black uppercase tracking-wider text-sm mb-4">Additional Clauses</h3>
                                            {customClauses.filter(c => c.title && c.description).map((clause, idx) => (
                                                <p key={idx}>
                                                    <strong className="text-black uppercase">{(idx + 5)}. {clause.title}:</strong> {clause.description}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <div className="pt-24 border-t border-neutral-200 grid grid-cols-2 gap-12 text-sm mt-24">
                            <div>
                                <div className="border-b border-black pb-1 mb-2"></div>
                                <p className="font-bold uppercase tracking-wider text-neutral-500">Landlord Signature</p>
                            </div>
                            <div>
                                <div className="border-b border-black pb-1 mb-2"></div>
                                <p className="font-bold uppercase tracking-wider text-neutral-500">Tenant Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }, [activeTool, loading, loadError, propertyData]);

  return (
    <>
      <div
        className={cn(
          "w-full max-w-5xl mx-auto mb-6 rounded-[1.5rem] border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-2.5 shadow-[0_15px_45px_rgba(0,0,0,0.45)] relative overflow-hidden",
          className
        )}
      >
        <Noise />
        <div className="relative z-10 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                aria-disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setActiveTool(tool);
                }}
                className={cn(
                  "group inline-flex flex-1 sm:flex-none justify-center items-center gap-3 rounded-[1.1rem] border px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap",
                  disabled
                    ? "border-white/5 bg-white/[0.02] text-neutral-600 cursor-not-allowed"
                    : "border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                )}
                title={disabled ? "Select a unit first to open tools" : `Open ${tool.label} modal`}
              >
                <Icon className={cn("h-4.5 w-4.5", !disabled && "text-primary/70 group-hover:text-primary group-hover:scale-110 transition-transform")} />
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {activeTool && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              type="button"
              aria-label="Close tool modal backdrop"
              className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-default"
              onClick={() => setActiveTool(null)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 150 }}
              className="relative z-10 w-full max-w-5xl h-[85vh] rounded-[2.5rem] border border-white/[0.12] bg-[#141414]/95 backdrop-blur-[60px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] flex flex-col"
            >
              <BackgroundGlow color1={TOOL_GLOWS[activeTool.key].c1} color2={TOOL_GLOWS[activeTool.key].c2} />
              <Noise />

              <div className="relative z-20 shrink-0 h-24 border-b border-white/[0.08] px-6 sm:px-10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
                <div className="flex items-center gap-5 min-w-0">
                  <div className={cn("h-14 w-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border shadow-inner", TOOL_ACCENTS[activeTool.key].iconBorder, TOOL_ACCENTS[activeTool.key].iconBg)}>
                    {activeTool.key === "templates" && <FileText className="h-6 w-6 text-violet-300" />}
                    {activeTool.key === "policies" && <ClipboardList className="h-6 w-6 text-blue-300" />}
                    {activeTool.key === "amenities" && <Sparkles className="h-6 w-6 text-emerald-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] opacity-80 mb-1">Property Configuration</p>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{activeTool.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 shadow-inner">
                    <Building2 className="h-4.5 w-4.5 text-white/50" />
                    <span className="text-xs font-bold text-white/80 max-w-[200px] truncate">{propertyData?.name ?? "Loading..."}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTool(null)}
                    className="h-12 w-12 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center hover:scale-110 active:scale-95 group shadow-lg"
                  >
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full relative z-20 overflow-hidden">
                {content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
