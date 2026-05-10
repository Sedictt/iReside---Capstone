"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowLeft,
    Upload,
    X,
    Camera,
    Hammer,
    Zap,
    Droplets,
    Thermometer,
    Bug,
    LayoutGrid,
    ChevronRight,
    Loader2,
    Info,
    Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
    { id: "plumbing", label: "Plumbing", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "electrical", label: "Electrical", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { id: "hvac", label: "HVAC / Cooling", icon: Thermometer, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "appliances", label: "Appliances", icon: LayoutGrid, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "structural", label: "Structural", icon: Hammer, color: "text-neutral-500", bg: "bg-neutral-500/10" },
    { id: "pest", label: "Pest Control", icon: Bug, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "other", label: "Other / General", icon: Wrench, color: "text-cyan-500", bg: "bg-cyan-500/10" },
];
export default function NewMaintenanceRequest() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [fixItMyself, setFixItMyself] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + mediaFiles.length > 5) {
            setError("You can only upload up to 5 images.");
            return;
        }

        const newFiles = [...mediaFiles, ...files];
        setMediaFiles(newFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        const newFiles = [...mediaFiles];
        newFiles.splice(index, 1);
        setMediaFiles(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !category) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let imageUrls: string[] = [];

            // 1. Upload images if any
            if (mediaFiles.length > 0) {
                const formData = new FormData();
                mediaFiles.forEach(file => formData.append("files", file));

                const uploadRes = await fetch("/api/tenant/maintenance/media", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const data = await uploadRes.json();
                    throw new Error(data.error || "Failed to upload images.");
                }

                const uploadData = await uploadRes.json();
                imageUrls = uploadData.imageUrls;
            }

            // 2. Create the maintenance request
            const response = await fetch("/api/tenant/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    fixItMyself,
                    images: imageUrls,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit request.");
            }

            router.push("/tenant/dashboard?maintenance=success");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                    >
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                        <Wrench className="size-8 text-primary" />
                        New Maintenance Request
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Report an issue in your unit and we'll get it fixed as soon as possible.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Issue Details */}
                        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Info className="size-5 text-primary" />
                                Issue Details
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="maintenance-title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Title
                                    </label>
                                    <input
                                        id="maintenance-title"
                                        type="text"
                                        placeholder="e.g., Leaking faucet in the bathroom"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="maintenance-description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="maintenance-description"
                                        placeholder="Please provide more details about the issue..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category Selector */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                    Category
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
                                                category === cat.id
                                                    ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary"
                                                    : "bg-card border-border hover:border-primary/30"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-xl transition-colors", cat.bg, cat.color)}>
                                                <cat.icon className="size-5" />
                                            </div>
                                            <span className="text-xs font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Media Upload */}
                        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Camera className="size-5 text-primary" />
                                Photos (Optional)
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Adding photos helps us understand the issue better and bring the right tools.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                <AnimatePresence>
                                    {previews.map((preview, idx) => (
                                        <motion.div
                                            key={preview}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative aspect-square rounded-2xl overflow-hidden border border-border"
                                        >
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {mediaFiles.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Upload className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                                            Upload
                                        </span>
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium flex items-center gap-3"
                            >
                                <AlertTriangle className="size-5 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-4 rounded-2xl font-semibold uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Request
                                    <ChevronRight className="size-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Pro Tips */}
                    <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Clock className="size-5" />
                            <h3 className="font-semibold">What to expect?</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">1</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your landlord will be notified immediately of your request.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">2</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your landlord or a contractor will visit your unit if necessary, depending on the severity of the repair.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">3</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    You'll receive updates via messages and notifications on the progress.
                                </p>
                            </li>
                        </ul>
                    </div>

                    {/* Self-Repair Toggle */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                                    Self-Repair
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                    Request permission to fix this issue yourself (e.g., if you have the tools or it's a minor fix).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFixItMyself(!fixItMyself)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                    fixItMyself ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-800"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                        fixItMyself ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 text-red-500 mb-3">
                            <AlertTriangle className="size-5" />
                            <h3 className="font-semibold uppercase tracking-tight">Emergency Hotlines</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-4 uppercase font-bold tracking-wider">
                            For life-threatening emergencies, please contact the authorities immediately.
                        </p>
                        
                        <div className="space-y-6">
                            {[
                                { 
                                    label: "VCDRRMO (Disaster)", 
                                    numbers: ["(02) 8352-5000", "(02) 8292-1405", "0919-009-4045", "0917-881-1639"], 
                                    sub: "Disaster Risk Reduction Office" 
                                },
                                { 
                                    label: "Valenzuela Police", 
                                    numbers: ["(02) 8352-4000", "0906-419-7676", "0998-598-7868"], 
                                    sub: "Main Police Station" 
                                },
                                { 
                                    label: "City Fire Station", 
                                    numbers: ["(02) 8292-3519"], 
                                    sub: "Fire Department" 
                                },
                                { 
                                    label: "Emergency Hospital", 
                                    numbers: ["(02) 8352-6000"], 
                                    sub: "City Emergency Hospital" 
                                },
                                { 
                                    label: "Valenzuela Medical Center", 
                                    numbers: ["(02) 8294-6711"], 
                                    sub: "Tertiary Hospital" 
                                },
                            ].map((hotline) => (
                                <div key={hotline.label} className="group relative">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{hotline.label}</span>
                                        <div className="space-y-1.5">
                                            {hotline.numbers.map((num) => (
                                                <a 
                                                    key={num}
                                                    href={`tel:${num.replace(/[^0-9]/g, '')}`}
                                                    className="text-sm font-semibold text-foreground hover:text-red-500 transition-colors flex items-center justify-between group/num"
                                                >
                                                    {num}
                                                    <Phone className="size-3 opacity-0 group-hover/num:opacity-100 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tighter mt-1">{hotline.sub}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-red-500/10">
                            <p className="text-[9px] text-muted-foreground leading-tight italic">
                                * Landline numbers require (02) area code when calling from mobile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

