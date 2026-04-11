
import io

new_render = r"""    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-bold tracking-wide text-slate-300">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading private invite...
                </div>
            </div>
        );
    }

    if (loadError || !invite) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full" />
                </div>
                <div className="relative z-10 max-w-lg w-full rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center shadow-2xl">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-900/20 rounded-3xl flex items-center justify-center shadow-2xl mb-8 border border-red-500/20">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-4">Invite <span className="text-red-400 italic">unavailable</span></h1>
                    <p className="text-sm leading-relaxed text-white/60 mb-8">{loadError || "This invite is no longer available."}</p>
                    <Link href="/login" className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 text-sm font-black text-white transition-all active:scale-95">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-[100vh] relative flex flex-col items-center justify-center p-6 overflow-hidden bg-[#0f1218]">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    className="relative z-10 text-center max-w-2xl px-8 py-16 rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl"
                >
                    <motion.div
                        initial={{ rotate: -10, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-10"
                    >
                        <CheckCircle2 className="h-12 w-12 text-black" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white leading-tight">
                        Application <br /><span className="text-primary italic">Successfully</span> Sent
                    </h1>

                    <p className="text-white/60 text-lg mb-12 leading-relaxed">
                        Excellent Choice! Your application for <span className="text-white font-semibold">{invite.propertyName}</span> is now being reviewed by the team. You will only receive an account after approval.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/5"
                        >
                            <User className="h-4 w-4" />
                            Return Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#0f1218] text-white">
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-4 lg:py-6">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="w-full lg:w-[380px] space-y-6 flex-shrink-0">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold text-white tracking-tighter leading-none">
                                Application <br />
                                <span className="text-primary italic">Process</span>
                            </h1>
                            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                                Complete these steps to secure your future home at {invite.propertyName}.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {stepDefinitions.map((stepDef) => {
                                const isActive = step === stepDef.id;
                                const isCompleted = step > stepDef.id;
                                return (
                                    <div
                                        key={stepDef.id}
                                        className={cn(
                                            "relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-500 cursor-default overflow-hidden group",
                                            isActive ? "bg-white/10 border-white/20 shadow-xl shadow-black/20" :
                                                isCompleted ? "bg-primary/5 border-primary/20 opacity-80" :
                                                    "bg-white/[0.02] border-white/5 opacity-40 hover:opacity-60"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                                        )}

                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                                            isActive ? "bg-primary text-black scale-105 shadow-[0_0_20px_rgba(109,152,56,0.5)]" :
                                                isCompleted ? "bg-primary/20 text-primary" :
                                                    "bg-white/5 text-white/40"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <stepDef.icon className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0">
                                            <p className={cn(
                                                "text-sm font-bold transition-colors leading-tight",
                                                isActive ? "text-white" : "text-white/60"
                                            )}>
                                                {stepDef.title}
                                            </p>
                                            <p className="text-[10px] text-white/40 mt-1 truncate max-w-[180px]">
                                                {isActive ? "Currently editing" : stepDef.desc}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(109,152,56,1)]"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col p-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Invite Intelligence</h3>
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-white tracking-tight">{invite.propertyName}</p>
                                  <p className="text-xs text-white/50">{isOnlineInvite ? "Online Document Processing" : "Face-to-face Document Checking"}</p>
                                </div>
                                {invite.expiresAt && (
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[10px] font-black uppercase text-red-400">Expires At</p>
                                        <p className="text-xs text-white/70 mt-1">{new Date(invite.expiresAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="flex-1">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f1218]/80 backdrop-blur-md border border-white/10 rounded-[3.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]"
                        >
                            <div className="absolute -top-10 -right-10 opacity-[0.03] select-none pointer-events-none">
                                {(() => {
                                    const Icon = stepDefinitions[step].icon;
                                    return <Icon className="h-80 w-80 rotate-12" />;
                                })()}
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                <header className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                            {(() => {
                                                const Icon = stepDefinitions[step].icon;
                                                return <Icon className="h-5 w-5" />;
                                            })()}
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Step {step + 1} of {totalSteps}</span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                                        {stepDefinitions[step].title}
                                    </h2>
                                    <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
                                        {stepDefinitions[step].desc}. Accuracy accelerates the landlord approval window.
                                    </p>
                                </header>
                                
                                {submitError && (
                                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                                        {submitError}
                                    </div>
                                )}

                                <div className="space-y-6 flex-1">
                                    {step === 0 && (
                                        <ApplicationIdentityStep
                                            formData={formData}
                                            formErrors={formErrors}
                                            selectedUnit={selectedUnit}
                                            units={invite.units}
                                            currentUnit={currentUnit}
                                            lockUnit={invite.mode === "unit"}
                                            showUnitSelector={true}
                                            onSelectedUnitChange={setSelectedUnit}
                                            onTouchedUnit={() => setTouchedFields((prev) => ({ ...prev, unit: true }))}
                                            onValidateUnit={(nextUnit) => {
                                                const errors = validateFormStep(step, nextUnit, formData);
                                                setFormErrors((prev) => ({ ...prev, unit: errors.unit }));
                                                return errors.unit;
                                            }}
                                            onFieldChange={updateField}
                                        />
                                    )}

                                    {step === 1 && (
                                        <ApplicationProfileStep
                                            formData={formData}
                                            formErrors={formErrors}
                                            selectedUnit={selectedUnit}
                                            units={invite.units}
                                            currentUnit={currentUnit}
                                            onSelectedUnitChange={setSelectedUnit}
                                            onFieldChange={updateField}
                                            messageLabel="Additional Notes"
                                            messagePlaceholder="Add anything the landlord should know about your move-in timing, household setup, or application context."
                                        />
                                    )}

                                    {isOnlineInvite && step === 2 && (
                                        <div className="space-y-4 max-w-2xl">
                                            <p className="text-sm leading-relaxed text-slate-300 mb-6">
                                                Upload at least one clear photo for each required document. Maximum file size 5MB each.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {requiredRequirementKeys.map((key) => {
                                                    const docs = uploadedDocuments.filter((doc) => doc.requirementKey === key);
                                                    const checked = Boolean(formData.requirements_checklist[key]);
                                                    return (
                                                        <div key={key} className="rounded-3xl border border-white/10 bg-white/5 p-5 relative group hover:border-primary/40 transition-colors">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <p className="text-xs font-black uppercase tracking-[0.1em] text-white">
                                                                        {REQUIREMENT_LABELS[key] ?? key}
                                                                    </p>
                                                                    {key !== "application_form" && (
                                                                       <p className="text-[10px] text-white/40 mt-1">Photo Upload</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col gap-2 relative z-10">
                                                                    {key !== "application_form" && (
                                                                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white/20 transition-colors">
                                                                            <Upload className="h-3 w-3" />
                                                                            {uploadingRequirementKey === key ? "WAIT..." : "UPLOAD"}
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                multiple
                                                                                className="hidden"
                                                                                disabled={uploadingRequirementKey !== null}
                                                                                onChange={(event) => {
                                                                                    void handleUploadRequirementFiles(key, event.target.files);
                                                                                    event.target.value = "";
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleRequirement(key)}
                                                                        className={cn(
                                                                            "rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                                                                            checked
                                                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                                                                        )}
                                                                    >
                                                                        {checked ? "READY" : "SET READY"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                                                                {key === "application_form" ? (
                                                                    <p className="text-[10px] text-primary italic font-medium">Included digitally in this app</p>
                                                                ) : docs.length === 0 ? (
                                                                    <p className="text-[10px] text-slate-500 italic">No files attached yet</p>
                                                                ) : (
                                                                    docs.map((doc) => (
                                                                        <div key={doc.url} className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2 text-xs border border-white/5">
                                                                            <a className="truncate text-blue-300 hover:text-blue-200 max-w-[120px]" href={doc.url} target="_blank" rel="noreferrer">
                                                                                {doc.fileName}
                                                                            </a>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeUploadedDocument(doc.url)}
                                                                                className="p-1.5 text-white/40 hover:text-red-400 transition-colors bg-white/5 rounded-lg"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {step === finalStepIndex && (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <SummaryCard label="Property" value={invite.propertyName} icon={Building} />
                                                <SummaryCard label="Unit" value={currentUnit?.name ?? "Not selected"} icon={Home} />
                                                <SummaryCard label="Applicant" value={formData.applicant_name || "Not provided"} icon={User} />
                                                <SummaryCard label="Email" value={formData.applicant_email || "Not provided"} icon={Mail} />
                                                <SummaryCard label="Move-in date" value={formData.move_in_date || "Not provided"} icon={Calendar} />
                                                <SummaryCard label="Income" value={formData.employment_info.monthly_income ? `P${Number(formData.employment_info.monthly_income).toLocaleString()}` : "Not provided"} icon={Briefcase} />
                                            </div>
                                            
                                            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 lg:p-8">
                                                <div className="flex items-center gap-3 opacity-50 mb-3">
                                                    <FileText className="h-4 w-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Detailed Notes</p>
                                                </div>
                                                <p className="text-sm leading-relaxed text-slate-200">{formData.message || "No additional notes provided."}</p>
                                            </div>

                                            <div className="rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/20 p-6 flex flex-col md:flex-row items-center gap-6">
                                                <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-lg mb-1">Final Review</h4>
                                                    <p className="text-white/50 text-sm leading-relaxed font-medium">
                                                        By proceeding, you grant permission for basic background validation based on the requirements provided.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 hover:bg-white/5",
                                            step === 0 ? "opacity-0 pointer-events-none" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={step === finalStepIndex ? handleSubmit : handleNext}
                                        disabled={submitting}
                                        className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary-dark text-black font-extrabold text-sm transition-all shadow-[0_10px_30px_rgba(109,152,56,0.3)] flex items-center gap-3 disabled:opacity-50 active:scale-[0.98] relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                {step === finalStepIndex ? "Submit Application" : "Continue Process"}
                                                {step === finalStepIndex ? <CheckCircle2 className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-30 group">
                            <Seal icon={ShieldCheck} label="Bank-Level Encryption" />
                            <Seal icon={Lock} label="DPA Compliance" />
                            <Seal icon={Zap} label="Instant Verification" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon }: any) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/[0.07] transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="h-16 w-16" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 opacity-50 mb-3 block">
                    <Icon className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                </div>
                <p className="text-lg font-black tracking-tight text-white line-clamp-1">{value}</p>
            </div>
        </div>
    );
}

function Seal({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default duration-500">
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </div>
    );
}
"""

path = "src/components/tenant/invite/InviteApplicationClient.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    text = f.read()

parts = text.split("    if (loading) {")
final = parts[0] + new_render

with io.open(path, "w", encoding="utf-8") as f:
    f.write(final)

print("Replaced!")

