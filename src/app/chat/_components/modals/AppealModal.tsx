"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ShieldAlert, Loader2, Send } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { submitAppeal } from "@/lib/api";
import { useToast } from "@/components/Toast";
import clsx from "clsx";

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleIdToken: string;
  status: "suspended" | "banned";
  punishmentReason: string;
}

export default function AppealModal({
  isOpen,
  onClose,
  googleIdToken,
  status,
  punishmentReason,
}: AppealModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast("Alasan banding wajib diisi!", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitAppeal(googleIdToken, reason.trim());

      if (res.success) {
        toast(
          "Banding berhasil diajukan! Tim Super Admin akan meninjau permohonan Anda. 🗿",
          "success",
        );
        onClose();
        setReason("");
      } else {
        toast(res.error || "Gagal mengajukan banding.", "error");
      }
    } catch (error) {
      console.error("Submit appeal error:", error);
      toast("Terjadi kesalahan jaringan atau server.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flexcc md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={clsx(
              "relative w-full md:max-w-md h-full md:h-auto bg-secondary border border-white/5 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh]",
            )}
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent-default/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/2 shrink-0 relative z-10">
              <div className="flex items-center gap-2 text-text-secondary">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-black text-white">
                  Ajukan Banding Akun
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-all duration-150"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5 relative z-10"
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  Status Hukuman
                </p>
                <div
                  className={clsx(
                    "p-3 rounded-2xl border text-sm font-semibold flex items-center gap-2",
                    status === "banned"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400",
                  )}
                >
                  <span className="size-2 rounded-full bg-current animate-pulse" />
                  {status === "banned"
                    ? "Dibanned Permanen"
                    : "Ditangguhkan (Suspended)"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  Alasan Dari Staff
                </p>
                <div className="p-4 bg-white/2 border border-white/5 rounded-2xl text-sm text-text-secondary leading-relaxed italic">
                  &ldquo;
                  {punishmentReason ||
                    "Tidak ada alasan spesifik yang diberikan."}
                  &rdquo;
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label
                  htmlFor="appeal-reason"
                  className="text-xs text-text-muted font-medium uppercase tracking-wider"
                >
                  Alasan Banding Lu
                </label>
                <textarea
                  id="appeal-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan secara logis kenapa hukuman ini salah atau kenapa akun lu layak dipulihkan... 🗿"
                  className={clsx(
                    "w-full h-32 px-4 py-3 bg-white/2 border border-white/5 rounded-2xl text-sm text-white placeholder-text-muted focus:outline-hidden focus:border-accent-default/30 resize-none transition-all duration-150",
                  )}
                  maxLength={1000}
                />
                <div className="text-right text-[10px] text-text-muted">
                  {reason.length}/1000 karakter
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={clsx(
                  "w-full py-3.5 px-4 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 transition-all duration-150 active:scale-98 cursor-pointer select-none",
                  isSubmitting
                    ? "bg-accent-default/20 text-text-muted border border-accent-default/30 cursor-not-allowed"
                    : "bg-accent-default text-white hover:bg-accent-hover shadow-lg shadow-accent-default/20",
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Permohonan Banding
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render to portal so it handles layout layers safely
  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}
