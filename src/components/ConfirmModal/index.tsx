"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, UserMinus } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: ReactNode;
}

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { icon: string; btn: string; iconBg: string }
> = {
  danger: {
    icon: "text-red-400",
    iconBg: "bg-red-500/10",
    btn: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    btn: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: "text-[#6b3410]",
    iconBg: "bg-[#6b3410]/10",
    btn: "bg-[#6b3410] hover:bg-[#7a3d13] text-white",
  },
};

const DEFAULT_ICONS: Record<ConfirmVariant, ReactNode> = {
  danger: <LogOut className="w-6 h-6" />,
  warning: <AlertTriangle className="w-6 h-6" />,
  info: <UserMinus className="w-6 h-6" />,
};

/**
 * Generic premium confirmation dialog.
 * Render via portal di z-9997 — di bawah Toast & Tooltip, tapi di atas semua modal lain.
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  icon,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];
  const displayIcon = icon ?? DEFAULT_ICONS[variant];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9997 flexcc p-6">
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="dialog"
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            className="relative w-full max-w-sm bg-secondary p-6 rounded-3xl border border-border-divider shadow-2xl text-center"
          >
            {/* Icon */}
            <div
              className={[
                "w-14 h-14 rounded-full flexcc mx-auto mb-4",
                styles.iconBg,
                styles.icon,
              ].join(" ")}
            >
              {displayIcon}
            </div>

            <h4 className="text-lg font-black text-white mb-2">{title}</h4>
            <div className="text-sm text-text-secondary mb-6 leading-relaxed">
              {description}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-elevated hover:bg-elevated/80 text-white font-bold rounded-2xl transall cursor-pointer text-sm"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={[
                  "flex-1 py-3 font-bold rounded-2xl transall cursor-pointer text-sm",
                  styles.btn,
                ].join(" ")}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
