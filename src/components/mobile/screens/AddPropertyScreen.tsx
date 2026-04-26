"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Building2, 
    MapPin, 
    Home, 
    Plus, 
    Trash2, 
    Image as ImageIcon, 
    Check, 
    ArrowRight,
    Info,
    Wallet
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./AddPropertyScreen.module.css";

type Step = 1 | 2 | 3;

interface Unit {
    id: string;
    name: string;
    rent: string;
    status: "available" | "occupied";
}

export default function AddPropertyScreen() {
    const { goBack } = useNavigation();
    const [step, setStep] = useState<Step>(1);
    
    // Form State
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [units, setUnits] = useState<Unit[]>([
        { id: "1", name: "Unit 101", rent: "15,000", status: "available" }
    ]);

    const addUnit = () => {
        const nextNum = units.length + 1;
        setUnits([...units, { 
            id: Date.now().toString(), 
            name: `Unit ${nextNum}01`, 
            rent: "15,000", 
            status: "available" 
        }]);
    };

    const removeUnit = (id: string) => {
        setUnits(units.filter(u => u.id !== id));
    };

    const handleNext = () => {
        if (step < 3) setStep((step + 1) as Step);
        else {
            // Final submit
            alert("Property listed successfully!");
            goBack();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep((step - 1) as Step);
        else goBack();
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ArrowLeft />
                </button>
                <div className={styles.stepIndicator}>
                    <div className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ""}`} />
                    <div className={styles.stepLine} />
                    <div className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ""}`} />
                    <div className={styles.stepLine} />
                    <div className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ""}`} />
                </div>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.content}>
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h1 className={styles.title}>Property Details</h1>
                        <p className={styles.subtitle}>Let's start with the basics of your property.</p>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Property Name</label>
                            <div className={styles.inputWrapper}>
                                <Building2 size={18} className={styles.inputIcon} />
                                <input 
                                    className={styles.input} 
                                    placeholder="e.g. Skyline Lofts" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Address</label>
                            <div className={styles.inputWrapper}>
                                <MapPin size={18} className={styles.inputIcon} />
                                <input 
                                    className={styles.input} 
                                    placeholder="Complete address" 
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea 
                                className={styles.textarea} 
                                placeholder="Describe your property, amenities, etc."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.stepContent}>
                        <div className={styles.titleRow}>
                            <div>
                                <h1 className={styles.title}>Units</h1>
                                <p className={styles.subtitle}>Manage the units within this property.</p>
                            </div>
                            <button className={styles.addUnitBtn} onClick={addUnit}>
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className={styles.unitsList}>
                            {units.map((unit, index) => (
                                <div key={unit.id} className={styles.unitCard}>
                                    <div className={styles.unitCardHeader}>
                                        <div className={styles.unitInfo}>
                                            <Home size={16} />
                                            <input 
                                                className={styles.unitNameInput}
                                                value={unit.name}
                                                onChange={e => {
                                                    const newUnits = [...units];
                                                    newUnits[index].name = e.target.value;
                                                    setUnits(newUnits);
                                                }}
                                            />
                                        </div>
                                        <button className={styles.removeBtn} onClick={() => removeUnit(unit.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className={styles.unitCardBody}>
                                        <div className={styles.unitInputGroup}>
                                            <span className={styles.unitCurrency}>₱</span>
                                            <input 
                                                className={styles.unitRentInput}
                                                value={unit.rent}
                                                onChange={e => {
                                                    const newUnits = [...units];
                                                    newUnits[index].rent = e.target.value;
                                                    setUnits(newUnits);
                                                }}
                                            />
                                            <span className={styles.unitPeriod}>/mo</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h1 className={styles.title}>Photos & Review</h1>
                        <p className={styles.subtitle}>Upload photos and review your listing.</p>

                        <div className={styles.photoUpload}>
                            <div className={styles.uploadPlaceholder}>
                                <ImageIcon size={32} />
                                <span>Add Photos</span>
                            </div>
                        </div>

                        <div className={styles.summaryCard}>
                            <h3 className={styles.summaryTitle}>Listing Summary</h3>
                            <div className={styles.summaryRow}>
                                <Info size={16} />
                                <span>{name || "Unnamed Property"}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <MapPin size={16} />
                                <span>{address || "No address provided"}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <Wallet size={16} />
                                <span>{units.length} Units • Avg. ₱15,000/mo</span>
                            </div>
                        </div>

                        <div className={styles.termsNote}>
                            By listing this property, you agree to iReside's <span>Terms of Service</span> and <span>Verification Policy</span>.
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className={styles.footer}>
                <button className={styles.nextButton} onClick={handleNext}>
                    {step === 3 ? "List Property" : "Continue"}
                    {step === 3 ? <Check /> : <ArrowRight />}
                </button>
            </div>
        </div>
    );
}
