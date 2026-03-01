"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CheckSquare,
    BarChart2,
    BrainCircuit,
    Settings,
    Activity,
    Zap,
} from "lucide-react";
import Image from "next/image";

const navItems = [
    { name: "Command Center", href: "/", icon: LayoutDashboard },
    { name: "Productivity", href: "/productivity", icon: Zap },
    { name: "Tasks & Projects", href: "/tasks", icon: CheckSquare },
    { name: "Content Intel", href: "/content", icon: BarChart2 },
    { name: "Second Brain", href: "/brain", icon: BrainCircuit },
    { name: "Connections", href: "/connections", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="bg-sidebar flex-col justify-between"
            style={{
                width: "260px",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                display: "flex",
                borderRight: "1px solid var(--border-color)",
            }}
        >
            <div style={{ padding: "1.5rem" }}>
                {/* Logo & Brand */}
                <div className="flex items-center gap-3" style={{ marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "var(--brand-orange)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#fff",
                        }}
                    >
                        MC
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            Mission Control
                        </h1>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>v1.0.0</p>
                    </div>
                </div>

                {/* Agent Status Card */}
                <div
                    className="card flex items-center gap-3"
                    style={{ padding: "1rem", marginBottom: "2rem" }}
                >
                    <div style={{ position: "relative", width: "10px", height: "10px" }}>
                        <div
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backgroundColor: "var(--brand-green)",
                                borderRadius: "50%",
                                animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                                opacity: 0.75,
                            }}
                        />
                        <div
                            style={{
                                position: "relative",
                                width: "10px",
                                height: "10px",
                                backgroundColor: "var(--brand-green)",
                                borderRadius: "50%",
                            }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Agent Online</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Claude Sonnet 3.5
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3"
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                    transition: "all 0.2s ease",
                                    opacity: isActive ? 1 : 0.72,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                        e.currentTarget.style.opacity = "1";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.opacity = "0.72";
                                    }
                                }}
                            >
                                <item.icon
                                    size={20}
                                    color={isActive ? "var(--brand-orange)" : "currentColor"}
                                />
                                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* XP Bar Bottom */}
            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Level 7 — Field Agent</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>2,450 XP</span>
                </div>
                <div
                    style={{
                        height: "8px",
                        backgroundColor: "var(--bg-hover)",
                        borderRadius: "var(--radius-full)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: "70%",
                            background: "linear-gradient(90deg, var(--brand-orange), var(--brand-blue))",
                            borderRadius: "var(--radius-full)",
                        }}
                    />
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}} />
        </aside>
    );
}
