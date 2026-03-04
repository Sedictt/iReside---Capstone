"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    Check,
    User,
    Briefcase,
    Users,
    FileCheck,
    CheckCircle2,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { properties } from "@/lib/data";
import styles from "./ApplicationFormScreen.module.css";

// ─── Steps ─────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Personal", icon: User },
    { id: 2, label: "Employment", icon: Briefcase },
    { id: 3, label: "References", icon: Users },
    { id: 4, label: "Review", icon: FileCheck },
];

// ─── Component ─────────────────────────────────────────────
export default function ApplicationFormScreen() {
    const { goBack, navigate, screenParams } = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const propertyId = screenParams.propertyId as string;
    const property = properties.find((p) => p.id === propertyId);

    // Form Data
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        idType: "Government ID",
        moveInDate: "",
        // Employment
        employer: "",
        position: "",
        monthlyIncome: "",
        yearsEmployed: "",
        // References
        prevLandlord: "",
        prevLandlordPhone: "",
        refName: "",
        refRelation: "",
        refPhone: "",
        additionalNotes: "",
    });

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep((s) => s + 1);
        else if (termsAccepted) setSubmitted(true);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    // ─── Success State ─────────────────────────────────────
    if (submitted) {
        return (
            <div className={styles.container}>
                <div className={styles.successState}>
                    <div className={styles.successIcon}>
                        <CheckCircle2 />
                    </div>
                    <h2 className={styles.successTitle}>Application Submitted!</h2>
                    <p className={styles.successSub}>
                        Your application for{" "}
                        <strong>{property?.name || "the property"}</strong> has been sent to
                        the landlord. You&apos;ll be notified once it&apos;s reviewed.
                    </p>
                    <button
                        className={styles.successButton}
                        onClick={() => navigate("tenantHome")}
                    >
                        Back to Home
                        <ArrowRight />
                    </button>
                </div>
            </div>
        );
    }

    // ─── Step Content ──────────────────────────────────────
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Personal Information</h2>
                        <p className={styles.stepSub}>
                            Provide your basic details for the rental application.
                        </p>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>First Name</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="Juan"
                                    value={form.firstName}
                                    onChange={(e) => updateField("firstName", e.target.value)}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Last Name</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="Dela Cruz"
                                    value={form.lastName}
                                    onChange={(e) => updateField("lastName", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Email Address</label>
                            <input
                                className={styles.fieldInput}
                                type="email"
                                placeholder="juan@email.com"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Phone Number</label>
                            <input
                                className={styles.fieldInput}
                                type="tel"
                                placeholder="+63 917 123 4567"
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>ID Type</label>
                                <select
                                    className={styles.fieldSelect}
                                    value={form.idType}
                                    onChange={(e) => updateField("idType", e.target.value)}
                                >
                                    <option>Government ID</option>
                                    <option>Passport</option>
                                    <option>Driver&apos;s License</option>
                                    <option>Company ID</option>
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Move-in Date</label>
                                <input
                                    className={styles.fieldInput}
                                    type="date"
                                    value={form.moveInDate}
                                    onChange={(e) => updateField("moveInDate", e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Employment Details</h2>
                        <p className={styles.stepSub}>
                            Help the landlord verify your ability to pay rent.
                        </p>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Employer / Company</label>
                            <input
                                className={styles.fieldInput}
                                placeholder="ABC Corporation"
                                value={form.employer}
                                onChange={(e) => updateField("employer", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Position / Role</label>
                            <input
                                className={styles.fieldInput}
                                placeholder="Software Engineer"
                                value={form.position}
                                onChange={(e) => updateField("position", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Monthly Income</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="₱40,000"
                                    value={form.monthlyIncome}
                                    onChange={(e) => updateField("monthlyIncome", e.target.value)}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Years Employed</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="3"
                                    value={form.yearsEmployed}
                                    onChange={(e) => updateField("yearsEmployed", e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
                        <h2 className={styles.stepTitle}>References</h2>
                        <p className={styles.stepSub}>
                            Provide contacts who can vouch for your rental history.
                        </p>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Previous Landlord Name</label>
                            <input
                                className={styles.fieldInput}
                                placeholder="Maria Santos"
                                value={form.prevLandlord}
                                onChange={(e) => updateField("prevLandlord", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Previous Landlord Phone</label>
                            <input
                                className={styles.fieldInput}
                                type="tel"
                                placeholder="+63 918 456 7890"
                                value={form.prevLandlordPhone}
                                onChange={(e) =>
                                    updateField("prevLandlordPhone", e.target.value)
                                }
                            />
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Reference Name</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="Pedro Reyes"
                                    value={form.refName}
                                    onChange={(e) => updateField("refName", e.target.value)}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Relation</label>
                                <input
                                    className={styles.fieldInput}
                                    placeholder="Colleague"
                                    value={form.refRelation}
                                    onChange={(e) => updateField("refRelation", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Reference Phone</label>
                            <input
                                className={styles.fieldInput}
                                type="tel"
                                placeholder="+63 919 111 2222"
                                value={form.refPhone}
                                onChange={(e) => updateField("refPhone", e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Additional Notes</label>
                            <textarea
                                className={styles.fieldTextarea}
                                placeholder="Any additional information..."
                                value={form.additionalNotes}
                                onChange={(e) =>
                                    updateField("additionalNotes", e.target.value)
                                }
                            />
                        </div>
                    </>
                );

            case 4:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Review Application</h2>
                        <p className={styles.stepSub}>
                            Review your details before submitting.
                        </p>

                        {/* Property */}
                        {property && (
                            <div className={styles.reviewSection}>
                                <div className={styles.reviewSectionTitle}>
                                    <FileCheck /> Property
                                </div>
                                <div className={styles.reviewRow}>
                                    <span className={styles.reviewLabel}>Property</span>
                                    <span className={styles.reviewValue}>{property.name}</span>
                                </div>
                                <div className={styles.reviewDivider} />
                                <div className={styles.reviewRow}>
                                    <span className={styles.reviewLabel}>Rent</span>
                                    <span className={styles.reviewValue}>{property.price}/mo</span>
                                </div>
                            </div>
                        )}

                        {/* Personal */}
                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>
                                <User /> Personal
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Name</span>
                                <span className={styles.reviewValue}>
                                    {form.firstName} {form.lastName}
                                </span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Email</span>
                                <span className={styles.reviewValue}>{form.email}</span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Phone</span>
                                <span className={styles.reviewValue}>{form.phone}</span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Move-in</span>
                                <span className={styles.reviewValue}>
                                    {form.moveInDate || "Not specified"}
                                </span>
                            </div>
                        </div>

                        {/* Employment */}
                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>
                                <Briefcase /> Employment
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Employer</span>
                                <span className={styles.reviewValue}>{form.employer}</span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Position</span>
                                <span className={styles.reviewValue}>{form.position}</span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Income</span>
                                <span className={styles.reviewValue}>{form.monthlyIncome}</span>
                            </div>
                        </div>

                        {/* References */}
                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>
                                <Users /> References
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Prev. Landlord</span>
                                <span className={styles.reviewValue}>{form.prevLandlord}</span>
                            </div>
                            <div className={styles.reviewDivider} />
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewLabel}>Reference</span>
                                <span className={styles.reviewValue}>
                                    {form.refName} ({form.refRelation})
                                </span>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className={styles.termsRow}>
                            <div
                                className={`${styles.checkbox} ${termsAccepted ? styles.checkboxChecked : ""
                                    }`}
                                onClick={() => setTermsAccepted(!termsAccepted)}
                            >
                                {termsAccepted && <Check />}
                            </div>
                            <p className={styles.termsText}>
                                I confirm that all information provided is accurate and I agree
                                to the <span>Terms & Conditions</span> and{" "}
                                <span>Privacy Policy</span>.
                            </p>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Rental Application</span>
                <span className={styles.stepIndicator}>
                    <span>{currentStep}</span>/{STEPS.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
                {STEPS.map((step) => (
                    <div
                        key={step.id}
                        className={`${styles.progressSegment} ${step.id < currentStep
                                ? styles.progressDone
                                : step.id === currentStep
                                    ? styles.progressActive
                                    : ""
                            }`}
                    />
                ))}
            </div>

            {/* Form Content */}
            <div className={styles.formBody}>{renderStep()}</div>

            {/* Footer */}
            <div className={styles.footer}>
                {currentStep > 1 && (
                    <button className={styles.prevButton} onClick={handlePrev}>
                        <ChevronLeft />
                        Back
                    </button>
                )}
                <button
                    className={styles.nextButton}
                    onClick={handleNext}
                    style={
                        currentStep === 4 && !termsAccepted
                            ? { opacity: 0.5, pointerEvents: "none" }
                            : {}
                    }
                >
                    {currentStep === 4 ? "Submit Application" : "Continue"}
                    {currentStep === 4 ? <Check /> : <ArrowRight />}
                </button>
            </div>
        </div>
    );
}
