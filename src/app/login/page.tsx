"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Shield, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ passcode }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push(redirect);
                router.refresh();
            } else {
                setError("Codice di accesso non valido");
            }
        } catch (err) {
            setError("Errore di connessione. Riprova.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
                <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Codice di accesso"
                    autoFocus
                    style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        backgroundColor: "var(--bg-page)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "1rem",
                        textAlign: "center",
                        letterSpacing: "0.5em",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                />
            </div>

            {error && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "var(--radius-md)",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !passcode}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    backgroundColor: "var(--brand-blue)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: loading || !passcode ? "default" : "pointer",
                    opacity: !passcode ? 0.5 : 1,
                    transition: "all 0.2s ease",
                }}
            >
                {loading ? (
                    <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Verifica...
                    </>
                ) : (
                    <>
                        <Lock size={16} />
                        Accedi
                    </>
                )}
            </button>
        </form>
    );
}

function LoginLoading() {
    return (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--brand-blue)" }} />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-page)",
            padding: "1rem",
        }}>
            <div style={{
                width: "100%",
                maxWidth: "400px",
            }}>
                {/* Logo/Brand */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                    marginBottom: "2rem",
                }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "rgba(90, 156, 245, 0.1)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Shield size={24} color="var(--brand-blue)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                            Mission Control
                        </h1>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Gravity Claw Dashboard
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="card" style={{
                    padding: "2rem",
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginBottom: "1.5rem",
                    }}>
                        <div style={{
                            width: "56px",
                            height: "56px",
                            backgroundColor: "rgba(90, 156, 245, 0.1)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "1rem",
                        }}>
                            <Lock size={24} color="var(--brand-blue)" />
                        </div>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                            Accesso Protetto
                        </h2>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            Inserisci il codice di sicurezza
                        </p>
                    </div>

                    <Suspense fallback={<LoginLoading />}>
                        <LoginForm />
                    </Suspense>
                </div>

                {/* Security Notice */}
                <p style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginTop: "1.5rem",
                }}>
                    Connessione protetta - Sessione valida 24 ore
                </p>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `
                }} />
            </div>
        </div>
    );
}
