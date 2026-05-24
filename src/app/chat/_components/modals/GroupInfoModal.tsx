import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, ShieldAlert, Crown, UserMinus, Loader2 } from "lucide-react";
import Image from "next/image";
import { apiFetch, kickMember } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Member {
  role: "owner" | "admin" | "user";
  joined_at: string;
  user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export default function GroupInfoModal({ isOpen, onClose, roomId }: GroupInfoModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const currentUser = useAuthStore((state) => state.user);
  const [isKicking, setIsKicking] = useState<string | null>(null);

  const currentUserRole = members.find(m => m.user.id === currentUser?.id)?.role;

  const handleKick = async (userId: string) => {
    if (!window.confirm("Yakin mau kick member ini?")) return;
    try {
      setIsKicking(userId);
      await kickMember(roomId, userId);
      setMembers(prev => prev.filter(m => m.user.id !== userId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal kick member");
    } finally {
      setIsKicking(null);
    }
  };

  const canKick = (targetRole: string, targetId: string) => {
    if (targetId === currentUser?.id) return false;
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin" && targetRole === "user") return true;
    return false;
  };

  useEffect(() => {
    if (isOpen && roomId) {
      const timer = setTimeout(() => setIsLoading(true), 0);
      apiFetch(`/rooms/${roomId}`)
        .then((res) => {
          if (res.success && res.data) {
            setRoomName(res.data.name);
            if (res.data.members) {
              setMembers(res.data.members);
            }
          }
        })
        .catch(console.error)
        .finally(() => {
          clearTimeout(timer);
          setIsLoading(false);
        });
    } else {
      const timer = setTimeout(() => {
        setMembers([]);
        setRoomName("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, roomId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flexcc p-4">
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
            <div className="p-6 border-b border-border-divider flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-default" /> Info Grup
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-xl transall">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-10 flexcc text-xs text-text-muted animate-pulse">Memuat info...</div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-elevated rounded-2xl flexcc mb-3 border border-border-divider shadow-inner overflow-hidden">
                      <span className="text-3xl font-black text-accent-default uppercase">{roomName.charAt(0) || "G"}</span>
                    </div>
                    <h4 className="text-lg font-black text-white text-center px-4">{roomName}</h4>
                    <p className="text-xs font-bold text-text-muted mt-1">{members.length} Anggota</p>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2">Daftar Anggota</h5>
                    {[...members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0)).map((m) => (
                      <div
                        key={m.user.id}
                        className="p-3 rounded-2xl hover:bg-elevated/50 flex items-center gap-3 transall group"
                      >
                        <Image
                          src={m.user.avatar_url || "/images/default-avatar.png"}
                          alt={m.user.username}
                          width={40}
                          height={40}
                          className="rounded-full border border-border-divider object-cover w-10 h-10 shrink-0 bg-primary"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.srcset = "";
                            e.currentTarget.src = "/images/default-avatar.png";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate flex items-center gap-1.5">
                            {m.user.full_name || m.user.username}
                            {m.role === "owner" && <span title="Owner" className="flex"><Crown className="w-3.5 h-3.5 text-yellow-500" /></span>}
                            {m.role === "admin" && <span title="Admin" className="flex"><ShieldAlert className="w-3.5 h-3.5 text-accent-default" /></span>}
                          </p>
                          <p className="text-[10px] text-text-muted font-bold tracking-wider">
                            @{m.user.username}
                          </p>
                        </div>
                        {canKick(m.role, m.user.id) && (
                          <button
                            onClick={() => handleKick(m.user.id)}
                            disabled={isKicking === m.user.id}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl opacity-0 md:group-hover:opacity-100 transall disabled:opacity-50 disabled:cursor-not-allowed shrink-0 max-md:opacity-100"
                            title="Kick Member"
                          >
                            {isKicking === m.user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
