"use client";

import { useState, useRef, ChangeEvent, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import {
    Camera,
    X,
    ZoomIn,
    RotateCw,
    Check,
    User,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TenantProfilePage() {
    const [profileImage, setProfileImage] = useState<string | null>(null);
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
        e.target.value = '';
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!tempImage || !croppedAreaPixels) return;
        const canvas = document.createElement('canvas');
        const image = new Image();
        image.src = tempImage;
        await new Promise((resolve) => { image.onload = resolve; });
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );
            setProfileImage(canvas.toDataURL('image/jpeg'));
        }
        setIsCropModalOpen(false);
        setTempImage(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Profile</h1>
                <p className="text-slate-400">Manage your personal information and preferences.</p>
            </div>

            {/* Profile Photo Upload */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-neutral-500" />
                        )}
                    </div>
                    <button
                        onClick={triggerFileInput}
                        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary border-2 border-[#0a0a0a] flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                        <Camera className="h-4 w-4 text-white" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Your Profile</h2>
                    <p className="text-sm text-slate-400">Upload a profile photo (optional)</p>
                </div>
            </div>

            {/* Profile details - coming soon */}
            <div className="rounded-2xl bg-card/50 border border-border/50 p-8">
                <EmptyState
                    icon={User}
                    title="Profile details coming soon"
                    description="Your name, contact information, and preferences will be available here once your account is fully set up."
                />
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && tempImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 rounded-2xl p-6 w-full max-w-lg mx-4 border border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Crop Photo</h3>
                            <button onClick={() => { setIsCropModalOpen(false); setTempImage(null); }} className="text-neutral-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="relative h-80 w-full bg-neutral-800 rounded-xl overflow-hidden">
                            <Cropper
                                image={tempImage}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="text-neutral-400 hover:text-white p-2">
                                <ZoomIn className="h-5 w-5" />
                            </button>
                            <button onClick={() => setRotation(r => r + 90)} className="text-neutral-400 hover:text-white p-2">
                                <RotateCw className="h-5 w-5" />
                            </button>
                        </div>
                        <button
                            onClick={handleCropConfirm}
                            className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Check className="h-5 w-5" />
                            Save Photo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}