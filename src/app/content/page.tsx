"use client";

import { useState } from "react";
import { Youtube, Eye, MousePointerClick, TrendingUp, X, Sparkles } from "lucide-react";

// Mock Data
const HERO_STATS = [
    { label: "Videos Tracked", value: "142", icon: Youtube, color: "var(--brand-blue)" },
    { label: "Total Views", value: "1.2M", icon: Eye, color: "var(--brand-green)" },
    { label: "Avg Engagement", value: "8.4%", icon: MousePointerClick, color: "var(--brand-orange)" },
];

const CONTENT_ITEMS = [
    {
        id: "v1",
        title: "How to build an AI Agent from scratch",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600",
        views: "145K",
        engagement: "12.4%",
        outlierScore: 3.2,
        date: "2 days ago",
        recommendation: "This format is working incredibly well. Double down on 'from scratch' technical tutorials. The thumbnail CTR was exceptionally high.",
    },
    {
        id: "v2",
        title: "My React Developer Workflow (2024)",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
        views: "89K",
        engagement: "9.1%",
        outlierScore: 1.8,
        date: "1 week ago",
        recommendation: "Strong performance. Viewers dropped off slightly at the 4:00 mark when you discussed tooling configuration. Keep config sections punchier next time.",
    },
    {
        id: "v3",
        title: "Next.js 14 vs Remix - Which is better?",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
        views: "45K",
        engagement: "7.2%",
        outlierScore: 0.9,
        date: "2 weeks ago",
        recommendation: "Average performance. The highly competitive topic meant lower initial reach. Consider targeting more niche VS comparisons.",
    },
    {
        id: "v4",
        title: "Why I stopped using Tailwind CSS",
        thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=600",
        views: "210K",
        engagement: "15.8%",
        outlierScore: 4.5,
        date: "3 weeks ago",
        recommendation: "Massive outlier! Opinion-based technical content drives debate and engagement. Pin the top comment to sustain discussion.",
    },
    {
        id: "v5",
        title: "Vim setup for beginners",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
        views: "12K",
        engagement: "4.1%",
        outlierScore: 0.4,
        date: "1 month ago",
        recommendation: "Below average. The topic might be too niche or saturated. Focus on modern IDE setups instead.",
    },
    {
        id: "v6",
        title: "Deploying to Vercel in 60 seconds",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
        views: "64K",
        engagement: "8.8%",
        outlierScore: 1.2,
        date: "1 month ago",
        recommendation: "Solid baseline performance. '60 seconds' hooks work well for shorts/reels. Try adapting this into a vertical format if you haven't already.",
    },
];

function getOutlierColor(score: number) {
    if (score >= 3) return "var(--brand-green)";
    if (score >= 1.5) return "var(--brand-blue)";
    if (score >= 0.8) return "var(--text-muted)";
    return "var(--brand-red)";
}

export default function ContentIntel() {
    const [selectedItem, setSelectedItem] = useState<typeof CONTENT_ITEMS[0] | null>(null);

    // Baseline is just the average of the mock items
    const baselineViews = "48K views";
    const baselineEngagement = "7.8%";

    return (
        <div className="flex-col gap-8" style={{ display: "flex", flex: 1, gap: "2rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Content Intel
                </h1>
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                    AI-driven analytics and insights for your published content.
                </p>
            </div>

            {/* Hero Stat Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {HERO_STATS.map((stat, i) => (
                    <div
                        key={i}
                        className="card"
                        style={{ position: "relative", overflow: "hidden", paddingTop: "2rem" }}
                    >
                        {/* Gradient Top Border */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                            }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <span className="text-secondary" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                {stat.label}
                            </span>
                            <stat.icon size={20} className="text-muted" />
                        </div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Outlier Baseline Bar */}
            <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <TrendingUp size={20} className="text-secondary" />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                        Last 15 Uploads Baseline
                    </div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                        Avg. {baselineViews} • {baselineEngagement} engagement
                    </div>
                </div>
                <div
                    style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "rgba(90, 156, 245, 0.1)",
                        color: "var(--brand-blue)",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                    }}
                >
                    Normalizing Algorithm Active
                </div>
            </div>

            {/* Content Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {CONTENT_ITEMS.map((item) => {
                    const badgeColor = getOutlierColor(item.outlierScore);
                    return (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            style={{
                                backgroundColor: "var(--bg-card)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-lg)",
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                position: "relative",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--border-hover)";
                                e.currentTarget.style.transform = "translateY(-4px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--border-color)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            {/* Thumbnail */}
                            <div
                                style={{
                                    width: "100%",
                                    aspectRatio: "16/9",
                                    backgroundImage: `url(${item.thumbnail})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    borderBottom: "1px solid var(--border-color)",
                                }}
                            />

                            {/* Outlier Badge */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "0.75rem",
                                    right: "0.75rem",
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    backdropFilter: "blur(4px)",
                                    border: `1px solid ${badgeColor}`,
                                    color: badgeColor,
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "var(--radius-md)",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                }}
                            >
                                {item.outlierScore}x Outlier
                            </div>

                            {/* Info */}
                            <div style={{ padding: "1.25rem" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", lineHeight: 1.4, color: "var(--text-primary)" }}>
                                    {item.title}
                                </h3>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>{item.date}</span>
                                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Eye size={12} /> {item.views}</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><MousePointerClick size={12} /> {item.engagement}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Expandable Insights Modal overlay */}
            {selectedItem && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 50,
                        padding: "2rem",
                    }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="card animate-fade-in"
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                            backgroundColor: "var(--bg-elevated)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            border: "1px solid var(--border-color)",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedItem(null)}
                            style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)" }}
                        >
                            <X size={20} />
                        </button>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", paddingRight: "2rem" }}>
                            {selectedItem.title}
                        </h2>

                        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{ flex: 1, padding: "1rem", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Outlier Score</div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: getOutlierColor(selectedItem.outlierScore) }}>
                                    {selectedItem.outlierScore}x
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: "1rem", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Engagement</div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    {selectedItem.engagement}
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: "1rem", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Vs Average</div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: selectedItem.outlierScore > 1 ? "var(--brand-green)" : "var(--brand-red)" }}>
                                    {selectedItem.outlierScore > 1 ? "+" : ""}{((selectedItem.outlierScore - 1) * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1.5rem", backgroundColor: "rgba(229, 133, 15, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(229, 133, 15, 0.2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--brand-orange)" }}>
                                <Sparkles size={16} />
                                <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>AI Recommendation</h3>
                            </div>
                            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                                {selectedItem.recommendation}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
