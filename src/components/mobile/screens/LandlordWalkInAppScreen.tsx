"use client";

import { useState } from "react";
import { 
    ChevronLeft, 
    ArrowRight, 
    Building2, 
    Home, 
    Calendar, 
    User, 
    Mail, 
    Phone,
    CheckCircle2
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordWalkInAppScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_PROPERTIES = [
    { id: "prop1", name: "Metro Studio B", address: "Quezon City", units: ["101", "102", "205"] },
    { id: "prop2", name: "Skyline Lofts", address: "Makati City", units: ["PH-1", "1502", "808"] },
];

const TOTAL_STEPS = 4;

export default function LandlordWalkInAppScreen() {
    const { goBack } = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        propertyId: "",
        unitId: "",
        moveInDate: "2026-05-01",
        leaseDuration: "12",
        monthlyRent: "25000",
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return formData.firstName && formData.lastName && formData.email;
            case 2: return formData.propertyId && formData.unitId;
            case 3: return formData.moveInDate && formData.leaseDuration;
            default: return true;
        }
    };

    const nextStep = () => {
        if (isStepValid() && currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        } else if (currentStep === TOTAL_STEPS) {
            // Finalize
            goBack();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else goBack();
    };

    const progress = (currentStep / TOTAL_STEPS) * 100;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={prevStep}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Walk-In Application</h1>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Step Content */}
            <div className={styles.content}>
                {currentStep === 1 && (
                    <div key="step1">
                        <h2 className={styles.stepTitle}>Prospect Info</h2>
                        <p className={styles.stepSub}>Enter the basic details of the prospect.</p>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>First Name</label>
                            <input 
                                className={styles.input} 
                                placeholder="e.g. Juan"
                                value={formData.firstName}
                                onChange={e => updateField("firstName", e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input 
                                className={styles.input} 
                                placeholder="e.g. Dela Cruz"
                                value={formData.lastName}
                                onChange={e => updateField("lastName", e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input 
                                className={styles.input} 
                                type="email"
                                placeholder="juan@example.com"
                                value={formData.email}
                                onChange={e => updateField("email", e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input 
                                className={styles.input} 
                                placeholder="0917 XXX XXXX"
                                value={formData.phone}
                                onChange={e => updateField("phone", e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div key="step2">
                        <h2 className={styles.stepTitle}>Property & Unit</h2>
                        <p className={styles.stepSub}>Which unit are they applying for?</p>
                        
                        <label className={styles.label}>Select Property</label>
                        <div className={styles.selectionList}>
                            {MOCK_PROPERTIES.map(prop => (
                                <div 
                                    key={prop.id}
                                    className={`${styles.selectionCard} ${formData.propertyId === prop.id ? styles.selectionCardActive : ""}`}
                                    onClick={() => updateField("propertyId", prop.id)}
                                >
                                    <div className={styles.cardIcon}>
                                        <Building2 size={20} />
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.cardTitle}>{prop.name}</div>
                                        <div className={styles.cardSub}>{prop.address}</div>
                                    </div>
                                    <div className={styles.radioCircle}>
                                        {formData.propertyId === prop.id && <div className={styles.radioInner} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {formData.propertyId && (
                            <div style={{ marginTop: "24px" }}>
                                <label className={styles.label}>Select Unit</label>
                                <div className={styles.selectionList} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                    {MOCK_PROPERTIES.find(p => p.id === formData.propertyId)?.units.map(unit => (
                                        <div 
                                            key={unit}
                                            className={`${styles.selectionCard} ${formData.unitId === unit ? styles.selectionCardActive : ""}`}
                                            style={{ padding: "12px" }}
                                            onClick={() => updateField("unitId", unit)}
                                        >
                                            <div className={styles.cardInfo}>
                                                <div className={styles.cardTitle}>Unit {unit}</div>
                                            </div>
                                            <div className={styles.radioCircle}>
                                                {formData.unitId === unit && <div className={styles.radioInner} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div key="step3">
                        <h2 className={styles.stepTitle}>Lease Terms</h2>
                        <p className={styles.stepSub}>Customize the specific terms for this tenant.</p>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Expected Move-in Date</label>
                            <input 
                                className={styles.input} 
                                type="date"
                                value={formData.moveInDate}
                                onChange={e => updateField("moveInDate", e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Lease Duration (Months)</label>
                            <input 
                                className={styles.input} 
                                type="number"
                                placeholder="12"
                                value={formData.leaseDuration}
                                onChange={e => updateField("leaseDuration", e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monthly Rent (₱)</label>
                            <input 
                                className={styles.input} 
                                type="number"
                                placeholder="25,000"
                                value={formData.monthlyRent}
                                onChange={e => updateField("monthlyRent", e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div key="step4">
                        <h2 className={styles.stepTitle}>Verify Details</h2>
                        <p className={styles.stepSub}>Review the application before finalizing.</p>
                        
                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>Applicant</div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Name</span>
                                <span className={styles.reviewRowValue}>{formData.firstName} {formData.lastName}</span>
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Email</span>
                                <span className={styles.reviewRowValue}>{formData.email}</span>
                            </div>
                        </div>

                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>Target Unit</div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Property</span>
                                <span className={styles.reviewRowValue}>
                                    {MOCK_PROPERTIES.find(p => p.id === formData.propertyId)?.name}
                                </span>
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Unit</span>
                                <span className={styles.reviewRowValue}>{formData.unitId}</span>
                            </div>
                        </div>

                        <div className={styles.reviewSection}>
                            <div className={styles.reviewSectionTitle}>Financials</div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Rent</span>
                                <span className={styles.reviewRowValue}>₱{Number(formData.monthlyRent).toLocaleString()}</span>
                            </div>
                            <div className={styles.reviewRow}>
                                <span className={styles.reviewRowLabel}>Duration</span>
                                <span className={styles.reviewRowValue}>{formData.leaseDuration} Months</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                {currentStep > 1 && (
                    <button className={styles.prevBtn} onClick={prevStep}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                <button 
                    className={`${styles.nextBtn} ${!isStepValid() ? styles.nextBtnDisabled : ""}`}
                    onClick={nextStep}
                    disabled={!isStepValid()}
                >
                    {currentStep === TOTAL_STEPS ? "Send Invitation" : "Next Step"}
                    {currentStep < TOTAL_STEPS && <ArrowRight size={20} />}
                    {currentStep === TOTAL_STEPS && <CheckCircle2 size={20} />}
                </button>
            </div>
        </div>
    );
}
