import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, ArrowRight, Loader2 } from "lucide-react";
import { Message, User } from "@/types/chat";
import Image from "next/image";
import { useChatStore } from "@/store/useChatStore";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

// Target tujuan forward: room yang udah ada, atau user yang mungkin belum pernah di-DM
type ForwardTarget =
  | { kind: "room"; id: string; name: string }
  | { kind: "user"; user: User };

const TEXT_TEMPLATE_ID = "00000000-0000-0000-0000-000000000001";

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
}: ForwardMessageModalProps) {
  const { toast } = useToast();
  const { rooms } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ForwardTarget | null>(null);

  // Reset state tiap modal ditutup biar bersih pas dibuka lagi
  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => {
      setSearchQuery("");
      setUserResults([]);
      setConfirmTarget(null);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Chat (room/DM) yang udah ada, difilter by nama
  const activeRooms = rooms.filter(
    (r) =>
      !r.id.startsWith("temp-") &&
      r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // userId yang udah punya DM — biar gak dobel muncul di hasil search user
  const existingDmUserIds = new Set(
    rooms.filter((r) => r.type === "dm" && r.dm_user_id).map((r) => r.dm_user_id),
  );

  // Search user via API (debounce). Cuma user yang BELUM punya DM yang ditampilin di section bawah.
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setUserResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await apiFetch(
          `/users/search?username=${encodeURIComponent(q)}`,
        );
        if (!cancelled && res.success) setUserResults(res.data || []);
      } catch {
        // ignore — gak nemu user bukan error fatal
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const newUsers = userResults.filter((u) => !existingDmUserIds.has(u.id));

  const emitForward = (roomId: string) => {
    getSocket()?.emit("message:send", {
      room_id: roomId,
      template_id: TEXT_TEMPLATE_ID,
      // Forward = pesan baru tanpa parent_id (bukan reply), cuma salin konten teks
      data: { content: message.content },
    });
  };

  const executeForward = async (target: ForwardTarget) => {
    if (isForwarding) return;
    // Cuma pesan teks biasa yang bisa diteruskan — kartu undangan / pesan kosong di-skip
    if (!message.content?.trim()) {
      toast("Pesan ini tidak bisa diteruskan.", "error");
      setConfirmTarget(null);
      return;
    }
    const socket = getSocket();
    if (!socket) {
      toast("Gagal meneruskan pesan: Koneksi terputus.", "error");
      setConfirmTarget(null);
      return;
    }

    setIsForwarding(true);
    try {
      if (target.kind === "room") {
        emitForward(target.id);
        toast(`Pesan berhasil diteruskan ke ${target.name}! 🗿`, "success");
      } else {
        const targetName = target.user.full_name || target.user.username;
        // Kalau ternyata udah ada DM-nya (race/edge), pakai yang ada; kalau belum, bikin baru.
        const existing = rooms.find(
          (r) => r.type === "dm" && r.dm_user_id === target.user.id,
        );
        let roomId = existing?.id;
        if (!roomId) {
          const res = await apiFetch("/rooms/dm", {
            method: "POST",
            body: JSON.stringify({ target_user_id: target.user.id }),
          });
          if (!res.success) throw new Error(res.error || "Gagal bikin DM");
          roomId = res.data.id;
          socket.emit("room:join", { room_id: roomId });
        }
        emitForward(roomId!);
        toast(`Pesan berhasil diteruskan ke ${targetName}! 🗿`, "success");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Gagal meneruskan pesan.",
        "error",
      );
    } finally {
      setIsForwarding(false);
      setConfirmTarget(null);
    }
  };

  const targetName = confirmTarget
    ? confirmTarget.kind === "room"
      ? confirmTarget.name
      : confirmTarget.user.full_name || confirmTarget.user.username
    : "";

  return (
    <>
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
                    placeholder="Cari chat atau user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-elevated border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                  />
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar">
                  {/* Section 1: Chat yang udah ada */}
                  {activeRooms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">
                        Chat Kamu
                      </p>
                      {activeRooms.map((r) => (
                        <div
                          key={r.id}
                          onClick={() =>
                            setConfirmTarget({ kind: "room", id: r.id, name: r.name })
                          }
                          className="p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 transall group cursor-pointer"
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
                      ))}
                    </div>
                  )}

                  {/* Section 2: User lain (belum pernah di-DM) */}
                  {newUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">
                        Mulai DM Baru
                      </p>
                      {newUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setConfirmTarget({ kind: "user", user: u })}
                          className="p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 transall group cursor-pointer"
                        >
                          <Image
                            src={u.avatar_url || "/images/default-avatar.png"}
                            alt={u.username}
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
                              {u.full_name || u.username}
                            </p>
                            <p className="text-[10px] text-text-muted font-bold tracking-wider">
                              @{u.username}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-accent-default opacity-0 group-hover:opacity-100 transall shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* States: loading / kosong */}
                  {isSearching && (
                    <div className="py-6 flexcc gap-2 text-xs text-text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" /> Mencari user gokil...
                    </div>
                  )}
                  {!isSearching &&
                    activeRooms.length === 0 &&
                    newUsers.length === 0 && (
                      <div className="py-10 flexcc text-xs text-text-muted italic text-center">
                        {searchQuery.trim().length >= 2
                          ? "Gak nemu chat atau user yang cocok..."
                          : "Ketik buat nyari chat atau user."}
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Konfirmasi sebelum kirim — biar gak salah teruskan ke orang yang salah 🗿 */}
      <ConfirmModal
        isOpen={!!confirmTarget}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && executeForward(confirmTarget)}
        title="Teruskan pesan?"
        description={
          <>
            Teruskan pesan ini ke{" "}
            <span className="text-white font-black">{targetName}</span>?
            {confirmTarget?.kind === "user" && (
              <span className="block mt-1 text-[11px] text-text-muted">
                Ini bakal memulai DM baru sama dia.
              </span>
            )}
          </>
        }
        confirmLabel={isForwarding ? "Mengirim..." : "Teruskan"}
        cancelLabel="Batal"
        variant="info"
      />
    </>
  );
}
