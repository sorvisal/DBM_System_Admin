"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "../portal-context";
import { Field, Steps, inputCls } from "../_ui";
import { publicCheckout, publicValidateCart } from "@/lib/api/publicCustomerOrders";
import type { PublicOrderDto } from "@/lib/types/customerOrderLink";
import { fmtMoney, uploadsUrl } from "@/lib/api/client";
import { useToast } from "@/components/toast";

export default function CheckoutPage() {
  const {
    token, session, cart, productMap, cartTotal, totalQty,
    setLastOrder, clearCart,
  } = usePortal();
  const { toast } = useToast();
  const router = useRouter();
  const base = `/order/${token}`;

  const [payMethod, setPayMethod] = useState<"credit" | "cod">("credit");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(session?.customer.phone ?? "");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const idempotencyKey = useRef<string>("");

  // Cart guard + one idempotency key per checkout attempt
  useEffect(() => {
    if (cart.length === 0) router.replace(`${base}/cart`);
    idempotencyKey.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.length === 0) return <Steps current={1} />;

  async function placeOrder() {
    if (!session) { router.replace(base); return; }
    if (!address.trim()) { toast("Please enter a delivery address", "warn"); return; }
    setPlacing(true);
    try {
      // final server-side stock/price validation right before ordering
      await publicValidateCart(token, cart);

      const json = await publicCheckout(
        token,
        {
          items: cart,
          deliveryAddress: address.trim(),
          phone: phone.trim() || null,
          note: [note.trim(), payMethod === "cod" ? "Payment: Cash on delivery" : "Payment: Account credit"]
            .filter(Boolean).join(" • ") || null,
          idempotencyKey: idempotencyKey.current,
        },
        session.accessToken,
      );
      const order: PublicOrderDto = json.data!;
      setLastOrder(order);
      clearCart();
      router.replace(`${base}/success`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Checkout failed", "err");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-20 md:pb-6">
      <Steps current={1} />

      <div className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-[.9fr_1.1fr]">
        {/* Review */}
        <div className="self-start rounded-2xl border border-[#e2eaf6] bg-white p-3.5 sm:p-4">
          <h3 className="mb-2 text-sm font-extrabold">Review Products</h3>
          <div className="divide-y divide-[#eef2f7]">
            {cart.map((item) => {
              const p = productMap.get(item.productId);
              if (!p) return null;
              return (
                <div key={item.productId} className="flex items-center gap-2.5 py-2 sm:py-2.5">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eff6ff] text-xl sm:h-11 sm:w-11">
                    {p.photoPath
                      ? <img src={uploadsUrl(p.photoPath)} alt="" className="h-full w-full object-cover" />
                      : "📦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.name}</div>
                    <div className="text-xs text-[#71829a]">Qty {item.qty} × {fmtMoney(p.price)}</div>
                  </div>
                  <b className="flex-shrink-0 text-sm">{fmtMoney(p.price * item.qty)}</b>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#dce4ee] pt-2.5 sm:mt-3 sm:pt-3">
            <span className="text-xs text-[#71829a]">{totalQty} items</span>
            <span className="text-lg font-black text-[#0e50b4] sm:text-xl">{fmtMoney(cartTotal)}</span>
          </div>
        </div>

        {/* Delivery + payment */}
        <div className="rounded-2xl border border-[#e2eaf6] bg-white p-3.5 sm:p-4">
          <h3 className="mb-2.5 text-sm font-extrabold sm:mb-3">Delivery & Payment</h3>

          <label className={`mb-2 flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors sm:gap-3 sm:px-3.5 sm:py-3 ${
            payMethod === "credit" ? "border-[#72a9ff] bg-[#f2f7ff]" : "border-[#dfe8f2]"}`}
            onClick={() => setPayMethod("credit")}>
            <input type="radio" name="pay" checked={payMethod === "credit"} onChange={() => setPayMethod("credit")}
              className="accent-[#0d63ff]" />
            <span className="font-semibold">Credit / Account credit</span>
            <span className="ml-auto text-xs font-bold text-emerald-600">Available</span>
          </label>
          <label className={`mb-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors sm:gap-3 sm:px-3.5 sm:py-3 ${
            payMethod === "cod" ? "border-[#72a9ff] bg-[#f2f7ff]" : "border-[#dfe8f2]"}`}
            onClick={() => setPayMethod("cod")}>
            <input type="radio" name="pay" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")}
              className="accent-[#0d63ff]" />
            <span className="font-semibold">Cash on delivery</span>
          </label>

          <div className="space-y-2.5 sm:space-y-3">
            <Field label="Delivery Address">
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop / street / landmark…" className={`${inputCls} h-auto py-2`} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Contact number" className={inputCls} />
            </Field>
            <Field label="Note (optional)">
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Apartment, shop, landmark…" className={inputCls} />
            </Field>
          </div>

          <button onClick={placeOrder} disabled={placing}
            className="mt-3.5 h-11 w-full rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] text-sm font-bold text-white hover:opacity-95 disabled:opacity-60 sm:mt-4 sm:h-12">
            {placing ? "Placing order…" : `Place Order — ${fmtMoney(cartTotal)}`}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-400 sm:text-[11px]">
            Stock moves out of the warehouse once the store approves your order.
          </p>
        </div>
      </div>
    </div>
  );
}
