"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Unit } from "./VisualBuilder";

export function UnitListingWizard({
  isOpen,
  onClose,
  unit,
}: {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit;
}) {
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [advanceCost, setAdvanceCost] = useState(25000);
  const [photoSlots, setPhotoSlots] = useState([
    { id: '1', name: 'Bedroom', icon: 'bed' },
    { id: '2', name: 'Bathroom', icon: 'shower' },
    { id: '3', name: 'Kitchen', icon: 'kitchen' },
    { id: '4', name: 'Living Area', icon: 'weekend' },
  ]);
  const totalSteps = 4;
  const shouldReduceMotion = useReducedMotion();

  const modalTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0 }
        : { type: "tween" as const, ease: "easeOut" as const, duration: 0.16 },
    [shouldReduceMotion]
  );

  const stepTransition = useMemo(
    () => (shouldReduceMotion ? { duration: 0 } : { duration: 0.14 }),
    [shouldReduceMotion]
  );

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={stepTransition}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-[3px] p-4 will-change-[opacity]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={modalTransition}
            className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] will-change-transform transform-gpu"
          >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/80">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-icons-round text-primary">storefront</span>
                List Unit {unit.name || "Unit"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Configure your unit details and prepare it for tenant invitations.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex h-1.5 w-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              style={{ transformOrigin: "left center" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step / totalSteps }}
              transition={stepTransition}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-8 layout-content no-scrollbar relative min-h-[300px]">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                  transition={stepTransition}
                  className="space-y-6 transform-gpu"
                >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons-round text-3xl text-primary">campaign</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Let's get this unit rented!</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
                    We'll guide you through setting up pricing, uploading photos, and preparing this unit for your future tenants.
                  </p>
                </div>
                
                <div className="bg-background border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">1</span>
                    Review Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                      <span className="text-slate-500">Layout</span>
                      <span className="text-slate-900 font-medium">{unit.type} Layout</span>
                    </div>
                     <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                      <span className="text-slate-500">Current Status</span>
                      <span className="text-emerald-400 font-medium capitalize">{unit.status}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                transition={stepTransition}
                className="space-y-6 transform-gpu"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">Set Rental Pricing</h3>
                <p className="text-slate-500 text-sm mb-6">Determine your monthly rent and deposit requirements.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Monthly Rent (PHP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                      <input 
                        type="number" 
                        value={monthlyRent} 
                        onChange={(e) => {
                          const newRent = Number(e.target.value);
                          setMonthlyRent(newRent);
                          setAdvanceCost(newRent * advanceMonths);
                        }}
                        className="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-4 text-slate-900 font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Security Deposit</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                        <input type="number" defaultValue="50000" className="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-4 text-slate-900 font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Advance Rent</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                          <input 
                            type="number" 
                            value={advanceCost} 
                            onChange={(e) => setAdvanceCost(Number(e.target.value))}
                            className="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-4 text-slate-900 font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                          />
                        </div>
                        <div className="flex items-center bg-white border border-border rounded-xl overflow-hidden shrink-0">
                          <button 
                            onClick={() => {
                              const newM = Math.max(0, advanceMonths - 1);
                              setAdvanceMonths(newM);
                              setAdvanceCost(monthlyRent * newM);
                            }}
                            className="px-3 py-3 hover:bg-slate-50 text-slate-400 transition-colors"
                          >
                            <span className="material-icons-round text-[16px]">remove</span>
                          </button>
                          <span className="text-sm font-bold text-slate-900 w-4 text-center">{advanceMonths}</span>
                          <button 
                            onClick={() => {
                              const newM = advanceMonths + 1;
                              setAdvanceMonths(newM);
                              setAdvanceCost(monthlyRent * newM);
                            }}
                            className="px-3 py-3 hover:bg-slate-50 text-slate-400 transition-colors"
                          >
                            <span className="material-icons-round text-[16px]">add</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-2 text-right">{advanceMonths} month{advanceMonths !== 1 ? 's' : ''} applied</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                transition={stepTransition}
                className="space-y-6 transform-gpu"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Photos</h3>
                <p className="text-slate-500 text-sm mb-6">Properties with high-quality photos get 3x more applications.</p>
                
                <div className="space-y-6">
                  {/* Main Thumbnail */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-primary text-[18px]">star</span>
                        Main Thumbnail <span className="text-rose-400">*</span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">This is the key photo tenants will see when they receive an invitation.</p>
                    <div className="border-2 border-dashed border-border hover:border-primary/50 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-6 transition-colors cursor-pointer group h-36">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-slate-400 shadow-sm">
                        <span className="material-icons-round text-2xl">add_photo_alternate</span>
                      </div>
                      <h4 className="text-slate-900 font-medium text-sm">Upload Main Photo</h4>
                    </div>
                  </div>

                  {/* Additional Rooms */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-900 block">Room Details</label>
                      <button 
                        onClick={() => setPhotoSlots(prev => [...prev, { id: Date.now().toString(), name: 'Custom View', icon: 'image' }])}
                        className="text-xs text-primary font-medium hover:text-primary/80 transition-colors flex items-center gap-1"
                      >
                        <span className="material-icons-round text-[14px]">add</span> Add Custom
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Add photos of specific areas to give a complete tour.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {photoSlots.map((slot) => (
                        <div key={slot.id} className="border border-border bg-white rounded-xl p-3 flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer shadow-sm">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0">
                              <span className="material-icons-round text-[18px]">
                                {slot.icon}
                              </span>
                            </div>
                            {slot.icon === 'image' ? (
                               <input 
                                  type="text" 
                                  defaultValue={slot.name} 
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setPhotoSlots(prev => prev.map(p => p.id === slot.id ? { ...p, name: e.target.value } : p))
                                  }}
                                  className="bg-transparent border-b border-primary/50 text-slate-900 text-xs font-medium focus:outline-none w-full mr-2"
                               />
                            ) : (
                               <span className="text-slate-700 text-xs font-medium truncate">{slot.name}</span>
                            )}
                          </div>
                          {slot.icon === 'image' ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoSlots(prev => prev.filter(p => p.id !== slot.id));
                              }}
                              className="material-icons-round text-slate-500 hover:text-rose-400 text-[18px] transition-colors shrink-0"
                            >
                              close
                            </button>
                          ) : (
                            <span className="material-icons-round text-slate-500 text-[18px] group-hover:text-primary transition-colors shrink-0">add_circle_outline</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

             {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                transition={stepTransition}
                className="space-y-6 transform-gpu"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons-round text-4xl text-emerald-400">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Activate!</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Your unit configuration is looking great. It will be ready for tenant invitations immediately.
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5 border border-border flex items-center gap-4 mt-8">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-icons-round">notification_important</span>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-900 font-medium">Internal Portfolio</p>
                    <p className="text-slate-500">This unit will be added to your active management portfolio.</p>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-border bg-slate-50/80 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-all outline-none"
              >
                Back
              </button>
            ) : (
               <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-900 transition-all outline-none"
              >
                Cancel
              </button>
            )}
            
            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 transition-all outline-none flex items-center gap-2 border border-border"
              >
                Continue
                <span className="material-icons-round text-[18px]">arrow_forward</span>
              </button>
            ) : (
               <button
                onClick={() => {
                  // Simulate finishing
                  setTimeout(() => {
                    onClose();
                    setStep(1); // reset
                  }, 500);
                }}
                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all outline-none flex items-center gap-2"
              >
                <span className="material-icons-round text-[18px]">bolt</span>
                Activate Unit
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
