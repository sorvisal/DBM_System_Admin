"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { googleLoginUrl } from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardLegacyPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ usernameOrEmail: username.trim(), password });
        router.replace("/admin");
      } else {
        if (!fullName.trim()) { setError("Full name is required"); setBusy(false); return; }
        await register({ username: username.trim(), password, fullName: fullName.trim(), email: email.trim() || null, phone: null, storeName: null });
        router.replace("/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogle() {
    window.location.href = googleLoginUrl();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-50">DBM</div>
              <div className="text-xs text-slate-500">Distribution Management System</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5">
            <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setMode("login")}>Sign In</button>
            <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "register" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setMode("register")}>Register</button>
          </div>

          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {mode === "login" ? "Enter your credentials to continue." : "Create an admin account to get started."}
          </p>

          <form onSubmit={onSubmit} autoComplete="off" className="space-y-3">
            {mode === "register" && (
              <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}
            <Input placeholder="Username or Email" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete={mode === "login" ? "username" : "username"} />
            {mode === "register" && (
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" className="w-full" onClick={handleGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            <p className="text-center text-xs text-slate-400 mt-3">org · build v2.4.1</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
