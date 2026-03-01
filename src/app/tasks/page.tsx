"use client";

import { useState, useEffect } from "react";
import { User, Bot, Plus, ArrowRight, ArrowLeft, Trash2, GripVertical, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Priority = "high" | "medium" | "low";
type Assignee = "human" | "agent";
type Status = "pending" | "in_progress" | "completed";

interface Task {
    id: string;
    title: string;
    description: string | null;
    assignee: Assignee;
    priority: Priority;
    status: Status;
    result: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
    const [activeColumn, setActiveColumn] = useState<Assignee>("human");
    const [addingTask, setAddingTask] = useState(false);

    // Fetch tasks on mount and subscribe to changes
    useEffect(() => {
        fetchTasks();

        // Subscribe to real-time changes
        const channel = supabase
            .channel("tasks_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks" },
                () => {
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || addingTask) return;

        setAddingTask(true);
        try {
            const { error } = await supabase.from("tasks").insert({
                title: newTaskTitle,
                assignee: activeColumn,
                priority: newTaskPriority,
                status: "pending",
            });

            if (error) throw error;
            setNewTaskTitle("");
        } catch (error) {
            console.error("Failed to add task:", error);
            alert("Failed to add task");
        } finally {
            setAddingTask(false);
        }
    };

    const moveTask = async (id: string, newAssignee: Assignee) => {
        // Optimistic update
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, assignee: newAssignee } : t)));

        try {
            const { error } = await supabase
                .from("tasks")
                .update({ assignee: newAssignee, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to move task:", error);
            fetchTasks(); // Revert on error
        }
    };

    const deleteTask = async (id: string) => {
        // Optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== id));

        try {
            const { error } = await supabase.from("tasks").delete().eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to delete task:", error);
            fetchTasks(); // Revert on error
        }
    };

    const completeTask = async (id: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, status: "completed" as Status, completed_at: new Date().toISOString() }
                    : t
            )
        );

        try {
            const { error } = await supabase
                .from("tasks")
                .update({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to complete task:", error);
            fetchTasks();
        }
    };

    const getPriorityColor = (priority: Priority) => {
        if (priority === "high") return "var(--brand-orange)";
        if (priority === "medium") return "var(--brand-blue)";
        return "var(--text-muted)";
    };

    // Filter active tasks (not completed)
    const activeTasks = tasks.filter((t) => t.status !== "completed");
    const humanTasks = activeTasks.filter((t) => t.assignee === "human");
    const agentTasks = activeTasks.filter((t) => t.assignee === "agent");
    const completedTasks = tasks.filter((t) => t.status === "completed");

    return (
        <div className="flex-col gap-8" style={{ display: "flex", flex: 1, gap: "2rem", height: "100%" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Tasks & Projects
                </h1>
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                    Human-Agent collaborative workspace. Assign tasks seamlessly across the team.
                </p>
            </div>

            {/* Add Task Control */}
            <div className="card" style={{ padding: "1rem" }}>
                <form onSubmit={addTask} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ flex: 1, display: "flex", backgroundColor: "var(--bg-page)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0 1rem",
                                color: "var(--text-muted)",
                                backgroundColor: "var(--bg-hover)",
                                borderRight: "1px solid var(--border-color)",
                                fontSize: "0.875rem",
                            }}
                        >
                            Add to:
                            <select
                                value={activeColumn}
                                onChange={(e) => setActiveColumn(e.target.value as Assignee)}
                                style={{
                                    background: "transparent",
                                    color: "var(--text-primary)",
                                    border: "none",
                                    outline: "none",
                                    marginLeft: "0.5rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                <option value="human" style={{ backgroundColor: "var(--bg-elevated)" }}>Human</option>
                                <option value="agent" style={{ backgroundColor: "var(--bg-elevated)" }}>Agent</option>
                            </select>
                        </span>
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            disabled={addingTask}
                            style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                color: "var(--text-primary)",
                                border: "none",
                                padding: "0.75rem 1rem",
                                fontSize: "0.875rem",
                                outline: "none",
                            }}
                        />
                        <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                            style={{
                                background: "transparent",
                                color: getPriorityColor(newTaskPriority),
                                border: "none",
                                borderLeft: "1px solid var(--border-color)",
                                padding: "0 1rem",
                                outline: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                            }}
                        >
                            <option value="low" style={{ backgroundColor: "var(--bg-elevated)", color: getPriorityColor("low") }}>Low Priority</option>
                            <option value="medium" style={{ backgroundColor: "var(--bg-elevated)", color: getPriorityColor("medium") }}>Med Priority</option>
                            <option value="high" style={{ backgroundColor: "var(--bg-elevated)", color: getPriorityColor("high") }}>High Priority</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={addingTask}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "var(--brand-blue)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            cursor: addingTask ? "wait" : "pointer",
                            opacity: addingTask ? 0.7 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        {addingTask ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
                        Add
                    </button>
                </form>
            </div>

            {/* Loading State */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--brand-orange)" }} />
                    <p className="text-secondary" style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Loading tasks...</p>
                </div>
            ) : (
                /* Dual Column Kanban */
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "2rem",
                        alignItems: "start",
                        height: "100%",
                    }}
                >
                    {/* Human Column */}
                    <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.5rem", borderBottom: "2px solid var(--brand-orange)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <User size={20} color="var(--brand-orange)" />
                                <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Human</h2>
                            </div>
                            <div style={{ backgroundColor: "rgba(229, 133, 15, 0.1)", color: "var(--brand-orange)", padding: "0.125rem 0.625rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 700 }}>
                                {humanTasks.length}
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {humanTasks.length === 0 && (
                                <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
                                    <p className="text-secondary" style={{ fontSize: "0.875rem" }}>No human tasks pending.</p>
                                </div>
                            )}
                            {humanTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onMove={() => moveTask(task.id, "agent")}
                                    onDelete={() => deleteTask(task.id)}
                                    onComplete={() => completeTask(task.id)}
                                    align="human"
                                    getPriorityColor={getPriorityColor}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Agent Column */}
                    <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.5rem", borderBottom: "2px solid var(--brand-green)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Bot size={20} color="var(--brand-green)" />
                                <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Agent</h2>
                            </div>
                            <div style={{ backgroundColor: "rgba(46, 204, 143, 0.1)", color: "var(--brand-green)", padding: "0.125rem 0.625rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 700 }}>
                                {agentTasks.length}
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {agentTasks.length === 0 && (
                                <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
                                    <p className="text-secondary" style={{ fontSize: "0.875rem" }}>No agent tasks pending.</p>
                                </div>
                            )}
                            {agentTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onMove={() => moveTask(task.id, "human")}
                                    onDelete={() => deleteTask(task.id)}
                                    onComplete={() => completeTask(task.id)}
                                    align="agent"
                                    getPriorityColor={getPriorityColor}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Tasks with Results */}
            {completedTasks.length > 0 && (
                <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <CheckCircle2 size={18} color="var(--brand-green)" />
                        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
                            Completed Tasks ({completedTasks.length})
                        </h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {completedTasks.map((task) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: "0.75rem 1rem",
                                    backgroundColor: "var(--bg-page)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border-color)",
                                    opacity: 0.85,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: task.result ? "0.5rem" : 0 }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: "0.875rem", fontWeight: 500, textDecoration: "line-through", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                            {task.title}
                                        </h4>
                                        {task.completed_at && (
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                {new Date(task.completed_at).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        padding: "0.125rem 0.5rem",
                                        borderRadius: "var(--radius-full)",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        backgroundColor: task.assignee === "agent" ? "rgba(46, 204, 143, 0.1)" : "rgba(229, 133, 15, 0.1)",
                                        color: task.assignee === "agent" ? "var(--brand-green)" : "var(--brand-orange)",
                                    }}>
                                        {task.assignee === "agent" ? "🤖 Agent" : "👤 Human"}
                                    </div>
                                </div>
                                {task.result && (
                                    <div style={{
                                        marginTop: "0.5rem",
                                        padding: "0.75rem",
                                        backgroundColor: "var(--bg-elevated)",
                                        borderRadius: "var(--radius-sm)",
                                        borderLeft: "3px solid var(--brand-green)",
                                    }}>
                                        <div style={{ fontSize: "0.7rem", color: "var(--brand-green)", marginBottom: "0.25rem", fontWeight: 600 }}>
                                            OUTPUT
                                        </div>
                                        <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }}>
                                            {task.result}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}}
            />
        </div>
    );
}

function TaskCard({
    task,
    onMove,
    onDelete,
    onComplete,
    align,
    getPriorityColor,
}: {
    task: Task;
    onMove: () => void;
    onDelete: () => void;
    onComplete: () => void;
    align: Assignee;
    getPriorityColor: (p: Priority) => string;
}) {
    return (
        <div
            className="card"
            style={{
                padding: "1rem",
                display: "flex",
                alignItems: "stretch",
                gap: "0.75rem",
                transition: "all 0.2s ease",
                position: "relative",
            }}
        >
            <div style={{ marginTop: "2px" }}>
                <GripVertical size={16} className="text-muted" style={{ cursor: "grab" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.4, color: "var(--text-primary)" }}>
                    {task.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            backgroundColor: "var(--bg-page)",
                            padding: "0.125rem 0.5rem",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid var(--border-color)",
                        }}
                    >
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getPriorityColor(task.priority) }} />
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{task.priority} Priority</span>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
                <button
                    onClick={onDelete}
                    style={{ color: "var(--text-muted)", backgroundColor: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand-red)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                    title="Delete Task"
                >
                    <Trash2 size={14} />
                </button>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {align === "agent" && (
                        <button
                            onClick={onComplete}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: "var(--bg-page)",
                                border: "1px solid var(--brand-green)",
                                color: "var(--brand-green)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            title="Mark Complete"
                        >
                            <CheckCircle2 size={14} />
                        </button>
                    )}
                    <button
                        onClick={onMove}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-page)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-page)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                        title={`Move to ${align === "human" ? "Agent" : "Human"}`}
                    >
                        {align === "human" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
