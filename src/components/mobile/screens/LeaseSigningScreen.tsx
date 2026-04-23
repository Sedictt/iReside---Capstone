"use client";

import { useState, useRef, useEffect } from "react";
import { 
    ChevronLeft, 
    X, 
    CheckCircle2, 
    ShieldCheck, 
    Clock, 
    RotateCcw,
    FileCheck
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LeaseSigningScreen.module.css";

// ─── Signature Pad Component ───────────────────────────────
function SignaturePad({ 
    onDraw 
}: { 
    onDraw: (isEmpty: boolean) => void 
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            // Get correct pixel ratio for sharp lines
            const ratio = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            
            const context = canvas.getContext("2d");
            if (context) {
                context.scale(ratio, ratio);
                context.lineCap = "round";
                context.lineWidth = 2.5;
                context.strokeStyle = "#fafafa";
                setCtx(context);
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!ctx) return;
        setIsDrawing(true);
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        onDraw(false); // Not empty anymore
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clear = () => {
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        onDraw(true);
    };

    return (
        <div className={styles.signatureSection}>
            <div className={styles.signatureLabel}>Digital Signature</div>
            <div className={styles.canvasContainer}>
                <div className={styles.canvasHint}>Sign here</div>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className={styles.signatureActions}>
                <button className={styles.clearBtn} onClick={clear}>
                    <RotateCcw size={14} />
                    Clear Pad
                </button>
            </div>
        </div>
    );
}

// ─── Main Screen ───────────────────────────────────────────
export default function LeaseSigningScreen() {
    const { goBack, screenParams } = useNavigation();
    const [isSigned, setIsSigned] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Mock data based on params or fallback
    const leaseId = screenParams.leaseId || "lease3";
    
    const handleSign = () => {
        setSubmitting(true);
        // Simulate backend processing
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);
        }, 2000);
    };

    const handleBack = () => {
        if (success) {
            goBack();
        } else {
            goBack();
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={handleBack}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Sign Agreement</h1>
            </div>

            {/* Content */}
            <div className={styles.scrollArea}>
                <h2 className={styles.stepTitle}>Finalize Lease</h2>
                <p className={styles.stepSub}>Please review the summary below and provide your digital signature.</p>

                {/* Document Preview */}
                <div className={styles.docPreview}>
                    <div className={styles.docLine}>
                        <span className={styles.docLabel}>Property</span>
                        <span className={styles.docValue}>Metro Studio B</span>
                    </div>
                    <div className={styles.docLine}>
                        <span className={styles.docLabel}>Unit</span>
                        <span className={styles.docValue}>Unit 205</span>
                    </div>
                    <div className={styles.docLine}>
                        <span className={styles.docLabel}>Start Date</span>
                        <span className={styles.docValue}>May 1, 2026</span>
                    </div>
                    <div className={styles.docLine}>
                        <span className={styles.docLabel}>Monthly Rent</span>
                        <span className={styles.docValue}>₱18,500</span>
                    </div>
                    <div className={styles.docLine}>
                        <span className={styles.docLabel}>Security Deposit</span>
                        <span className={styles.docValue}>₱37,000</span>
                    </div>
                </div>

                {/* Signature Pad */}
                <SignaturePad onDraw={(isEmpty) => setIsSigned(!isEmpty)} />

                <div style={{ marginTop: "32px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <ShieldCheck size={18} color="#6d9838" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <p style={{ fontSize: "12px", color: "#737373", lineHeight: "1.4" }}>
                        By signing, you agree to the Terms of Service and confirm that all information provided is accurate and legally binding.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <button 
                    className={`${styles.submitBtn} ${(!isSigned || submitting) ? styles.submitBtnDisabled : ""}`}
                    onClick={handleSign}
                    disabled={!isSigned || submitting}
                >
                    {submitting ? (
                        <>
                            <Clock size={20} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <FileCheck size={20} />
                            Complete Signing
                        </>
                    )}
                </button>
            </div>

            {/* Success State Overlay */}
            {success && (
                <div className={styles.successOverlay}>
                    <div className={styles.successIcon}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className={styles.successTitle}>Lease signed!</h3>
                    <p className={styles.successSub}>
                        Congratulations! Your lease is now legally binding. You can find the signed document in your dashboard.
                    </p>
                    <button 
                        className={styles.submitBtn} 
                        style={{ marginTop: "32px" }}
                        onClick={goBack}
                    >
                        Back to Leases
                    </button>
                </div>
            )}
        </div>
    );
}
