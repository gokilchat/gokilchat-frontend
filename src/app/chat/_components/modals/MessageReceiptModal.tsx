import { motion, AnimatePresence } from "motion/react";
import { X, CheckCheck } from "lucide-react";
import { Message } from "@/types/chat";
import Image from "next/image";
import { createPortal } from "react-dom";

interface MessageReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

export default function MessageReceiptModal({
  isOpen,
  onClose,
  message,
}: MessageReceiptModalProps) {
  if (!message.receipts) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flexcc p-4">
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
            className="relative w-full max-w-sm bg-secondary border border-border-divider rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-border-divider flex items-center justify-between bg-elevated/20 shrink-0">
              <h3 className="text-lg font-black text-white">Info Pesan</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-6 p-4 bg-elevated rounded-2xl border border-border-subtle">
                <p className="text-sm font-medium text-white wrap-break-word whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="mt-2 text-[10px] text-text-muted flex justify-between">
                  <span>Terkirim: {formatDate(message.created_at)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Status Dilihat
                </h4>

                {message.receipts.length === 0 ? (
                  <p className="text-sm text-text-muted italic py-4 text-center">
                    Belum ada yang nerima pesan ini.
                  </p>
                ) : (
                  message.receipts.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-primary/40 rounded-2xl border border-transparent"
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-secondary flexcc font-bold text-accent-default overflow-hidden border border-border-divider">
                          {r.user?.avatar_url ? (
                            <Image
                              src={r.user.avatar_url}
                              alt="avatar"
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.srcset = "";
                                e.currentTarget.src =
                                  "/images/default-avatar.png";
                              }}
                            />
                          ) : (
                            (r.user?.full_name || r.user?.username || r.user_id)
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white mb-1 truncate">
                          {r.user?.full_name ||
                            r.user?.username ||
                            r.user_id.substring(0, 8)}
                        </p>
                        <div className="flex flex-col gap-1 text-[11px]">
                          {r.read_at && (
                            <div className="flex items-center gap-1.5 text-blue-400">
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Dibaca: {formatDate(r.read_at)}</span>
                            </div>
                          )}
                          {r.delivered_at && !r.read_at && (
                            <div className="flex items-center gap-1.5 text-text-muted">
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>
                                Tersampaikan: {formatDate(r.delivered_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
