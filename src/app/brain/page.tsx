"use client";

import { useState, useEffect } from "react";
import { Search, Code2, FileText, Lightbulb, FileBox, Image as ImageIcon, ChevronDown, ChevronUp, Loader2, Brain, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ItemType = "All" | "Code" | "Text" | "Idea" | "PDF" | "Image" | "Fact";

interface BrainMemory {
    id: string;
    content: string;
    category: string;
    source: "sqlite" | "pinecone";
    timestamp: string;
}

interface BrainEntity {
    id: string;
    key: string;
    value: string;
    category: string;
    confidence: number;
    updated_at: string;
}

interface DisplayItem {
    id: string;
    type: ItemType;
    title: string;
    snippet: string;
    content: string;
    timestamp: string;
    source?: string;
    confidence?: number;
}

// Map category to display type
function categoryToType(category: string, isEntity: boolean): ItemType {
    if (isEntity) return "Fact";

    const cat = category.toLowerCase();
    if (cat.includes("code") || cat.includes("snippet")) return "Code";
    if (cat.includes("idea") || cat.includes("brainstorm")) return "Idea";
    if (cat.includes("pdf") || cat.includes("document")) return "PDF";
    if (cat.includes("image") || cat.includes("visual")) return "Image";
    return "Text";
}

export default function SecondBrain() {
    const [memories, setMemories] = useState<BrainMemory[]>([]);
    const [entities, setEntities] = useState<BrainEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<ItemType>("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filters: { name: ItemType; icon: typeof Search }[] = [
        { name: "All", icon: Search },
        { name: "Fact", icon: User },
        { name: "Code", icon: Code2 },
        { name: "Text", icon: FileText },
        { name: "Idea", icon: Lightbulb },
        { name: "PDF", icon: FileBox },
        { name: "Image", icon: ImageIcon },
    ];

    // Fetch data from Supabase
    useEffect(() => {
        fetchBrainData();

        // Subscribe to real-time changes
        const channel = supabase
            .channel("brain_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "brain_memories" },
                () => fetchBrainData()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "brain_entities" },
                () => fetchBrainData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchBrainData = async () => {
        try {
            const [memoriesRes, entitiesRes] = await Promise.all([
                supabase
                    .from("brain_memories")
                    .select("*")
                    .order("timestamp", { ascending: false })
                    .limit(100),
                supabase
                    .from("brain_entities")
                    .select("*")
                    .order("updated_at", { ascending: false })
                    .limit(50),
            ]);

            if (memoriesRes.data) setMemories(memoriesRes.data);
            if (entitiesRes.data) setEntities(entitiesRes.data);
        } catch (error) {
            console.error("Failed to fetch brain data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Combine memories and entities into display items
    const displayItems: DisplayItem[] = [
        ...memories.map((m) => ({
            id: `memory-${m.id}`,
            type: categoryToType(m.category, false) as ItemType,
            title: m.content.slice(0, 50) + (m.content.length > 50 ? "..." : ""),
            snippet: m.content.slice(0, 100) + (m.content.length > 100 ? "..." : ""),
            content: m.content,
            timestamp: m.timestamp,
            source: m.source,
        })),
        ...entities.map((e) => ({
            id: `entity-${e.id}`,
            type: "Fact" as ItemType,
            title: e.key,
            snippet: e.value.slice(0, 80) + (e.value.length > 80 ? "..." : ""),
            content: e.value,
            timestamp: e.updated_at,
            confidence: e.confidence,
        })),
    ];

    // Sort by timestamp descending
    displayItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filteredItems = displayItems.filter((item) => {
        const matchesFilter = activeFilter === "All" || item.type === activeFilter;
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getTypeColor = (type: ItemType) => {
        switch (type) {
            case "Idea": return "var(--brand-orange)";
            case "Code": return "var(--brand-blue)";
            case "Text": return "var(--text-primary)";
            case "PDF": return "var(--brand-red)";
            case "Image": return "var(--brand-green)";
            case "Fact": return "var(--brand-purple, #a855f7)";
            default: return "var(--text-muted)";
        }
    };

    const getTypeIcon = (type: ItemType, color: string) => {
        switch (type) {
            case "Idea": return <Lightbulb size={16} color={color} />;
            case "Code": return <Code2 size={16} color={color} />;
            case "Text": return <FileText size={16} color={color} />;
            case "PDF": return <FileBox size={16} color={color} />;
            case "Image": return <ImageIcon size={16} color={color} />;
            case "Fact": return <User size={16} color={color} />;
            default: return <Search size={16} color={color} />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="flex-col gap-8" style={{ display: "flex", flex: 1, gap: "2rem", height: "100%" }}>
            {/* Header & Search */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Second Brain</h1>
                <p className="text-secondary" style={{ fontSize: "1rem", textAlign: "center", maxWidth: "500px" }}>
                    Your agent&apos;s memory bank. Search across all stored memories, facts, and knowledge.
                </p>

                <div style={{ position: "relative", width: "100%", maxWidth: "600px", marginTop: "1rem" }}>
                    <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search memories, facts, and knowledge..."
                        style={{
                            width: "100%",
                            padding: "1rem 1rem 1rem 3rem",
                            backgroundColor: "var(--bg-elevated)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-full)",
                            color: "var(--text-primary)",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "var(--brand-blue)";
                            e.currentTarget.style.boxShadow = "0 4px 24px rgba(90, 156, 245, 0.15)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
                        }}
                    />
                </div>

                {/* Type Selector Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                    {filters.map((f) => (
                        <button
                            key={f.name}
                            onClick={() => setActiveFilter(f.name)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-full)",
                                border: "1px solid",
                                borderColor: activeFilter === f.name ? "var(--brand-orange)" : "var(--border-color)",
                                backgroundColor: activeFilter === f.name ? "rgba(229, 133, 15, 0.1)" : "var(--bg-elevated)",
                                color: activeFilter === f.name ? "var(--brand-orange)" : "var(--text-secondary)",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (activeFilter !== f.name) {
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter !== f.name) {
                                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }
                            }}
                        >
                            <f.icon size={16} />
                            {f.name}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    <span><Brain size={14} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />{memories.length} memories</span>
                    <span><User size={14} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />{entities.length} facts</span>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--brand-orange)" }} />
                    <p className="text-secondary" style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Loading brain data...</p>
                </div>
            ) : (
                /* Data Grid */
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                    {filteredItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                            <Search size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                            <p>No memories found matching your query.</p>
                            {memories.length === 0 && entities.length === 0 && (
                                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                                    Start chatting with your agent to build your second brain!
                                </p>
                            )}
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const isExpanded = expandedId === item.id;
                            const typeColor = getTypeColor(item.type);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                    style={{
                                        backgroundColor: "var(--bg-card)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "var(--radius-md)",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isExpanded) e.currentTarget.style.borderColor = "var(--border-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isExpanded) e.currentTarget.style.borderColor = "var(--border-color)";
                                    }}
                                >
                                    {/* collapsed view */}
                                    <div style={{ display: "flex", alignItems: "center", padding: "1.25rem", gap: "1rem" }}>
                                        <div
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "8px",
                                                backgroundColor: "var(--bg-elevated)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {getTypeIcon(item.type, typeColor)}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
                                                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {item.title}
                                                </h3>
                                                <span className="text-muted" style={{ fontSize: "0.75rem", flexShrink: 0, marginLeft: "1rem" }}>
                                                    {formatTimestamp(item.timestamp)}
                                                </span>
                                            </div>
                                            {!isExpanded && (
                                                <p className="text-secondary" style={{ fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {item.snippet}
                                                </p>
                                            )}
                                        </div>

                                        <div style={{ color: "var(--text-muted)" }}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    {isExpanded && (
                                        <div
                                            className="animate-fade-in"
                                            style={{
                                                padding: "0 1.25rem 1.25rem 1.25rem",
                                                borderTop: "1px solid var(--border-color)",
                                                marginTop: "0.5rem",
                                                paddingTop: "1.25rem",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div style={{
                                                backgroundColor: "var(--bg-elevated)",
                                                padding: "1rem",
                                                borderRadius: "var(--radius-sm)",
                                                border: "1px solid var(--border-color)",
                                            }}>
                                                <pre style={{
                                                    margin: 0,
                                                    whiteSpace: "pre-wrap",
                                                    wordWrap: "break-word",
                                                    fontFamily: item.type === "Code" ? "var(--font-geist-mono), monospace" : "inherit",
                                                    fontSize: "0.875rem",
                                                    color: "var(--text-primary)",
                                                    lineHeight: 1.6,
                                                }}>
                                                    {item.content}
                                                </pre>
                                            </div>
                                            {/* Metadata */}
                                            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                {item.source && (
                                                    <span>Source: {item.source}</span>
                                                )}
                                                {item.confidence !== undefined && (
                                                    <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                                                )}
                                                <span>Type: {item.type}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-fade-in {
                        animation: fadeIn 0.2s ease;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}}
            />
        </div>
    );
}
