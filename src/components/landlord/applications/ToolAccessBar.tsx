import { useEffect, useMemo, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
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
  UserPlus,
  Trash2,
  VolumeX,
  Car,
  Lock,
  DollarSign,
  Wrench,
  PartyPopper,
  Waves,
  Dumbbell,
  Wifi,
  WashingMachine,
  Camera,
  Leaf,
  ArrowUpCircle,
  DoorOpen,
  Cloud,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database";

type ToolAccessBarProps = {
  propertyId?: string | null;
  className?: string;
  variant?: "default" | "icons";
  direction?: "horizontal" | "vertical";
};

const tools = [
  {
    key: "templates",
    label: "Lease Agreement",
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

export function ToolAccessBar({ propertyId, className, variant = "default", direction = "horizontal" }: ToolAccessBarProps) {
  const disabled = !propertyId;
  const [activeTool, setActiveTool] = useState<(typeof tools)[number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<{
    id: string;
    name: string;
    type: string;
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
          type: (payload.property as Record<string, unknown>).type as string ?? "apartment",
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
            className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/95 px-8 py-6 shadow-sm backdrop-blur-md"
          >
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Loading property data...</span>
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
            <div className="size-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="size-7 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-300 tracking-tight">Unable to Load Tools</p>
              <p className="text-sm font-medium text-red-200/80 mt-2">{loadError}</p>
            </div>
          </motion.div>
        </div>
      );
    }

    if (!propertyData) return null;

    if (activeTool.key === "amenities") {
      const getAmenityIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("pool") || n.includes("swim")) return { icon: Waves, color: "text-blue-400", bg: "bg-blue-500/10" };
        if (n.includes("gym") || n.includes("fitness")) return { icon: Dumbbell, color: "text-purple-400", bg: "bg-purple-500/10" };
        if (n.includes("wifi") || n.includes("internet")) return { icon: Wifi, color: "text-emerald-400", bg: "bg-emerald-500/10" };
        if (n.includes("parking")) return { icon: Car, color: "text-zinc-400", bg: "bg-zinc-500/10" };
        if (n.includes("laundry")) return { icon: WashingMachine, color: "text-cyan-400", bg: "bg-cyan-500/10" };
        if (n.includes("security")) return { icon: ShieldCheck, color: "text-orange-400", bg: "bg-orange-500/10" };
        if (n.includes("cctv") || n.includes("camera")) return { icon: Camera, color: "text-red-400", bg: "bg-red-500/10" };
        if (n.includes("garden") || n.includes("park") || n.includes("leaf")) return { icon: Leaf, color: "text-green-400", bg: "bg-green-500/10" };
        if (n.includes("elevator") || n.includes("lift")) return { icon: ArrowUpCircle, color: "text-indigo-400", bg: "bg-indigo-500/10" };
        if (n.includes("lobby") || n.includes("front")) return { icon: DoorOpen, color: "text-amber-400", bg: "bg-amber-500/10" };
        if (n.includes("roof") || n.includes("deck")) return { icon: Cloud, color: "text-blue-400", bg: "bg-blue-500/10" };
        if (n.includes("kitchen") || n.includes("dining")) return { icon: Utensils, color: "text-rose-400", bg: "bg-rose-500/10" };
        return { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" };
      };

      return (
        <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
          {propertyData.amenities.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/20 p-20 text-center">
              <Sparkles className="mx-auto size-10 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-bold tracking-tight text-muted-foreground/50">No amenities configured for this property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyData.amenities.map((item, idx) => {
                const { icon: AmenityIcon, color, bg } = getAmenityIcon(item);
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    key={item} 
                    className="group flex items-center gap-5 rounded-2xl border border-border/40 bg-card/15 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/40"
                  >
                    <div className={cn(
                      "size-12 shrink-0 rounded-xl flex items-center justify-center border border-border/50 shadow-inner transition-all duration-500 group-hover:scale-110",
                      bg
                    )}>
                      <AmenityIcon className={cn("size-6", color)} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-semibold tracking-tight text-foreground/90 leading-tight">{item}</span>
                        <div className="flex items-center gap-1.5">
                            <div className="size-1 rounded-full bg-primary/50" />
                            <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/50">Verified Facility</span>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTool.key === "policies") {
      return (
        <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
          {propertyData.house_rules.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/20 p-20 text-center">
              <ShieldCheck className="mx-auto size-10 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-bold tracking-tight text-muted-foreground/50">No property policies configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-w-5xl">
              {propertyData.house_rules.map((rule, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", damping: 25 }}
                  key={rule} 
                  className="group relative rounded-2xl border border-border/40 bg-card/15 p-5 transition-all duration-300 hover:bg-card/30 hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-6">
                        <div className="shrink-0 flex flex-col items-center gap-1 min-w-[50px]">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Clause</span>
                            <span className="text-xl font-semibold italic text-blue-500/60 leading-none">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <div className="flex-1">
                            <p className="text-[15px] font-bold leading-relaxed text-foreground/90 tracking-tight">{rule}</p>
                        </div>
                        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <span className="text-[8px] font-semibold uppercase tracking-widest text-blue-400">Binding</span>
                        </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const template = propertyData.contract_template;
    // ── Dynamic contract preview helpers ──────────────────────────────────────
    const propType = (propertyData.type ?? "apartment") as "apartment" | "dormitory" | "boarding_house";

    const CONTRACT_TITLE_MAP: Record<string, string> = {
      dormitory: "Dormitory Student Agreement",
      boarding_house: "Boarding House Residence Policy",
      apartment: "Residential Lease Agreement",
    };
    const contractTitle = CONTRACT_TITLE_MAP[propType] ?? "Residential Lease Agreement";

    const buildUtilityText = (
      pt: string,
      split: string,
      fixedAmt?: string
    ): string => {
      if (pt === "dormitory") {
        return "Utility charges (water and electricity) are shared equally among all bedspace occupants based on head count for the billing period.";
      }
      if (pt === "boarding_house") {
        if (split === "equal_per_head") {
          return "Utility charges are divided equally among all occupants in the boarding house based on total head count for the billing period.";
        }
        if (split === "fixed_charge") {
          const amt = fixedAmt ? `₱${Number(fixedAmt).toLocaleString()}` : "₱500";
          return `Each occupant is charged a fixed monthly utility fee of ${amt} to cover shared water and electricity costs.`;
        }
        return "Each room is equipped with individual meters. Tenants are responsible for paying their own metered utility consumption directly.";
      }
      return "Utilities (water and electricity) are individually metered per unit. Each tenant is solely responsible for their own consumption and related charges.";
    };

    return (
      <div className="h-full overflow-y-auto p-6 sm:p-10 lg:p-14 relative z-10 custom-scrollbar">
        {!template ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-12 text-center text-sm font-bold tracking-tight text-muted-foreground">
            No lease agreement configured yet.
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
                    <h1 className="text-[12rem] font-semibold rotate-[-45deg] select-none text-black tracking-tighter uppercase">Agreement</h1>
                </div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2 border-b-2 border-neutral-300 pb-8 mb-8">
                        <h1 className="text-[1.35rem] font-semibold uppercase tracking-widest text-black">{contractTitle}</h1>
                        <p className="text-neutral-500 italic text-sm">This is the configured lease agreement for {propertyData.name}.</p>
                    </div>

                    <div className="space-y-8 text-[15px] leading-relaxed text-neutral-800">
                        {(() => {
                            const parsed = template as unknown as {
                                answers?: Record<string, string | string[]>;
                                customClauses?: { title?: string; description?: string }[];
                            };
                            const answers = parsed?.answers || {};
                            const customClauses = parsed?.customClauses || [];
                            const splitMethod = (answers.utility_split_method as string) ?? "individual_meter";
                            const fixedAmt = answers.utility_fixed_charge_amount as string | undefined;
                            const utilityText = buildUtilityText(propType, splitMethod, fixedAmt);

                            return (
                                <>
                                    <div className="space-y-5">
                                        <p>
                                            <strong className="text-black">1. LEASE TERM:</strong> The duration of this lease is <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["duration"] || "Not Specified"}</span>. The tenant agrees to rent the premises for this agreed upon period.
                                        </p>

                                        <p>
                                            <strong className="text-black">2. RENT &amp; DEPOSIT:</strong> The tenant agrees to pay a monthly base rent of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["rent"] || "_____"}</span></strong>. A security deposit of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["deposit"] || "_____"}</span></strong> is required prior to move-in.
                                        </p>

                                        <p>
                                            <strong className="text-black">3. OCCUPANCY LIMIT:</strong> This property enforces a hard occupancy limit of <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold">{answers["hard_occupancy_limit"] || "_____"}</span> person(s) per unit.
                                        </p>

                                        <p>
                                            <strong className="text-black">4. UTILITIES:</strong> {utilityText} The landlord additionally covers: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{Array.isArray(answers["utilities"]) && answers["utilities"].length > 0 ? answers["utilities"].join(", ") : "None Included"}</span>.
                                        </p>

                                        <p>
                                            <strong className="text-black">5. PROPERTY POLICIES:</strong> The premises adheres to the following pet policy: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["pets"] || "Not Specified"}</span>. Furthermore, it is strictly understood that: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["smoking"] || "Not Specified"}</span> within or strictly on the premises.
                                        </p>
                                    </div>

                                    {/* Inject Custom Clauses here */}
                                    {customClauses.filter(c => c.title && c.description).length > 0 && (
                                        <div className="pt-6 mt-6 border-t border-neutral-200 space-y-4">
                                            <h3 className="font-semibold text-black uppercase tracking-wider text-sm mb-4">Additional Clauses</h3>
                                            {customClauses.filter(c => c.title && c.description).map((clause, idx) => (
                                                <p key={idx}>
                                                    <strong className="text-black uppercase">{(idx + 6)}. {clause.title}:</strong> {clause.description}
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

  if (variant === "icons") {
    return (
      <>
        <div className={cn(
          "flex items-center gap-2",
          direction === "vertical" ? "flex-col" : "flex-row",
          className
        )}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                className={cn(
                  "group relative flex size-10 items-center justify-center rounded-xl border border-border/50 backdrop-blur-xl transition-all duration-300",
                  disabled
                    ? "cursor-not-allowed bg-muted/20 text-muted-foreground opacity-50"
                    : "cursor-pointer bg-card/60 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-lg active:scale-95"
                )}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (disabled) return;
                  setActiveTool(tool);
                }}
              >
                <Icon className={cn("size-4.5", !disabled && "text-muted-foreground group-hover:text-primary transition-colors")} />
                
                {/* Custom Tooltip - adjusted for vertical/horizontal visibility */}
                <div className={cn(
                  "pointer-events-none absolute select-none whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-popover-foreground opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 z-50",
                  direction === "vertical" 
                    ? "right-full mr-3 top-1/2 -translate-y-1/2 group-hover:-translate-x-1" 
                    : "-top-10 left-1/2 -translate-x-1/2 translate-y-2 group-hover:-translate-y-1"
                )}>
                  {tool.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal uses same AnimatePresence block down below */}
        {renderModal()}
      </>
    );
  }

  // The modal component block extracted so both variants can use it
  function renderModal() {
    return (
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
              className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-xl"
              onClick={() => setActiveTool(null)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 150 }}
              className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card/98 shadow-[0_0_80px_rgba(15,23,42,0.16)] backdrop-blur-[60px]"
            >
              <Noise />

              <div className="relative z-20 flex h-24 shrink-0 items-center justify-between border-b border-border bg-card/92 px-6 backdrop-blur-md sm:px-10">
                <div className="flex items-center gap-5 min-w-0">
                  <div className={cn("size-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border shadow-inner", TOOL_ACCENTS[activeTool.key].iconBorder, TOOL_ACCENTS[activeTool.key].iconBg)}>
                    {activeTool.key === "templates" && <FileText className="size-6 text-violet-300" />}
                    {activeTool.key === "policies" && <ClipboardList className="size-6 text-blue-300" />}
                    {activeTool.key === "amenities" && <Sparkles className="size-6 text-emerald-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.25em] opacity-80 mb-1">Property Configuration</p>
                    <p className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{activeTool.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 shadow-inner md:flex">
                    <Building2 className="size-4.5 text-muted-foreground" />
                    <span className="max-w-[200px] truncate text-xs font-bold text-foreground">{propertyData?.name ?? "Loading..."}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTool(null)}
                    className="group flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-lg transition-all hover:scale-110 hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <X className="size-5 group-hover:rotate-90 transition-transform duration-300" />
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
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative mb-6 w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-border bg-card/95 p-2.5 shadow-sm backdrop-blur-2xl",
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
                  "group inline-flex flex-1 sm:flex-none justify-center items-center gap-3 rounded-[1.1rem] border px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap",
                  disabled
                    ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground"
                    : "cursor-pointer border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted active:translate-y-0"
                )}
                title={disabled ? "Select a unit first to open tools" : `Open ${tool.label} modal`}
              >
                <Icon className={cn("size-4.5", !disabled && "text-primary/70 group-hover:text-primary group-hover:scale-110 transition-transform")} />
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderModal()}
    </>
  );
}

