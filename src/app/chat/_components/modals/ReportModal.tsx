import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { Message, User } from "@/types/chat";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import clsx from "clsx";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedMessage?: Message | null;
  reportedUser?: Partial<User> | null;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam atau Mengganggu" },
  { value: "harassment", label: "Ujaran Kebencian atau Harassment" },
  { value: "inappropriate", label: "Konten Tidak Pantas / SARA / Pornografi" },
  { value: "phishing", label: "Penipuan atau Phishing / Link Berbahaya" },
  { value: "other", label: "Lainnya (Tulis alasan khusus)" },
];

export default function ReportModal({
  isOpen,
  onClose,
  reportedMessage,
  reportedUser,
}: ReportModalProps) {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTargetName = () => {
    if (reportedMessage) {
      return reportedMessage.sender_full_name || reportedMessage.sender_username || "Pesan";
    }
    if (reportedUser) {
      return reportedUser.full_name || reportedUser.username || "User";
    }
    return "Konten";
  };

  const getTargetAvatar = () => {
    if (reportedMessage) {
      return reportedMessage.sender_avatar || "/images/default-avatar.png";
    }
    if (reportedUser) {
      return reportedUser.avatar_url || "/images/default-avatar.png";
    }
    return "/images/default-avatar.png";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      toast("Pilih alasan pelaporan terlebih dahulu!", "warning");
      return;
    }

    const finalReason = selectedReason === "other" ? customReason : REPORT_REASONS.find(r => r.value === selectedReason)?.label;

    if (!finalReason || !finalReason.trim()) {
      toast("Alasan pelaporan wajib diisi!", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        reason: string;
        reported_message_id?: string;
        reported_user_id?: string;
      } = {
        reason: finalReason,
      };

      if (reportedMessage) {
        payload.reported_message_id = reportedMessage.id;
        payload.reported_user_id = reportedMessage.sender_id;
      } else if (reportedUser) {
        payload.reported_user_id = reportedUser.id;
      }

      const res = await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast("Laporan berhasil dikirim. Tim Moderator akan meninjau secepatnya. 🗿", "success");
        onClose();
        setSelectedReason("");
        setCustomReason("");
      } else {
        toast(res.error || "Gagal mengirim laporan.", "error");
      }
    } catch (error) {
      console.error("Submit report error:", error);
      toast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flexcc md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full md:max-w-md h-full md:h-auto bg-secondary border border-border-divider md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh]"
          >
            <div className="p-4 md:p-6 border-b border-border-divider flex items-center justify-between bg-elevated/20 shrink-0">
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-black text-white">Laporkan Konten</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5">
              {/* Target info preview */}
              <div className="flex items-center gap-3 p-3 bg-primary/40 rounded-2xl border border-border-divider/50">
                <div className="relative shrink-0">
                  <Image
                    src={getTargetAvatar()}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10 border border-border-divider"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.srcset = "";
                      e.currentTarget.src = "/images/default-avatar.png";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    Melaporkan {reportedMessage ? "Pesan Dari" : "User"}
                  </span>
                  <p className="text-sm font-black text-white truncate">
                    {getTargetName()}
                  </p>
                </div>
              </div>

              {reportedMessage && (
                <div className="p-3 bg-elevated rounded-2xl border border-border-subtle max-h-24 overflow-y-auto text-xs text-text-secondary italic">
                  &ldquo;{reportedMessage.content}&rdquo;
                </div>
              )}

              {/* Reasons options */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-text-muted">
                  Pilih Alasan Pelanggaran
                </label>
                <div className="flex flex-col gap-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={clsx(
                        "flex items-center gap-3 p-3 bg-primary/20 hover:bg-primary/40 border rounded-2xl cursor-pointer transall text-sm font-medium",
                        selectedReason === r.value
                          ? "border-accent-default/60 bg-accent-default/5 text-white"
                          : "border-border-divider text-text-secondary"
                      )}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r.value}
                        checked={selectedReason === r.value}
                        onChange={() => setSelectedReason(r.value)}
                        className="accent-accent-default w-4 h-4 cursor-pointer"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom reason text area */}
              {selectedReason === "other" && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="text-xs font-black uppercase tracking-wider text-text-muted">
                    Detail Alasan Khusus
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required
                    placeholder="Jelaskan alasan pelaporan secara rinci agar moderator dapat memahami pelanggarannya..."
                    rows={3}
                    className="w-full bg-secondary border border-border-divider rounded-2xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-default transall resize-none"
                  />
                </div>
              )}

              {/* Submit button */}
              <div className="mt-2 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason}
                  className="w-full flexc gap-2 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-800 disabled:opacity-40 text-black font-black rounded-2xl text-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Laporan...</span>
                    </>
                  ) : (
                    <span>Kirim Laporan Pelanggaran</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
