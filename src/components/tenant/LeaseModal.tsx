"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Download, Printer, FileText } from "lucide-react";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { cn } from "@/lib/utils";
import { LeaseData } from "@/types/lease";

interface LeaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leaseData: LeaseData;
}

export default function LeaseModal({ open, onOpenChange, leaseData }: LeaseModalProps) {

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" />
                <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-[92vh] w-[95vw] max-w-[1000px] rounded-[2rem] bg-card border border-border shadow-2xl focus:outline-none z-[70] flex flex-col overflow-hidden backdrop-blur-xl">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <Dialog.Title className="text-xl font-bold text-foreground">Lease Agreement</Dialog.Title>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">#{leaseData.id} • Active</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl transition-colors">
                                <Printer className="size-4" />
                                <span>Print</span>
                            </button>
                            <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                                <Download className="size-4" />
                                <span className="hidden sm:inline">Download PDF</span>
                            </button>
                            <div className="w-px h-6 bg-border mx-2" />
                            <Dialog.Close className="h-10 w-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <X className="size-5" />
                            </Dialog.Close>
                        </div>
                    </div>

                    {/* Content Area - Dark Container for the Light Document */}
                    <div className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-12 space-y-8 custom-scrollbar">
                        <div className="max-w-[850px] mx-auto shadow-2xl rounded-sm overflow-hidden">
                            <LeaseDocument {...leaseData} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-card/50 flex justify-center">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black">
                            End of Document • Securely stored and encrypted by iReside
                        </p>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>

            <style jsx global>{`
                /* From PropertyDetailModal logic */
                @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes overlayFadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes modalEnter {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes modalExit {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                }

                .modal-overlay { will-change: opacity; }
                .modal-content { will-change: transform, opacity; }

                [data-state="open"].modal-overlay { animation: overlayFadeIn 0.2s ease-out forwards; }
                [data-state="closed"].modal-overlay { animation: overlayFadeOut 0.15s ease-in forwards; }
                [data-state="open"].modal-content { animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                [data-state="closed"].modal-content { animation: modalExit 0.15s ease-in forwards; }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </Dialog.Root>
    );
}

