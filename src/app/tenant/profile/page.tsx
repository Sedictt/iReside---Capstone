"use client";

import { useState, useRef, ChangeEvent, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import {
    ArrowRight,
    Camera,
    X,
    ZoomIn,
    RotateCw,
    Check
} from 'lucide-react';
import { TenantNavbar } from '@/components/tenant/TenantNavbar';

export default function TenantProfilePage() {
    const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setTempImage(imageUrl);
            setIsCropModalOpen(true);
            setZoom(1);
            setRotation(0);
            setCrop({ x: 0, y: 0 });
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new window.Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0
    ): Promise<string | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        // set each dimensions to double largest dimension to allow for a safe area for the
        // image to rotate in without being clipped by canvas context
        canvas.width = safeArea;
        canvas.height = safeArea;

        // translate canvas context to a central location on image to allow rotating around the center.
        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        // draw rotated image and store data.
        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        // set canvas width to final desired crop size - this will clear existing context
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // paste generated rotate image with correct offsets for x,y crop values.
        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        // As Base64 string
        return canvas.toDataURL('image/jpeg');
    };

    const handleSaveCroppedImage = async () => {
        if (tempImage && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels, rotation);
                if (croppedImage) {
                    setProfileImage(croppedImage);
                    setIsCropModalOpen(false);
                    setTempImage(null);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCancelCrop = () => {
        setIsCropModalOpen(false);
        setTempImage(null);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 relative">

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=2600&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover opacity-[0.10]"
                    priority
                />
            </div>

            <div className="relative z-10">

                <TenantNavbar />

                <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">

                    {/* Hero Section with User Profile */}
                    <section className="relative w-full min-h-[500px] rounded-3xl overflow-hidden border border-border/50 shadow-2xl group">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src="https://images.unsplash.com/photo-1512918580421-b2feee3b85a6?q=80&w=2000&auto=format&fit=crop"
                                alt="Penthouse"
                                fill
                                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[20s]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
                            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
                        </div>

                        <div className="relative h-full flex flex-col justify-between p-8 md:p-12 z-10">

                            {/* User Profile - Repositioned to Top */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 group/avatar cursor-pointer">
                                        <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
                                        <div className="absolute inset-1 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl group-hover/avatar:border-white transition-colors">
                                            <Image
                                                src={profileImage}
                                                alt="Alex Thompson"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <button
                                            onClick={triggerFileInput}
                                            className="absolute bottom-1 right-1 h-7 w-7 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg z-20 group-hover/avatar:scale-110"
                                        >
                                            <Camera className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-display text-white mb-1 drop-shadow-lg">Alex Thompson</h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                                            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2 py-1 rounded backdrop-blur-sm border border-white/10">ID : IR-992034</span>
                                            <div className="flex items-center gap-1.5 opacity-90">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="text-[10px] font-bold tracking-widest uppercase">Verified Member</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <div className="flex flex-col md:items-end gap-1 text-sm text-white/90 font-medium">
                                        <a href="mailto:alex.t@example.com" className="hover:text-primary transition-colors hover:underline decoration-primary/50 underline-offset-4">alex.t@example.com</a>
                                        <a href="tel:+155501234567" className="hover:text-primary transition-colors">+1 555 0123 4567</a>
                                        <div className="flex flex-col md:items-end text-xs text-rose-300/90 mt-2 pt-2 border-t border-white/10 w-full">
                                            <span className="uppercase tracking-wider font-bold text-[10px] opacity-80 mb-0.5">Emergency Contact</span>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>Sarah Thompson</span>
                                                <span className="w-1 h-1 rounded-full bg-rose-300/40"></span>
                                                <a href="tel:+19876543210" className="hover:text-rose-100 transition-colors underline decoration-rose-300/30 underline-offset-2">+1 987 654 3210</a>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href="/tenant/settings"
                                        className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>

                            {/* Active Residency Info (Bottom) */}
                            <div>
                                <div className="mb-8">
                                    <h1 className="text-5xl md:text-7xl font-display text-white mb-2 leading-tight drop-shadow-xl">
                                        Skyline Loft
                                    </h1>
                                    <p className="text-2xl md:text-3xl text-white/80 italic font-light drop-shadow-lg">
                                        Unit 402, Towers
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 border-t border-white/10 pt-6 backdrop-blur-[2px] bg-black/5 rounded-xl p-4 -mx-4 md:mx-0">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-1">Lease Period</p>
                                        <p className="text-white font-medium">Jan 24 — Jan 25</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-1">Monthly Rent</p>
                                        <p className="text-white font-medium">₱2,450.00 <span className="text-white/50 text-sm font-normal">/ mo</span></p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-1">Days Remaining</p>
                                        <p className="text-white font-medium italic">182 Days</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>


                    {/* Journey History & Other Content */}
                    <div className="space-y-16">

                        {/* Journey History */}
                        <section>
                            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-border pb-4 gap-4">
                                <h3 className="text-4xl font-display text-foreground">Journey History</h3>
                                <a href="#" className="text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground uppercase transition-colors flex items-center gap-2">
                                    Archive of residencies <ArrowRight className="h-3 w-3" />
                                </a>
                            </div>

                            <div className="relative">
                                {/* Horizontal Scroll Container */}
                                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-thin px-4 scroll-smooth">

                                    {/* Card 1 */}
                                    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 duration-300 min-w-[340px] max-w-[380px] flex-shrink-0 snap-start">
                                        <div className="relative h-56 w-full overflow-hidden">
                                            <Image
                                                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"
                                                alt="The Kensington"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-background/90 backdrop-blur-md text-foreground border border-border/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                                    2022 - 2023
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h4 className="text-2xl font-display text-foreground mb-1">The Kensington #310</h4>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                                    Los Angeles, CA
                                                </p>
                                            </div>
                                            <div className="flex items-end justify-between pt-4 border-t border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">Rent</span>
                                                    <span className="text-lg font-medium text-foreground">₱2,100 <span className="text-sm text-muted-foreground font-normal">/ mo</span></span>
                                                </div>
                                                <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold tracking-wide transition-all uppercase">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2 */}
                                    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 duration-300 min-w-[340px] max-w-[380px] flex-shrink-0 snap-start">
                                        <div className="relative h-56 w-full overflow-hidden">
                                            <Image
                                                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
                                                alt="Sunset Lofts"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-background/90 backdrop-blur-md text-foreground border border-border/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                                    2021 - 2022
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h4 className="text-2xl font-display text-foreground mb-1">Sunset Lofts #12</h4>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                                    Santa Monica, CA
                                                </p>
                                            </div>
                                            <div className="flex items-end justify-between pt-4 border-t border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">Rent</span>
                                                    <span className="text-lg font-medium text-foreground">₱1,850 <span className="text-sm text-muted-foreground font-normal">/ mo</span></span>
                                                </div>
                                                <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold tracking-wide transition-all uppercase">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3 */}
                                    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 duration-300 min-w-[340px] max-w-[380px] flex-shrink-0 snap-start">
                                        <div className="relative h-56 w-full overflow-hidden">
                                            <Image
                                                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"
                                                alt="Marina Heights"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-background/90 backdrop-blur-md text-foreground border border-border/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                                    2020 - 2021
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h4 className="text-2xl font-display text-foreground mb-1">Marina Heights #7B</h4>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                                    Venice, CA
                                                </p>
                                            </div>
                                            <div className="flex items-end justify-between pt-4 border-t border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">Rent</span>
                                                    <span className="text-lg font-medium text-foreground">₱1,600 <span className="text-sm text-muted-foreground font-normal">/ mo</span></span>
                                                </div>
                                                <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold tracking-wide transition-all uppercase">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </section>

                    </div>

                </main>

                <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
        .shadow-custom-primary {
          box-shadow: 0 0 10px rgba(109, 152, 56, 0.5);
        }
        /* Slider Styling */
        input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
        }
      `}</style>

                {/* Crop Modal */}
                {isCropModalOpen && tempImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] z-10">
                                <h3 className="text-lg font-display text-white">Edit Profile Photo</h3>
                                <button
                                    onClick={handleCancelCrop}
                                    className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative w-full h-80 bg-[#121212]">
                                <Cropper
                                    image={tempImage}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>

                            <div className="p-6 space-y-6 bg-[#1a1a1a]">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <ZoomIn className="h-4 w-4 text-white/60" />
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="flex-1 accent-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <RotateCw className="h-4 w-4 text-white/60" />
                                        <input
                                            type="range"
                                            value={rotation}
                                            min={0}
                                            max={360}
                                            step={1}
                                            aria-labelledby="Rotation"
                                            onChange={(e) => setRotation(Number(e.target.value))}
                                            className="flex-1 accent-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={handleCancelCrop}
                                        className="px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveCroppedImage}
                                        className="px-6 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors text-xs font-bold tracking-wide uppercase flex items-center gap-2"
                                    >
                                        <Check className="h-3 w-3" /> Save Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
