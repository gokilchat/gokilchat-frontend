import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, ArrowRight } from "lucide-react";
import { Message } from "@/types/chat";
import Image from "next/image";
import { useChatStore } from "@/store/useChatStore";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/components/Toast";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
}: ForwardMessageModalProps) {
  const { toast } = useToast();
  const { rooms } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isForwarding, setIsForwarding] = useState<string | null>(null);

  // Filter rooms to display: no temporary rooms, filter by search query
  const activeRooms = rooms.filter(
    (r) =>
      !r.id.startsWith("temp-") &&
      r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleForward = async (roomId: string, roomName: string) => {
    if (isForwarding) return;
    setIsForwarding(roomId);
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit("message:send", {
          room_id: roomId,
          template_id: "00000000-0000-0000-0000-000000000001",
          data: { content: message.content },
        });
        toast(`Pesan berhasil diteruskan ke ${roomName}! 🗿`, "success");
        onClose();
      } else {
        toast("Gagal meneruskan pesan: Koneksi terputus.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Gagal meneruskan pesan.", "error");
    } finally {
      setIsForwarding(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flexcc md:p-4">
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
            className="relative w-full md:max-w-md h-full md:h-auto bg-secondary border border-border-divider md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 md:p-6 border-b border-border-divider flex items-center justify-between shrink-0">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-lg font-black text-white">
                  Teruskan Pesan
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-70">
                  &quot;{message.content}&quot;
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elevated rounded-xl transall cursor-pointer"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari nama chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {activeRooms.length > 0 ? (
                  activeRooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleForward(r.id, r.name)}
                      className={`p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 transall group ${
                        isForwarding === r.id
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <Image
                        src={r.avatar_url || "/images/default-avatar.png"}
                        alt={r.name}
                        width={40}
                        height={40}
                        className="rounded-full border border-border-divider w-10 h-10 object-cover"
                        onError={(e) => {
                          e.currentTarget.srcset = "";
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white group-hover:text-accent-default transall truncate">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold tracking-wider">
                          {r.type === "dm"
                            ? "Personal"
                            : `${r.members_count || 1} Anggota`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-accent-default opacity-0 group-hover:opacity-100 transall shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="py-10 flexcc text-xs text-text-muted italic text-center">
                    Tidak ada chat room yang cocok...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
