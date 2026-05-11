"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { m as motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Maximize2, Download } from "lucide-react"

interface CommunityPhotoLightboxProps {
    photos: { id: string; url: string }[]
    initialIndex: number
    onClose: () => void
}

export function CommunityPhotoLightbox({ photos, initialIndex, onClose }: CommunityPhotoLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") handlePrev()
            if (e.key === "ArrowRight") handleNext()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentIndex])

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % photos.length)
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
            {/* Header / Actions */}
            <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10">
                <div className="text-white/70 text-sm font-bold bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    {currentIndex + 1} / {photos.length}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.open(photos[currentIndex].url, '_blank')}
                        className="p-2.5 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                        title="Download"
                    >
                        <Download className="size-5" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                        title="Close"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>

            {/* Main Carousel */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-4 md:px-20">
                <div className="relative max-h-full w-full flex items-center justify-center">
                    <img 
                        src={photos[currentIndex].url} 
                        alt={`Photo ${currentIndex + 1}`}
                        className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain ring-1 ring-white/10"
                    />
                </div>
                {photos.length > 1 && (
                    <>
                        <button 
                            onClick={handlePrev}
                            className="absolute left-6 md:left-12 p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronLeft className="size-8 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="absolute right-6 md:right-12 p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronRight className="size-8 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails Footer */}
            {photos.length > 1 && (
                <div className="w-full bg-black/40 backdrop-blur-xl border-t border-white/5 p-6 flex justify-center gap-3 overflow-x-auto custom-scrollbar">
                    {photos.map((photo, index) => (
                        <button
                            key={photo.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`relative w-20 h-14 rounded-lg overflow-hidden transition-all duration-300 border-2 shrink-0 ${
                                index === currentIndex 
                                ? 'border-primary scale-110 shadow-lg shadow-primary/20' 
                                : 'border-transparent opacity-40 hover:opacity-80'
                            }`}
                        >
                            <Image src={photo.url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

