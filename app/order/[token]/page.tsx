"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "./portal-context";
import { publicLogin, publicRegister } from "@/lib/api/publicCustomerOrders";
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

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "register" && regPassword !== regConfirm) {
      setError("លេខសម្ងាត់បញ្ជាក់មិនផ្ទៀងផ្ទាត់ទេ (Passwords do not match)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (tab === "login") {
        const json = await publicLogin(token, { identifier, password, rememberMe });
        signIn(json.data!);
        toast(`សូមស្វាគមន៍, ${json.data!.customer.name}`, "ok");
      } else {
        const json = await publicRegister(token, {
          name: regName, phone: regPhone, email: regEmail, password: regPassword, confirmPassword: regConfirm,
        });
        signIn(json.data!);
        toast(`សូមស្វាគមន៍, ${json.data!.customer.name}!`, "ok");
      }
      router.replace(`${base}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ការចូលគណនីបរាជ័យ (Login failed)");
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="mx-auto mt-10 max-w-md text-center px-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl text-blue-600">
            👋
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-800">
            កំពុងប្រើប្រាស់ជា {session.customer.name}
          </h1>
          <button
            onClick={() => router.replace(`${base}/home`)}
            className="mt-6 h-12 w-full rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition-colors"
          >
            បន្តការទិញទំនិញ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#F8FAFC] md:bg-white sm:pt-6">
      <div className="flex-1 bg-white md:rounded-3xl md:border md:border-gray-100 md:shadow-[0_12px_40px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Top Header Bar (ដូចក្នុងរូបភាព) */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            {/* Back Arrow Icon */}
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          
          <button className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            {/* Globe Icon */}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M2 12H22"/><path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"/></svg>
            ភាសា
          </button>
        </div>

        {/* Center Illustration */}
        <div className="flex justify-center mt-4 mb-2">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-50">
            {/* User & Lock Illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-blue-500">
                <path d="M20 21V19C20 17.8954 19.1046 17 18 17H6C4.89543 17 4 17.8954 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"/>
              </svg>
            </div>
            {/* Green Shield Decor */}
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-green-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
          </div>
        </div>

        <div className="px-6 text-center">
          <h1 className="text-2xl font-bold text-blue-700">
            {tab === "login" ? "ចូលគណនី" : "បង្កើតគណនីថ្មី"}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {tab === "login" 
              ? "សូមបញ្ចូលអ៊ីមែល និងលេខសម្ងាត់របស់អ្នកដើម្បីបន្ត" 
              : "សូមបំពេញព័ត៌មានខាងក្រោមដើម្បីចុះឈ្មោះ"}
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="mx-6 mt-6 flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === "login" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            ចូលគណនី
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === "register" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            ចុះឈ្មោះ
          </button>
        </div>

        <div className="px-6 py-6 pb-12">
          <form onSubmit={submit} className="space-y-4">
            
            {tab === "login" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 ml-1">អ៊ីមែល ឬ លេខទូរស័ព្ទ (Email/Phone)</label>
                  <input 
                    required 
                    type="text"
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@gmail.com" 
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 ml-1">លេខសម្ងាត់ (Password)</label>
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                  />
                </div>
                <label className="flex select-none items-center gap-2 pt-1 text-sm text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-blue-600" 
                  />
                  ចងចាំគណនីរបស់ខ្ញុំ (Remember me)
                </label>
              </>
            ) : (
              // Register Fields
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 ml-1">ឈ្មោះពេញ (Full Name)</label>
                  <input required minLength={2} value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="ឈ្មោះរបស់អ្នក" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 ml-1">ទូរស័ព្ទ (Phone)</label>
                    <input required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="012 345 678" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 ml-1">អ៊ីមែល (Email)</label>
                    <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@gmail.com" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 ml-1">លេខសម្ងាត់ (Password)</label>
                    <input required type="password" minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 ml-1">បញ្ជាក់លេខសម្ងាត់</label>
                    <input required type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={busy}
              className="mt-4 h-12 w-full rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {busy ? (
                "កំពុងដំណើរការ..."
              ) : tab === "login" ? (
                <>
                  ចូលគណនី (Login)
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </>
              ) : (
                "ចុះឈ្មោះគណនី (Register)"
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="mt-8 text-center text-xs text-gray-400">
            រាល់ព័ត៌មានរបស់អ្នកត្រូវបានរក្សាទុកដោយសុវត្ថិភាព<br />
            Powered by DBM Retailer
          </p>
        </div>
      </div>
    </div>
  );
}