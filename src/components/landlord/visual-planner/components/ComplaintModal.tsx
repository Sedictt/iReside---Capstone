import React, { useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Unit } from "../types";

interface ComplaintModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
    isDark: boolean;
}

export const ComplaintModal = ({
    isOpen,
    onClose,
    unit,
    isDark
}: ComplaintModalProps) => {
    const [complaintType, setComplaintType] = useState<string>("");
    const [customComplaint, setCustomComplaint] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!unit) return null;

    const predefinedComplaints = [
        "Noise Complain",
        "Bad odor",
        "Waste Complain",
        "Maintenance Issue",
        "Unauthorized Occupant",
        "Please specify"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Mock submission
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setComplaintType("");
                setCustomComplaint("");
                setAttachment(null);
            }, 2000);
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg flex flex-col rounded-[2.5rem] border border-border bg-card shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden`}
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground">
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                    <span className="material-icons-round text-3xl">report_problem</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                        Report an Issue
                                    </h2>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Unit {unit.name}</p>
                                </div>
                            </div>

                            {isSuccess ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                >
                                    <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                        <span className="material-icons-round text-5xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Complaint Submitted</h3>
                                    <p className="text-muted-foreground">Your report for Unit {unit.name} has been received. We'll look into it right away.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Type of Issue</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {predefinedComplaints.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setComplaintType(type)}
                                                    className={`px-4 py-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                        complaintType === type 
                                                            ? 'border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                                                            : 'border-border bg-muted/30 text-muted-foreground hover:border-neutral-400'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {complaintType === "Please specify" && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3"
                                        >
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Details</label>
                                            <textarea
                                                required
                                                value={customComplaint}
                                                onChange={(e) => setCustomComplaint(e.target.value)}
                                                placeholder="Please describe the issue in detail..."
                                                className="w-full min-h-[120px] rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                            />
                                        </motion.div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Evidence / Photos</label>
                                        <div 
                                            className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center gap-3 ${
                                                attachment ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                            }`}
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                        >
                                            <input 
                                                id="photo-upload"
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                            />
                                            {attachment ? (
                                                <>
                                                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                                        <span className="material-icons-round text-2xl">image</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-foreground">{attachment.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                            {(attachment.size / 1024 / 1024).toFixed(2)} MB &bull; Click to change
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <span className="material-icons-round text-2xl">add_a_photo</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-foreground">Upload Evidence</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">JPG, PNG up to 10MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !complaintType}
                                        className="w-full py-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-icons-round animate-spin">refresh</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Submit Complaint
                                                <span className="material-icons-round">send</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                        <div className="h-4 bg-rose-500/10 w-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
