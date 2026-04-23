"use client";

import { useState } from "react";
import { 
    ChevronLeft, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    PieChart, 
    Activity,
    ArrowUpRight,
    Building2,
    Calendar,
    ArrowRight,
    FileDown,
    CheckCircle2
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./RevenueDashboardScreen.module.css";

// ─── Chart Component (SVG Line Chart) ───────────────────
function RevenueChart() {
    // Mock points for a 6-month trend
    const points = "0,80 40,65 80,75 120,40 160,55 200,30 240,45 280,35 320,10";
    
    return (
        <div className={styles.chartBox}>
            <svg viewBox="0 0 320 100" className={styles.chartSvg}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6d9838" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6d9838" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {/* Y-Axis Grid Lines */}
                <line x1="0" y1="20" x2="320" y2="20" className={styles.chartGridLine} />
                <line x1="0" y1="50" x2="320" y2="50" className={styles.chartGridLine} />
                <line x1="0" y1="80" x2="320" y2="80" className={styles.chartGridLine} />

                {/* The Trend Line */}
                <polyline 
                    points={points} 
                    className={styles.chartLine}
                />
                
                {/* The Filled Area */}
                <polyline 
                    points={`${points} 320,100 0,100`} 
                    className={styles.chartArea}
                />
            </svg>
            <div className={styles.chartLabels}>
                {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map(m => (
                    <span key={m} className={styles.chartLabel}>{m}</span>
                ))}
            </div>
        </div>
    );
}

export default function RevenueDashboardScreen() {
    const { goBack } = useNavigation();
    const [generating, setGenerating] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);

    const handleGenerateReport = () => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            setDownloadReady(true);
        }, 3000);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={goBack}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Financial Analytics</h1>
            </div>

            <div className={styles.scrollArea}>
                {/* Main Metric Hero */}
                <div className={styles.heroCard}>
                    <div className={styles.heroLabel}>Total Revenue (YTD)</div>
                    <div className={styles.heroValue}>₱1,245,600</div>
                    <div className={styles.heroTrend}>
                        <TrendingUp size={14} />
                        <span>+12.4% from last year</span>
                    </div>
                </div>

                {/* Revenue Chart Section */}
                <div className={styles.chartContainer}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Income Trend</h2>
                        <span className={styles.chartPeriod}>Last 6 Months</span>
                    </div>
                    <RevenueChart />
                </div>

                {/* Comparison Metrics Grid */}
                <div className={styles.analyticsGrid}>
                    <div className={styles.anaCard}>
                        <div className={styles.anaIcon}><Activity size={18} /></div>
                        <div className={styles.anaValue}>₱145k</div>
                        <div className={styles.anaLabel}>Avg. Monthly</div>
                    </div>
                    <div className={styles.anaCard}>
                        <div className={styles.anaIcon}><PieChart size={18} /></div>
                        <div className={styles.anaValue}>8.2%</div>
                        <div className={styles.anaLabel}>Annual ROI</div>
                    </div>
                </div>

                {/* Income Breakdown */}
                <div className={styles.breakdownSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Property Breakdown</h2>
                    </div>
                    
                    <div className={styles.breakdownItem}>
                        <div className={styles.breakdownDot} style={{ background: '#6d9838' }} />
                        <div className={styles.breakdownInfo}>
                            <div className={styles.breakdownName}>Residential Units</div>
                            <div className={styles.breakdownMeta}>18 Active Leases</div>
                        </div>
                        <div className={styles.breakdownVal}>
                            <div className={styles.breakdownAmt}>₱110,000</div>
                            <div className={styles.breakdownPct}>82% of Total</div>
                        </div>
                    </div>

                    <div className={styles.breakdownItem}>
                        <div className={styles.breakdownDot} style={{ background: '#4a6923' }} />
                        <div className={styles.breakdownInfo}>
                            <div className={styles.breakdownName}>Commercial Space</div>
                            <div className={styles.breakdownMeta}>2 Active Leases</div>
                        </div>
                        <div className={styles.breakdownVal}>
                            <div className={styles.breakdownAmt}>₱25,000</div>
                            <div className={styles.breakdownPct}>18% of Total</div>
                        </div>
                    </div>

                    <div className={styles.breakdownItem}>
                        <div className={styles.breakdownDot} style={{ background: '#1a1a1a' }} />
                        <div className={styles.breakdownInfo}>
                            <div className={styles.breakdownName}>Other Fees</div>
                            <div className={styles.breakdownMeta}>Late fees, Parking</div>
                        </div>
                        <div className={styles.breakdownVal}>
                            <div className={styles.breakdownAmt}>₱10,000</div>
                            <div className={styles.breakdownPct}>--</div>
                        </div>
                    </div>
                </div>

                {/* Secondary CTA */}
                <button 
                    className={styles.anaCard} 
                    style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginTop: '12px',
                        cursor: generating ? 'default' : 'pointer',
                        opacity: generating ? 0.7 : 1,
                        background: downloadReady ? 'rgba(109, 152, 56, 0.1)' : '#141414',
                        borderColor: downloadReady ? '#6d9838' : '#1e1e1e'
                    }}
                    onClick={downloadReady ? undefined : handleGenerateReport}
                >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {generating ? <Activity className={styles.spin} size={18} color="#6d9838" /> : downloadReady ? <CheckCircle2 size={18} color="#6d9838" /> : <Calendar size={18} color="#737373" />}
                        <span style={{ fontSize: '14px', fontWeight: 700, color: downloadReady ? '#6d9838' : '#fafafa' }}>
                            {generating ? "Calculating ledger..." : downloadReady ? "Report Ready: Tax_2026.pdf" : "Generate Tax Report"}
                        </span>
                    </div>
                    {downloadReady ? <FileDown size={18} color="#6d9838" /> : <ArrowRight size={18} color="#525252" />}
                </button>
            </div>
        </div>
    );
}
