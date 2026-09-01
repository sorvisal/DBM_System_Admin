"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "../portal-context";
import { Steps, StatusPill } from "../_ui";
import { fmtMoney } from "@/lib/api/client";
import { CheckCircle2 } from "lucide-react";
import { useCustomerOrderEvents } from "../use-portal-realtime";

export default function SuccessPage() {
  const { lastOrder, setLastOrder, token } = usePortal();
  const router = useRouter();
  const base = `/order/${token}`;

  useEffect(() => {
    if (!lastOrder) router.replace(`${base}/orders`);
  }, [lastOrder, base, router]);

  // Real-time: if the store approves the order while this page is open,
  // the status pill updates instantly.
  useCustomerOrderEvents((e) => {
    setLastOrder((prev) =>
      prev && prev.orderId === e.orderId
        ? { ...prev, status: e.status, paymentStatus: e.paymentStatus }
        : prev,
    );
  });

  if (!lastOrder) return <Steps current={3} />;

  return (
    <div className="mx-auto max-w-md pb-20 md:pb-6">
      <Steps current={3} />
      <div className="mt-4 text-center">
        <CheckCircle2 size={56} className="mx-auto text-[#18b96f] sm:size-72" />
        <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Order placed successfully</h2>
        <span className="mt-2.5 inline-block rounded-full border border-[#d6e8ff] bg-[#edf5ff] px-3 py-1 text-sm font-extrabold text-[#1b58b5] sm:mt-3">
          #{lastOrder.code}
        </span>
        <p className="mt-2 text-xs text-[#71829a] sm:text-sm">
          Your order has been created and is ready for fulfillment.
          You can follow its status from Order History.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e2eaf6] bg-white p-3.5 sm:mt-5 sm:p-4">
        <div className="divide-y divide-[#eef2f7]">
          {lastOrder.lines.map((l) => (
            <div key={l.productId} className="flex items-center justify-between py-2 text-sm">
              <span className="text-sm">{l.productName} <span className="text-slate-400">× {l.qty}</span></span>
              <b className="text-sm">{fmtMoney(l.lineTotal)}</b>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#dce4ee] pt-2.5 sm:mt-3 sm:pt-3">
          <span className="text-sm font-extrabold">Total</span>
          <span className="text-lg font-black text-[#0e50b4] sm:text-xl">{fmtMoney(lastOrder.totalAmount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 sm:mt-3">
          <StatusPill status={lastOrder.status} />
          <span>{new Date(lastOrder.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
        <button onClick={() => router.push(`${base}/orders`)}
          className="h-10 rounded-xl bg-white font-bold text-sm text-[#0d63ff] ring-1 ring-[#bdd5fa] hover:bg-blue-50 sm:h-11">
          View order
        </button>
        <button onClick={() => router.push(`${base}/home`)}
          className="h-10 rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] font-bold text-sm text-white hover:opacity-95 sm:h-11">
          Continue shopping
        </button>
      </div>
    </div>
  );
}
