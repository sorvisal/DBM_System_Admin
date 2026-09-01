"use client";

import {
  useState,
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Modal } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalKey =
  | "product"
  | "customer"
  | "supplier"
  | "order"
  | "purchase-order"
  | "purchase-order-detail"
  | "stock-adjust"
  | "category"
  | null;

export interface ModalRecord {
  [key: string]: unknown;
}

// Per-page slot registry so any page can attach its modal content.
const slotRenderers = new Map<string, (data: ModalRecord) => ReactNode>();

export function registerModalSlot(
  key: string,
  renderer: (data: ModalRecord) => ReactNode,
) {
  slotRenderers.set(key, renderer);
}

interface ModalState {
  key: string;
  data: ModalRecord;
}

interface ModalContextType {
  open: (key: string, data: ModalRecord) => void;
  close: () => void;
  state: ModalState | null;
}

const ModalContext = createContext<ModalContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const open = useCallback((key: string, data: ModalRecord) => {
    setState({ key, data });
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <ModalContext.Provider value={{ open, close, state }}>
      {children}
      {state && <GlobalModal />}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

// ─── View Button ──────────────────────────────────────────────────────────────

export interface ViewButtonProps {
  /** Short label shown on the button */
  label?: string;
  /** Extra data merged with the record id */
  data?: ModalRecord;
  /** Extra className applied to the button */
  className?: string;
  /** Called before open; receives merged payload so caller can decide the key */
  onOpen?: (payload: ModalRecord) => void;
  /** Explicit modal slot key (overrides inference) */
  keyType?: string;
}

export function ViewButton({
  label = "View",
  data = {},
  className = "",
  onOpen,
  keyType,
}: ViewButtonProps) {
  const { open } = useModal();

  const handleClick = () => {
    const payload: ModalRecord = { ...data };
    if (onOpen) {
      onOpen(payload);
    } else {
      const inferredKey = keyType ?? (
        typeof payload.productId === "number"
          ? "product"
          : typeof payload.customerId === "number"
            ? "customer"
            : typeof payload.supplierId === "number"
              ? "supplier"
              : typeof payload.orderId === "number"
                ? "order"
                : typeof payload.purchaseOrderId === "number"
                  ? "purchase-order"
                  : typeof payload.categoryId === "number"
                    ? "category"
                    : typeof payload.userId === "number"
                      ? "user"
                      : null
      );
      if (inferredKey) open(inferredKey, payload);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium",
        "rounded-md border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-800",
        "text-blue-600 dark:text-blue-400",
        "hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700",
        "transition-colors duration-150",
        className,
      ].filter(Boolean).join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-3 h-3"
        aria-hidden="true"
      >
        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
      </svg>
      {label}
    </button>
  );
}

// ─── Global Modal Shell ───────────────────────────────────────────────────────

const TITLE_MAP: Record<string, string> = {
  product: "Product Details",
  customer: "Customer Details",
  supplier: "Supplier Details",
  order: "Order Details",
  "purchase-order": "Create Purchase Order",
  "purchase-order-detail": "Purchase Order Details",
  "stock-adjust": "Stock Adjustment",
  category: "Category Details",
};

function GlobalModal() {
  const { state, close } = useModal();
  if (!state) return null;

  const renderer = slotRenderers.get(state.key);
  const title = TITLE_MAP[state.key] ?? state.key;

  return (
    <Modal onClose={close} title={title}>
      {renderer ? renderer(state.data) : <p className="text-sm text-slate-500">No content registered for this modal.</p>}
    </Modal>
  );
}
