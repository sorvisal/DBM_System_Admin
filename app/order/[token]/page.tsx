"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "./portal-context";
import { publicLogin, publicRegister } from "@/lib/api/publicCustomerOrders";
import { Field, inputCls } from "./_ui";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const { session, storeName, signIn, token } = usePortal();
  const router = useRouter();
  const { toast } = useToast();
  const base = `/order/${token}`;

  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "register" && regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (tab === "login") {
        const json = await publicLogin(token, { identifier, password, rememberMe });
        signIn(json.data!);
        toast(`Welcome back, ${json.data!.customer.name}`, "ok");
      } else {
        const json = await publicRegister(token, {
          name: regName, phone: regPhone, email: regEmail, password: regPassword, confirmPassword: regConfirm,
        });
        signIn(json.data!);
        toast(`Welcome, ${json.data!.customer.name}!`, "ok");
      }
      router.replace(`${base}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="mx-auto mt-10 max-w-md text-center">
        <div className="rounded-3xl border border-[#e2eaf6] bg-white p-8 shadow-sm">
          <div className="text-4xl">👋</div>
          <h1 className="mt-2 text-lg font-bold">Signed in as {session.customer.name}</h1>
          <button onClick={() => router.replace(`${base}/home`)}
            className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] font-bold text-white">
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Cover */}
      <div className="relative mb-4 grid h-36 place-items-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#e6f2ff] to-[#f9fcff]">
        <span className="text-6xl">🛒</span>
        <b className="absolute left-4 top-3 text-sm text-[#0b55bf]">{storeName}</b>
      </div>

      <h1 className="text-center text-2xl font-extrabold text-[#0c4db1]">Welcome to DBM Retailer</h1>
      <p className="mb-4 mt-1 text-center text-xs text-[#71829a]">
        Sign in or create an account — then browse products and order in minutes.
      </p>

      <div className="overflow-hidden rounded-3xl border border-[#e2eaf6] bg-white shadow-[0_12px_35px_rgba(31,77,137,.10)]">
        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-[#edf1f5]">
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`py-3.5 text-sm font-bold transition-colors ${
                tab === t ? "border-b-2 border-[#0d63ff] bg-[#f7fbff] text-[#0d63ff]" : "text-[#91a1b5] hover:text-slate-500"
              }`}>
              {t === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Traditional form */}
          <form onSubmit={submit} className="space-y-3">
            {tab === "login" ? (
              <>
                <Field label="Phone or Email">
                  <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 012 345 678" className={inputCls} />
                </Field>
                <Field label="Password">
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls} />
                </Field>
                <label className="flex select-none items-center gap-2 pt-1 text-sm text-[#4c6480]">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#0d63ff]" />
                  Remember me
                </label>
              </>
            ) : (
              <>
                <Field label="Full Name">
                  <input required minLength={2} value={regName} onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name or shop name" className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Phone"><input required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="012 345 678" className={inputCls} /></Field>
                  <Field label="Email"><input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Password"><input required type="password" minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters" className={inputCls} /></Field>
                  <Field label="Confirm Password"><input required type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat password" className={inputCls} /></Field>
                </div>
              </>
            )}

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <button type="submit" disabled={busy}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] font-bold text-white transition-opacity disabled:opacity-60">
              {busy ? "Please wait…" : tab === "login" ? "Login & Continue Shopping" : "Create Account & Start Ordering"}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-[#71829a]">
        One link serves all customers — your account and orders belong to you alone.<br />
        Your cart is kept safe while you sign in.
      </p>
    </div>
  );
}
