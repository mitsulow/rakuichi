"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface Toast {
  id: number;
  body: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (body: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  return (
    ctx ?? {
      show: (body: string) => {
        if (typeof window !== "undefined") alert(body);
      },
    }
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback(
    (body: string, variant: Toast["variant"] = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, body, variant }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[10000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors =
    toast.variant === "error"
      ? { bg: "#dc2626", icon: "❗" }
      : toast.variant === "success"
      ? { bg: "#5a7d4a", icon: "✓" }
      : { bg: "#c94d3a", icon: "✨" };

  return (
    <div
      className="pointer-events-auto rounded-full text-white text-xs font-bold px-4 py-2.5 shadow-xl flex items-center gap-2 max-w-[90vw]"
      style={{
        background: colors.bg,
        animation: "toast-in 0.3s ease-out",
      }}
    >
      <span>{colors.icon}</span>
      <span className="break-all">{toast.body}</span>
      <button
        onClick={onDismiss}
        aria-label="閉じる"
        className="ml-2 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
      <style jsx>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
