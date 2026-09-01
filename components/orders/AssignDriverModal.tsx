"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import type { OrderDto } from "@/lib/types";
import { assignOrderDriver } from "@/lib/api/orders";
import { Modal } from "@/components/ui";
import { useToast } from "@/components/toast";

export function AssignDriverModal({ order, onSubmitted }: {
  order: OrderDto;
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [driverName, setDriverName] = useState(order.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(order.driverPhone ?? "");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function handleAssign() {
    if (!driverName.trim()) {
      toast("Driver name is required", "err");
      return;
    }
    setBusy(true);
    try {
      await assignOrderDriver(order.id, {
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
      });
      toast("Driver assigned", "ok");
      setOpen(false);
      onSubmitted();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to assign driver", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        <Truck size={16} /> Assign Driver
      </button>
      {open && (
        <Modal
          onClose={() => !busy && setOpen(false)}
          title="Assign Driver"
          sub={`Order ${order.code}`}
          footer={
            <>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="btn solid" onClick={handleAssign} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="driver-name">Driver Name</label>
            <input
              id="driver-name"
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="driver-phone">Driver Phone</label>
            <input
              id="driver-phone"
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="e.g. +84 90 123 4567"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
