"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Wrench, RefreshCw, Clock, Activity, Play, FileText, Bot, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Activity {
  id: string;
  action: string;
  details: Record<string, unknown>;
  status: string;
  created_at: string;
}

interface Stats {
  messagesTotal: number;
  messagesToday: number;
  toolCallsTotal: number;
  toolCallsToday: number;
  contentSynced: number;
  totalCost: number;
}

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({
    messagesTotal: 0,
    messagesToday: 0,
    toolCallsTotal: 0,
    toolCallsToday: 0,
    contentSynced: 0,
    totalCost: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchInitialActivities();

    // Listen to activity_log table for real-time changes
    const channel = supabase
      .channel("activity_log_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log" },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev].slice(0, 50));
          // Refresh stats when new activity comes in
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Get activity counts
      const { count: messagesTotal } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .in("action", ["message_received", "reply_sent"]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: messagesToday } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .in("action", ["message_received", "reply_sent"])
        .gte("created_at", today.toISOString());

      const { count: toolCallsTotal } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "tool_call");

      const { count: toolCallsToday } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "tool_call")
        .gte("created_at", today.toISOString());

      const { count: contentSynced } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "content_sync");

      // Get cost data
      const { data: costData } = await supabase
        .from("cost_log")
        .select("cost_usd");

      const totalCost = costData?.reduce((sum, row) => sum + (Number(row.cost_usd) || 0), 0) || 0;

      setStats({
        messagesTotal: messagesTotal || 0,
        messagesToday: messagesToday || 0,
        toolCallsTotal: toolCallsTotal || 0,
        toolCallsToday: toolCallsToday || 0,
        contentSynced: contentSynced || 0,
        totalCost,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchInitialActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Supabase error:", error.message, error.details, error.hint);
        throw error;
      }
      setActivities(data || []);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const sendCommand = useCallback(async (command: string, payload: Record<string, unknown> = {}) => {
    setActionLoading(command);
    setActionSuccess(null);

    try {
      const { error } = await supabase.from("agent_commands").insert({
        command,
        payload,
        status: "pending",
      });

      if (error) {
        console.error("Supabase error:", error.message, error.details, error.hint);
        throw error;
      }
      setActionSuccess(command);
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (error) {
      console.error("Failed to send command:", error);
      alert("Failed to send command: " + (error instanceof Error ? error.message : JSON.stringify(error)));
    } finally {
      setActionLoading(null);
    }
  }, []);

  return (
    <div className="flex-col gap-8" style={{ display: "flex", gap: "2rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>
          Command Center
        </h1>
        <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
          Real-time overview of your agent's operations and performance.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <StatCard
          title="Messages Handled"
          value={loadingStats ? "..." : stats.messagesTotal.toLocaleString()}
          change={`+${stats.messagesToday} today`}
          icon={MessageSquare}
        />
        <StatCard
          title="Tool Calls"
          value={loadingStats ? "..." : stats.toolCallsTotal.toLocaleString()}
          change={`+${stats.toolCallsToday} today`}
          icon={Wrench}
        />
        <StatCard
          title="Content Synced"
          value={loadingStats ? "..." : stats.contentSynced.toString()}
          change="Total items"
          icon={RefreshCw}
        />
        <StatCard
          title="Total Cost"
          value={loadingStats ? "..." : `$${stats.totalCost.toFixed(4)}`}
          change="LLM usage"
          icon={Clock}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Live Activity Feed */}
        <div className="card h-full flex-col" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem", gap: "1rem", display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Live Activity Feed</h2>
            <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "var(--brand-green)",
                  borderRadius: "50%",
                }}
              />
              <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                Live
              </span>
            </div>
          </div>

          <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activities.length > 0 ? (
              activities.map((act) => (
                <ActivityItem key={act.id} action={act.action} details={act.details} timestamp={act.created_at} />
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <Activity size={24} className="text-muted" style={{ margin: "0 auto 0.5rem" }} />
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                  Waiting for agent activity...
                </p>
                <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Make sure Supabase is connected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Config & Quick Actions */}
        <div className="flex-col gap-6" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Agent Configuration */}
          <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              Agent Configuration
            </h2>
            <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <ConfigRow label="Model" value="GLM-4.5" />
              <ConfigRow label="Provider" value="Zhipu AI" />
              <ConfigRow label="Memory Stack" value="Pinecone + SQLite" />
              <ConfigRow label="Heartbeat" value="08:00 Daily" />
              <ConfigRow label="Sync Schedule" value="Real-time" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              Quick Actions
            </h2>
            <div className="flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <ActionButton
                icon={actionLoading === "heartbeat" ? Loader2 : actionSuccess === "heartbeat" ? Check : Play}
                label="Send Heartbeat"
                onClick={() => sendCommand("heartbeat", { prompt: "Quick check-in from Mission Control!" })}
                loading={actionLoading === "heartbeat"}
                success={actionSuccess === "heartbeat"}
              />
              <ActionButton
                icon={actionLoading === "sync_content" ? Loader2 : actionSuccess === "sync_content" ? Check : RefreshCw}
                label="Sync Content"
                onClick={() => sendCommand("sync_content")}
                loading={actionLoading === "sync_content"}
                success={actionSuccess === "sync_content"}
              />
              <ActionButton
                icon={actionLoading === "daily_brief" ? Loader2 : actionSuccess === "daily_brief" ? Check : FileText}
                label="Run Daily Brief"
                onClick={() => sendCommand("daily_brief")}
                loading={actionLoading === "daily_brief"}
                success={actionSuccess === "daily_brief"}
              />
              <ActionButton
                icon={actionLoading === "restart" ? Loader2 : Bot}
                label="Restart Agent"
                variant="danger"
                onClick={() => {
                  if (confirm("Are you sure you want to restart the agent?")) {
                    sendCommand("restart");
                  }
                }}
                loading={actionLoading === "restart"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon }: { title: string; value: string; change: string; icon: any }) {
  return (
    <div className="card">
      <div
        className="flex justify-between items-center"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}
      >
        <span className="text-secondary" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
          {title}
        </span>
        <Icon size={18} className="text-muted" />
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.25rem" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--brand-green)" }}>{change}</div>
      <div
        style={{
          marginTop: "1rem",
          height: "2px",
          width: "100%",
          background: "linear-gradient(90deg, var(--brand-orange), transparent)",
          borderRadius: "2px",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="text-secondary" style={{ fontSize: "0.875rem" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  variant = "default",
  onClick,
  loading,
  success,
}: {
  icon: any;
  label: string;
  variant?: "default" | "danger";
  onClick?: () => void;
  loading?: boolean;
  success?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        backgroundColor: success ? "rgba(34, 197, 94, 0.1)" : "var(--bg-elevated)",
        border: `1px solid ${success ? "var(--brand-green)" : "var(--border-color)"}`,
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 500,
        color: variant === "danger" ? "var(--brand-red)" : success ? "var(--brand-green)" : "var(--text-primary)",
        transition: "all 0.2s ease",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = variant === "danger" ? "var(--brand-red)" : success ? "var(--brand-green)" : "var(--border-hover)";
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = success ? "var(--brand-green)" : "var(--border-color)";
        e.currentTarget.style.backgroundColor = success ? "rgba(34, 197, 94, 0.1)" : "var(--bg-elevated)";
      }}
    >
      <Icon size={16} className={loading ? "animate-spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
      {loading ? "Sending..." : label}
    </button>
  );
}

function ActivityItem({ action, details, timestamp }: { action: string; details?: Record<string, unknown>; timestamp: string }) {
  // Format action for display
  const formatAction = (act: string): string => {
    return act
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get a preview from details
  const getPreview = (): string | null => {
    if (!details) return null;
    if (details.preview) return String(details.preview);
    if (details.tool) return `Tool: ${details.tool}`;
    if (details.command) return `Command: ${details.command}`;
    return null;
  };

  const preview = getPreview();

  return (
    <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
      <div
        style={{
          width: "32px",
          height: "32px",
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Activity size={14} className="text-primary" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.875rem", marginBottom: "0.25rem", fontWeight: 500 }}>{formatAction(action)}</p>
        {preview && (
          <p className="text-secondary" style={{ fontSize: "0.75rem", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {preview}
          </p>
        )}
        <p className="text-muted" style={{ fontSize: "0.75rem" }}>
          {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
