"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Calendar, TrendingUp, Target, Award } from "lucide-react";

const MOTIVATIONAL_MESSAGES = [
    "Just getting started. The foundation is everything.",
    "Momentum is building. Keep showing up.",
    "You're past the hardest part. Consistency is key.",
    "A solid habit is forming. Don't break the chain!",
    "Phase 1 complete. Welcome to Growth.",
    "Halfway there. Look how far you've come.",
    "You're building something unstoppable.",
    "Phase 2 complete. Time to Scale.",
    "The finish line is in sight. Push through.",
    "Almost there. Finish strong!",
];

export default function Productivity() {
    const [days, setDays] = useState<boolean[]>(Array(90).fill(false));
    const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [notes, setNotes] = useState("");
    const [mounted, setMounted] = useState(false);

    // Load from localStorage
    useEffect(() => {
        setMounted(true);
        const savedDays = localStorage.getItem("mc_days");
        if (savedDays) setDays(JSON.parse(savedDays));

        const savedTodos = localStorage.getItem("mc_todos");
        if (savedTodos) setTodos(JSON.parse(savedTodos));

        const savedNotes = localStorage.getItem("mc_notes");
        if (savedNotes) setNotes(savedNotes);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("mc_days", JSON.stringify(days));
            localStorage.setItem("mc_todos", JSON.stringify(todos));
            localStorage.setItem("mc_notes", notes);
        }
    }, [days, todos, notes, mounted]);

    if (!mounted) return null;

    const completedDays = days.filter(Boolean).length;
    const progressPercent = Math.round((completedDays / 90) * 100);

    let currentStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i]) currentStreak++;
        else if (currentStreak > 0) break; // Stops at first false after true
    }

    let phase = "Foundation";
    if (completedDays > 60) phase = "Scale";
    else if (completedDays > 30) phase = "Growth";

    const messageIndex = Math.min(Math.floor((completedDays / 90) * 10), 9);
    const currentMessage = MOTIVATIONAL_MESSAGES[messageIndex];

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        setTodos([{ id: Date.now().toString(), text: newTodo, done: false }, ...todos]);
        setNewTodo("");
    };

    const toggleTodo = (id: string) => {
        setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTodo = (id: string) => {
        setTodos(todos.filter(t => t.id !== id));
    };

    return (
        <div className="flex-col gap-8" style={{ display: "flex", gap: "2rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Productivity
                </h1>
                <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
                    {currentMessage}
                </p>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                <StatCard title="Days Completed" value={`${completedDays}/90`} icon={Calendar} />
                <StatCard title="Current Streak" value={`${currentStreak} days`} icon={TrendingUp} />
                <StatCard title="Current Phase" value={phase} icon={Target} />
                <StatCard title="Progress" value={`${progressPercent}%`} icon={Award} />
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "1.5rem",
                    alignItems: "start",
                }}
            >
                {/* Main Column: Tracker & Notes */}
                <div className="flex-col gap-6" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* 90-Day Habit Tracker */}
                    <div className="card">
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                            90-Day Challenge
                        </h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(30, 1fr)",
                                gap: "4px",
                            }}
                        >
                            {days.map((isDone, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const newDays = [...days];
                                        newDays[index] = !newDays[index];
                                        setDays(newDays);
                                    }}
                                    style={{
                                        aspectRatio: "1/1",
                                        borderRadius: "2px",
                                        backgroundColor: isDone ? "var(--brand-green)" : "var(--bg-hover)",
                                        border: "1px solid var(--border-color)",
                                        transition: "all 0.2s ease",
                                        cursor: "pointer",
                                    }}
                                    title={`Day ${index + 1}`}
                                    onMouseEnter={(e) => {
                                        if (!isDone) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDone) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <span>Phase 1: Foundation (1-30)</span>
                            <span>Phase 2: Growth (31-60)</span>
                            <span>Phase 3: Scale (61-90)</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card flex-col" style={{ display: "flex", flex: 1 }}>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                            Scratchpad
                        </h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Jot down quick thoughts here..."
                            style={{
                                width: "100%",
                                minHeight: "200px",
                                backgroundColor: "var(--bg-page)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-md)",
                                padding: "1rem",
                                fontSize: "0.875rem",
                                resize: "vertical",
                                outline: "none",
                                flex: 1,
                            }}
                            onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                        />
                    </div>
                </div>

                {/* Right Column: Quick Todos */}
                <div className="card h-full flex-col" style={{ display: "flex", height: "100%", flexDirection: "column" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                        Quick Todos
                    </h2>

                    <form onSubmit={addTodo} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="Add a task..."
                            style={{
                                flex: 1,
                                backgroundColor: "var(--bg-page)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-md)",
                                padding: "0.5rem 0.75rem",
                                fontSize: "0.875rem",
                                outline: "none",
                            }}
                            onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                        />
                        <button
                            type="submit"
                            style={{
                                backgroundColor: "var(--brand-orange)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                padding: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </form>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, overflowY: "auto" }}>
                        {todos.length === 0 ? (
                            <p className="text-muted" style={{ fontSize: "0.875rem", textAlign: "center", marginTop: "2rem" }}>
                                All caught up!
                            </p>
                        ) : (
                            todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.75rem",
                                        padding: "0.75rem",
                                        backgroundColor: "var(--bg-elevated)",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--border-color)",
                                        opacity: todo.done ? 0.6 : 1,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        style={{
                                            marginTop: "2px",
                                            width: "18px",
                                            height: "18px",
                                            borderRadius: "4px",
                                            border: "1px solid",
                                            borderColor: todo.done ? "var(--brand-green)" : "var(--border-color)",
                                            backgroundColor: todo.done ? "var(--brand-green)" : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {todo.done && <Check size={12} color="#000" />}
                                    </button>
                                    <span
                                        style={{
                                            flex: 1,
                                            fontSize: "0.875rem",
                                            textDecoration: todo.done ? "line-through" : "none",
                                            color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {todo.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        style={{
                                            color: "var(--text-muted)",
                                            padding: "2px",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand-red)"}
                                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
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
            <div
                style={{
                    marginTop: "1rem",
                    height: "2px",
                    width: "100%",
                    background: "linear-gradient(90deg, var(--brand-blue), transparent)",
                    borderRadius: "2px",
                    opacity: 0.5,
                }}
            />
        </div>
    );
}
