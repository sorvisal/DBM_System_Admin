"use client";

import { OrderHistory } from "@/components/customer/orders/OrderHistory";

export default function OrderHistoryPage() {
  return (
    <div className="mx-auto max-w-5xl pb-20 md:pb-6">
      <h3 className="mb-0.5 text-base font-extrabold">My Order History</h3>
      <p className="mb-4 text-xs text-[#71829a]">
        View all of your orders, payment status and delivery status.
      </p>
      <OrderHistory />
    </div>
  );
}
