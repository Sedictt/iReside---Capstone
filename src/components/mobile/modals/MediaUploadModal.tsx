"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Camera, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import styles from "./MediaUploadModal.module.css";

// ─── Types ─────────────────────────────────────────────────
type PostCategory = "announcement" | "notice" | "update" | "general";

interface MediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (post: any) => void;
}

const CATEGORIES: Array<{ key: PostCategory; label: string }> = [
    { key: "announcement", label: "Announcement" },
    { key: "notice",       label: "Notice" },
    { key: "update",       label: "Update" },
    { key: "general",      label: "General" },
];

// ─── Component ──────────────────────────────────────────────
export default function MediaUploadModal({ isOpen, onClose, onSuccess }: MediaUploadModalProps) {
    const [text, setText] = useState("");
    const [category, setCategory] = useState<PostCategory>("general");
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setText("");
            setCategory("general");
            setImages([]);
            setUploading(false);
            setProgress(0);
            setIsComplete(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Simulate reading file and getting data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setImages((prev) => [...prev, event.target!.result as string]);
            }
        };

        if (files[0]) {
            reader.readAsDataURL(files[0]);
        }
        
        // Reset input so same file can be picked again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePost = () => {
        if (!text.trim()) return;

        setUploading(true);
        
        // Simulate upload progress
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 20;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setIsComplete(true);
                
                // Finalize after a short delay
                setTimeout(() => {
                    onSuccess({
                        text,
                        category,
                        hasImages: images.length > 0,
                        timestamp: "Just now"
                    });
                    onClose();
                }, 1000);
            }
            setProgress(p);
        }, 150);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.headerTitle}>Create New Post</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {!isComplete ? (
                    <>
                        {/* Categories */}
                        <div className={styles.categoryRow}>
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.key}
                                    className={`${styles.categoryPill} ${category === c.key ? styles.categoryPillActive : ""}`}
                                    onClick={() => setCategory(c.key)}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {/* Text Area */}
                        <div className={styles.inputArea}>
                            <textarea
                                className={styles.textArea}
                                placeholder="What's happening in the community?"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={uploading}
                            />
                        </div>

                        {/* Media Grid */}
                        <div className={styles.mediaGrid}>
                            {images.map((img, idx) => (
                                <div key={idx} className={styles.mediaItem}>
                                    <img src={img} alt="preview" className={styles.mediaPreview} />
                                    <button className={styles.removeMedia} onClick={() => removeImage(idx)} disabled={uploading}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            
                            {images.length < 3 && !uploading && (
                                <button className={styles.addMedia} onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon size={20} />
                                    <span>Add Photo</span>
                                </button>
                            )}
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: "none" }} 
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Upload Progress */}
                        {uploading && (
                            <div className={styles.progressContainer}>
                                <div className={styles.progressLabel}>
                                    Posting to Community... {Math.round(progress)}%
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className={styles.footer}>
                            <button 
                                className={styles.postBtn} 
                                onClick={handlePost}
                                disabled={!text.trim() || uploading}
                            >
                                {uploading ? "Publishing..." : "Post to Hub"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={64} color="#6d9838" />
                        </div>
                        <h3 className={styles.successTitle}>Post Published!</h3>
                        <p className={styles.successDesc}>Your update has been shared with the community.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


