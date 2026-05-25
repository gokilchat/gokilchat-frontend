import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, ShieldAlert, Crown, UserMinus, Loader2, Image as ImageIcon, Search, UserPlus, PenSquare, Check } from "lucide-react";
import Image from "next/image";
import { apiFetch, kickMember, updateRoomDetails } from "@/lib/api";
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
  const [roomDescription, setRoomDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const currentUser = useAuthStore((state) => state.user);
  const [isKicking, setIsKicking] = useState<string | null>(null);

  const currentUserRole = members.find(m => m.user.id === currentUser?.id)?.role;
  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin";

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

  const handleSaveDescription = async () => {
    try {
      setIsSavingDescription(true);
      await updateRoomDetails(roomId, { description: tempDescription });
      setRoomDescription(tempDescription);
      setIsEditingDescription(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan deskripsi");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    try {
      setIsSavingName(true);
      await updateRoomDetails(roomId, { name: tempName });
      setRoomName(tempName);
      setIsEditingName(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan nama grup");
    } finally {
      setIsSavingName(false);
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
            setRoomDescription(res.data.description || "");
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
        setRoomDescription("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, roomId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-full max-w-md h-full bg-primary border-l border-border-divider shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="h-20 px-6 bg-secondary/50 border-b border-border-divider flex items-center justify-between shrink-0">
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
                  <div className="flex flex-col items-center mb-6 pt-4">
                    <div className="w-40 h-40 bg-secondary/80 rounded-full flexcc mb-5 shadow-lg overflow-hidden border-2 border-border-divider/50 group relative cursor-pointer">
                      <span className="text-6xl font-black text-text-secondary uppercase group-hover:opacity-0 transall">{roomName.charAt(0) || "G"}</span>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flexcc flex-col gap-1 transall">
                        <ImageIcon className="w-8 h-8 text-white mb-1" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest text-center px-4">Change Icon</span>
                      </div>
                    </div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mb-1 px-4 w-full justify-center">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="bg-secondary text-white text-xl font-bold px-2 py-1 rounded border border-accent-default focus:outline-none text-center max-w-[200px]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                            else if (e.key === "Escape") setIsEditingName(false);
                          }}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="p-1 hover:bg-white/10 rounded text-accent-default disabled:opacity-50"
                        >
                          {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          className="p-1 hover:bg-white/10 rounded text-text-secondary"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-2 mb-1 ${isOwnerOrAdmin ? "cursor-pointer hover:opacity-80" : ""}`}
                        onClick={() => {
                          if (isOwnerOrAdmin) {
                            setTempName(roomName);
                            setIsEditingName(true);
                          }
                        }}
                      >
                        <h4 className="text-2xl font-bold text-white text-center px-2">{roomName}</h4>
                        {isOwnerOrAdmin && <PenSquare className="w-4 h-4 text-text-secondary" />}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-text-muted">Grup · {members.length} member</p>
                    
                    <div className="flex items-center gap-6 mt-6">
                      <button className="flex flex-col items-center gap-2 hover:opacity-80 transall group">
                        <div className="w-12 h-12 rounded-full bg-elevated border border-border-divider flexcc group-hover:bg-accent-default/20 group-hover:border-accent-default/30 group-hover:text-accent-default transall">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-text-secondary group-hover:text-accent-default transall">Add</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 hover:opacity-80 transall group">
                        <div className="w-12 h-12 rounded-full bg-elevated border border-border-divider flexcc group-hover:bg-accent-default/20 group-hover:border-accent-default/30 group-hover:text-accent-default transall">
                          <Search className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-text-secondary group-hover:text-accent-default transall">Search</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-black/20 -mx-6 mb-4" />

                  <div className="mb-4">
                    {isEditingDescription ? (
                      <div className="flex flex-col gap-2 p-2 bg-secondary/30 rounded-xl">
                        <textarea
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          placeholder="Tambahkan deskripsi grup..."
                          className="w-full bg-secondary text-white text-sm px-3 py-2 rounded-lg border border-accent-default focus:outline-none resize-none h-20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setIsEditingDescription(false);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsEditingDescription(false)}
                            className="px-3 py-1 text-xs font-bold text-text-secondary hover:bg-white/5 rounded-lg transall"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveDescription}
                            disabled={isSavingDescription}
                            className="px-3 py-1 text-xs font-bold text-white bg-accent-default hover:bg-accent-hover rounded-lg transall flex items-center gap-1 disabled:opacity-50"
                          >
                            {isSavingDescription && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col gap-1 ${isOwnerOrAdmin ? "cursor-pointer hover:bg-white/5" : ""} -mx-4 px-4 py-3 rounded-xl transall`}
                        onClick={() => {
                          if (isOwnerOrAdmin) {
                            setTempDescription(roomDescription);
                            setIsEditingDescription(true);
                          }
                        }}
                      >
                        <span className="text-xs font-bold text-accent-default uppercase tracking-wider">Deskripsi Grup</span>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-semibold text-white whitespace-pre-wrap flex-1">
                            {roomDescription || (isOwnerOrAdmin ? "Tambahkan deskripsi grup..." : "Tidak ada deskripsi grup.")}
                          </p>
                          {isOwnerOrAdmin && <PenSquare className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-2 bg-black/20 -mx-6 mb-4" />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-xs font-bold text-text-secondary">{members.length} anggota</h5>
                      <Search className="w-4 h-4 text-text-secondary cursor-pointer hover:text-white transall" />
                    </div>
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
