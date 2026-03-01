"use client";

import { useState } from "react";
import { Link2, X, Plus, Terminal, Youtube, MessageSquare, Twitter, Mail } from "lucide-react";

// Mock data initially
const API_CONNECTIONS = [
    { id: "zhipu", name: "Zhipu AI GLM-4.5", status: "active", icon: Terminal, isZapier: false },
    { id: "render", name: "Render", status: "active", icon: Terminal, isZapier: false },
    { id: "supabase", name: "Supabase Vector", status: "active", icon: Terminal, isZapier: false },
    { id: "youtube", name: "YouTube Analytics", status: "active", icon: Youtube, isZapier: true },
    { id: "discord", name: "Discord Bot", status: "inactive", icon: MessageSquare, isZapier: false },
    { id: "twitter", name: "Twitter / X", status: "inactive", icon: Twitter, isZapier: true },
    { id: "gmail", name: "Gmail", status: "inactive", icon: Mail, isZapier: true },
];

export default function Connections() {
    const [connections, setConnections] = useState(API_CONNECTIONS);

    const activeCount = connections.filter((c) => c.status === "active").length;
    const totalCount = connections.length;
    const progressPercent = Math.round((activeCount / totalCount) * 100);

    const toggleStatus = (id: string, currentStatus: string) => {
        setConnections(connections.map((c) => {
            if (c.id === id) {
                return { ...c, status: currentStatus === "active" ? "inactive" : "active" };
            }
            return c;
        }));
    };

    return (
        <div className="flex-col gap-8" style={{ display: "flex", flex: 1, gap: "2rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Connections
                </h1>
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                    Manage your agent's integrations and external capabilities.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Integration Progress</span>
                    <span className="text-secondary" style={{ fontSize: "0.875rem" }}>
                        {activeCount} / {totalCount} connected
                    </span>
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
                            width: `${progressPercent}%`,
                            background: "linear-gradient(90deg, var(--brand-orange), var(--brand-blue))",
                            borderRadius: "var(--radius-full)",
                            transition: "width 0.5s ease-out",
                        }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {connections.map((conn) => {
                    const isActive = conn.status === "active";
                    return (
                        <div
                            key={conn.id}
                            className="card"
                            style={{
                                position: "relative",
                                borderStyle: isActive ? "solid" : "dashed",
                                borderColor: isActive ? "var(--border-color)" : "var(--text-disabled)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                            }}
                        >
                            {/* Top Row: Icon + Badges */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                                        border: isActive ? "none" : "1px solid var(--border-color)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <conn.icon
                                        size={24}
                                        color={isActive ? "var(--text-primary)" : "var(--text-muted)"}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-full)",
                                            backgroundColor: isActive ? "rgba(46, 204, 143, 0.1)" : "rgba(255, 255, 255, 0.05)",
                                            color: isActive ? "var(--brand-green)" : "var(--text-muted)",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "6px",
                                                height: "6px",
                                                borderRadius: "50%",
                                                backgroundColor: isActive ? "var(--brand-green)" : "var(--text-muted)",
                                            }}
                                        />
                                        {isActive ? "Connected" : "Disconnected"}
                                    </div>
                                    {conn.isZapier && (
                                        <div
                                            style={{
                                                padding: "0.125rem 0.375rem",
                                                borderRadius: "var(--radius-sm)",
                                                backgroundColor: "var(--brand-orange)",
                                                color: "#fff",
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                opacity: isActive ? 1 : 0.5,
                                            }}
                                        >
                                            via Zapier
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title & Action */}
                            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                                    {conn.name}
                                </h3>
                            </div>

                            {/* Connect / Disconnect Action overlay/button */}
                            {isActive ? (
                                <button
                                    onClick={() => toggleStatus(conn.id, conn.status)}
                                    style={{
                                        position: "absolute",
                                        top: "1rem",
                                        right: "1rem",
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "50%",
                                        backgroundColor: "rgba(217, 85, 85, 0.1)",
                                        color: "var(--brand-red)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: 0,
                                        transition: "opacity 0.2s ease",
                                    }}
                                    title="Disconnect"
                                    className="disconnect-btn"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "rgba(217, 85, 85, 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "rgba(217, 85, 85, 0.1)";
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => toggleStatus(conn.id, conn.status)}
                                    style={{
                                        width: "100%",
                                        marginTop: "0.5rem",
                                        padding: "0.75rem",
                                        borderRadius: "var(--radius-md)",
                                        backgroundColor: "var(--bg-elevated)",
                                        color: "var(--text-primary)",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                        border: "1px solid var(--border-color)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                                >
                                    <Plus size={16} />
                                    Connect
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        .card:hover .disconnect-btn {
          opacity: 1 !important;
        }
      `}} />
        </div>
    );
}
