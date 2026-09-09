import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Download, Printer, FileText, Loader2 } from "lucide-react";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { exportLeaseDocumentElementToPdf } from "@/lib/lease-pdf";
import { cn } from "@/lib/utils";
import { LeaseData } from "@/types/lease";
import { toast } from "sonner";

interface LeaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leaseData: LeaseData;
}

export default function LeaseModal({ open, onOpenChange, leaseData }: LeaseModalProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleDownload = async () => {
        const el = document.getElementById("tenant-lease-modal-doc");
        if (!el) {
            toast.error("Document not ready for download");
            return;
        }
        setIsExporting(true);
        try {
            const pdfBlob = await exportLeaseDocumentElementToPdf(el, `Lease_Agreement_${leaseData.id}.pdf`);
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Lease_Agreement_${leaseData.id.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Lease Agreement downloaded");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to generate PDF download");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" />
                <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-[92vh] w-[95vw] max-w-[1000px] rounded-[2rem] focus:outline-none z-[70] flex flex-col overflow-hidden backdrop-blur-xl neumorphic-panel">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl flex items-center justify-center text-primary neumorphic-inset-card">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <Dialog.Title className="text-xl font-black text-foreground">Lease Agreement</Dialog.Title>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">#{leaseData.id} • Active</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => window.print()}
                                className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl transition-colors neumorphic-extruded"
                            >
                                <Printer className="size-4" />
                                <span>Print</span>
                            </button>
                            <button 
                                onClick={handleDownload}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all neumorphic-primary disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                                <span className="hidden sm:inline">{isExporting ? "Generating..." : "Download PDF"}</span>
                            </button>
                            <div className="w-px h-6 bg-border mx-2" />
                            <Dialog.Close className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors neumorphic-extruded">
                                <X className="size-5" />
                            </Dialog.Close>
                        </div>
                    </div>

                    {/* Content Area - Dark Container for the Light Document */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar neumorphic-inset">
                        <div className="max-w-3xl mx-auto shadow-xl rounded-xl overflow-hidden bg-white border border-zinc-200/70">
                            <LeaseDocument 
                                containerId="tenant-lease-modal-doc"
                                className="shadow-none border-none max-w-none p-8 sm:p-10"
                                {...leaseData} 
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 flex justify-center">
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


