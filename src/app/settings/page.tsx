"use client";

import { useState, useEffect } from "react";
import { Save, Check, Loader2, Settings2, Sliders } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ConfigItem {
    id: string;
    category: string;
    key: string;
    value: string | null;
    updated_at: string;
}

// Default system prompt
const DEFAULT_PROMPT = `You are Gravity Claw, a personal AI agent running locally on the user's machine.
You have access to a persistent long-term memory, shell commands, filesystem tools, and external MCP integrations.

Guidelines:
- When the user tells you something important, proactively save it to memory.
- When asked about something you might have stored, search your memory first.
- For shell commands: NEVER chain destructive commands. The system will ask for confirmation on dangerous ones.
- Be helpful, concise, and secure.`;

export default function Settings() {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [savedPrompt, setSavedPrompt] = useState(false);

    const [config, setConfig] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from("bot_config")
                .select("*")
                .order("category", { ascending: true });

            if (error) throw error;
            setConfig(data || []);
        } catch (error) {
            console.error("Failed to fetch config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompt = async () => {
        setIsSavingPrompt(true);
        setSavedPrompt(false);

        try {
            // In a real implementation, you would save this to a system_prompt config entry
            // For now, we'll just show success
            await new Promise((res) => setTimeout(res, 500));
            setSavedPrompt(true);
            setTimeout(() => setSavedPrompt(false), 2000);
        } catch (error) {
            console.error("Failed to save prompt:", error);
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const updateConfigValue = async (id: string, newValue: string) => {
        // Optimistic update
        setConfig(config.map((c) => (c.id === id ? { ...c, value: newValue } : c)));

        try {
            const { error } = await supabase
                .from("bot_config")
                .update({ value: newValue, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to update config:", error);
            // Revert on error
            fetchConfig();
        }
    };

    // Group by category
    const groupedConfig = config.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, typeof config>);

    return (
        <div className="flex-col gap-8" style={{ display: "flex", flex: 1, gap: "2rem", maxWidth: "900px" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>Settings</h1>
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                    Control panel for your agent's personality and configuration.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Personality & Character */}
                <div className="card flex-col" style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: "rgba(90, 156, 245, 0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Settings2 size={16} color="var(--brand-blue)" />
                            </div>
                            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Personality & Character</h2>
                        </div>

                        <button
                            onClick={handleSavePrompt}
                            disabled={isSavingPrompt}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 1rem",
                                backgroundColor: savedPrompt ? "var(--brand-green)" : "var(--brand-orange)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                transition: "all 0.2s ease",
                                cursor: isSavingPrompt ? "default" : "pointer",
                                minWidth: "100px",
                            }}
                        >
                            {isSavingPrompt ? (
                                <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                            ) : savedPrompt ? (
                                <>
                                    <Check size={16} /> Saved
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Save
                                </>
                            )}
                        </button>
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter the master system prompt..."
                        style={{
                            width: "100%",
                            minHeight: "240px",
                            backgroundColor: "var(--bg-page)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "1rem",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            resize: "vertical",
                            outline: "none",
                            fontFamily: "var(--font-geist-mono), monospace",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                    />
                </div>

                {/* Configuration Groupings */}
                <div className="card flex-col" style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: "rgba(229, 133, 15, 0.1)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Sliders size={16} color="var(--brand-orange)" />
                        </div>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Configuration</h2>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "2rem" }}>
                                <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--brand-orange)" }} />
                                <p className="text-secondary" style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Loading configuration...</p>
                            </div>
                        ) : Object.keys(groupedConfig).length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
                                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>No configuration found. Make sure Supabase is connected and the bot_config table exists.</p>
                            </div>
                        ) : (
                            Object.entries(groupedConfig).map(([category, items]) => (
                            <div key={category} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {category}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                                    {items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "0.75rem 1rem",
                                                backgroundColor: "var(--bg-elevated)",
                                                borderBottom: index < items.length - 1 ? "1px solid var(--border-color)" : "none",
                                            }}
                                        >
                                            <div style={{ flex: 1, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                                {item.key}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    defaultValue={item.value ?? ""}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== item.value) {
                                                            updateConfigValue(item.id, e.target.value);
                                                        }
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        backgroundColor: "transparent",
                                                        color: "var(--text-primary)",
                                                        border: "1px solid transparent",
                                                        borderRadius: "var(--radius-sm)",
                                                        padding: "0.5rem",
                                                        fontSize: "0.875rem",
                                                        outline: "none",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.backgroundColor = "var(--bg-hover)";
                                                        e.target.style.borderColor = "var(--border-color)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (document.activeElement !== e.target) {
                                                            e.currentTarget.style.backgroundColor = "transparent";
                                                            e.currentTarget.style.borderColor = "transparent";
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
        </div>
    );
}
