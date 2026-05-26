import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Users,
  ShieldAlert,
  Crown,
  UserMinus,
  Loader2,
  Image as ImageIcon,
  Search,
  UserPlus,
  PenSquare,
  Check,
} from "lucide-react";
import Image from "next/image";
import { apiFetch, kickMember, updateRoomDetails } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/components/Toast";
import Tooltip from "@/components/Tooltip";

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
  onInviteClick?: () => void;
}

export default function GroupInfoModal({
  isOpen,
  onClose,
  roomId,
  onInviteClick,
}: GroupInfoModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const isRevertingRef = useRef(false);

  const currentUser = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [isKicking, setIsKicking] = useState<string | null>(null);
  const [confirmKickUser, setConfirmKickUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isConfirmingSaveDesc, setIsConfirmingSaveDesc] = useState(false);

  const currentUserRole = members.find(
    (m) => m.user.id === currentUser?.id,
  )?.role;
  const isOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";

  const handleKick = async (userId: string) => {
    try {
      setIsKicking(userId);
      await kickMember(roomId, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Gagal kick member",
        "error",
      );
    } finally {
      setIsKicking(null);
    }
  };

  const handleRequestSaveDescription = () => {
    if (isRevertingRef.current) {
      isRevertingRef.current = false;
      return;
    }
    if (tempDescription === roomDescription) {
      setIsEditingDescription(false);
      return;
    }
    setIsConfirmingSaveDesc(true);
  };

  const executeSaveDescription = async () => {
    try {
      await updateRoomDetails(roomId, { description: tempDescription });
      setRoomDescription(tempDescription);
      setIsEditingDescription(false);
      setIsConfirmingSaveDesc(false);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Gagal menyimpan deskripsi",
        "error",
      );
      setTempDescription(roomDescription);
      setIsEditingDescription(false);
      setIsConfirmingSaveDesc(false);
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
      toast(
        error instanceof Error ? error.message : "Gagal menyimpan nama grup",
        "error",
      );
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
      apiFetch(`/rooms/${roomId}`, { cache: "no-store" })
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

  useEffect(() => {
    const socket = getSocket();
    if (!isOpen || !roomId) return;

    const handleMemberLeft = (data: { room_id: string; user_id: string }) => {
      if (data.room_id === roomId) {
        setMembers((prev) => prev.filter((m) => m.user.id !== data.user_id));
      }
    };

    const handleMemberJoined = (data: { room_id: string }) => {
      if (data.room_id === roomId) {
        apiFetch(`/rooms/${roomId}`, { cache: "no-store" }).then((res) => {
          if (res.success && res.data && res.data.members) {
            setMembers(res.data.members);
          }
        });
      }
    };

    const handleRoomUpdated = (data: { room_id: string; name: string; description: string }) => {
      if (data.room_id === roomId) {
        setRoomName(data.name);
        setRoomDescription(data.description);
      }
    };

    const handleCustomMemberJoined = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomId: string }>;
      if (customEvent.detail.roomId === roomId) {
        apiFetch(`/rooms/${roomId}`, { cache: "no-store" }).then((res) => {
          if (res.success && res.data && res.data.members) {
            setMembers(res.data.members);
          }
        });
      }
    };

    if (socket) {
      socket.on("room:member_left", handleMemberLeft);
      socket.on("room:member_joined", handleMemberJoined);
      socket.on("room:updated", handleRoomUpdated);
    }

    window.addEventListener(
      "gokilchat:member_joined",
      handleCustomMemberJoined,
    );

    return () => {
      if (socket) {
        socket.off("room:member_left", handleMemberLeft);
        socket.off("room:member_joined", handleMemberJoined);
        socket.off("room:updated", handleRoomUpdated);
      }
      window.removeEventListener(
        "gokilchat:member_joined",
        handleCustomMemberJoined,
      );
    };
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
            className="relative w-full max-w-md h-full bg-primary border-l border-border-divider overflow-hidden flex flex-col"
          >
            <div className="h-20 px-6 bg-secondary/50 border-b border-border-divider flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-default" /> Info Grup
              </h3>
              <button
                onClick={onClose}
                className="cursor-pointer p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-10 flexcc text-xs text-text-muted animate-pulse">
                  Memuat info...
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6 pt-4">
                    <div className="w-40 h-40 bg-secondary/80 rounded-full flexcc mb-5 shadow-lg overflow-hidden border-2 border-border-divider/50 group relative cursor-pointer">
                      <span className="text-6xl font-black text-text-secondary uppercase group-hover:opacity-0 transall">
                        {roomName.charAt(0) || "G"}
                      </span>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flexcc flex-col gap-1 transall">
                        <ImageIcon className="w-8 h-8 text-white mb-1" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest text-center px-4">
                          Change Icon
                        </span>
                      </div>
                    </div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mb-1 px-4 w-full justify-center">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="bg-secondary text-white text-xl font-bold px-2 py-1 rounded border border-accent-default focus:outline-none text-center max-w-50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                            else if (e.key === "Escape")
                              setIsEditingName(false);
                          }}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="p-1 hover:bg-white/10 rounded text-accent-default disabled:opacity-50"
                        >
                          {isSavingName ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
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
                        <h4 className="text-2xl font-bold text-white text-center px-2">
                          {roomName}
                        </h4>
                        {isOwnerOrAdmin && (
                          <PenSquare className="w-4 h-4 text-text-secondary" />
                        )}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-text-muted">
                      Grup · {members.length} member
                    </p>

                    <div className="flex items-center gap-6 mt-6">
                      {isOwnerOrAdmin && (
                        <button
                          onClick={onInviteClick}
                          className="flex flex-col items-center gap-2 hover:opacity-80 transall group cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-elevated border border-border-divider flexcc group-hover:bg-accent-default/20 group-hover:border-accent-default/30 group-hover:text-accent-default transall cursor-pointer">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-text-secondary group-hover:text-accent-default transall cursor-pointer">
                            Add
                          </span>
                        </button>
                      )}
                      <button className="flex flex-col items-center gap-2 hover:opacity-80 transall group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-elevated border border-border-divider flexcc group-hover:bg-accent-default/20 group-hover:border-accent-default/30 group-hover:text-accent-default transall cursor-pointer">
                          <Search className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-text-secondary group-hover:text-accent-default transall cursor-pointer">
                          Search
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-black/20 -mx-6 mb-4" />

                  <div className="mb-4">
                    <div
                      className={`flex flex-col gap-1 -mx-4 px-4 py-3 rounded-xl transall relative group ${
                        isOwnerOrAdmin && !isEditingDescription
                          ? "cursor-pointer hover:bg-white/5"
                          : ""
                      }`}
                      onClick={() => {
                        if (isOwnerOrAdmin && !isEditingDescription) {
                          setTempDescription(roomDescription);
                          setIsEditingDescription(true);
                        }
                      }}
                    >
                      <span className="text-xs font-bold text-accent-default uppercase tracking-wider">
                        Deskripsi Grup
                      </span>
                      {isEditingDescription ? (
                        <div
                          className="flex flex-col mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            spellCheck="false"
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            placeholder="Tambahkan deskripsi grup..."
                            className="w-full bg-transparent text-white/70 text-xs font-semibold focus:outline-none resize-none h-24 border-b border-border-divider/50 focus:border-accent-default pb-2 transall custom-scrollbar leading-relaxed"
                            autoFocus
                            onBlur={handleRequestSaveDescription}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                isRevertingRef.current = true;
                                setTempDescription(roomDescription);
                                setIsEditingDescription(false);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs font-semibold text-white/70 whitespace-pre-wrap flex-1 pb-4 leading-relaxed">
                            {roomDescription ||
                              (isOwnerOrAdmin
                                ? "Tambahkan deskripsi grup..."
                                : "Tidak ada deskripsi grup.")}
                          </p>
                          {isOwnerOrAdmin && (
                            <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transall bg-primary/50 backdrop-blur-md p-1.5 rounded-lg border border-white/5">
                              <PenSquare className="w-4 h-4 text-text-secondary" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-black/20 -mx-6 mb-4" />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-xs font-bold text-text-secondary">
                        {members.length} anggota
                      </h5>
                      <Search className="w-4 h-4 text-text-secondary cursor-pointer hover:text-white transall" />
                    </div>
                    {[...members]
                      .sort((a, b) =>
                        a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0,
                      )
                      .map((m) => (                        <div
                          key={m.user.id}
                          className={`py-2 px-3 rounded-xl flex items-center gap-3 transall group border ${
                            m.role === "owner"
                              ? "bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10"
                              : m.role === "admin"
                                ? "bg-accent-default/5 border-accent-default/10 hover:bg-accent-default/10"
                                : "bg-transparent border-transparent hover:bg-elevated/50"
                          }`}
                        >
                          <Image
                            src={
                              m.user.avatar_url || "/images/default-avatar.png"
                            }
                            alt={m.user.username}
                            width={40}
                            height={40}
                            className="rounded-full border border-border-divider object-cover w-10 h-10 shrink-0 bg-primary"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.srcset = "";
                              e.currentTarget.src =
                                "/images/default-avatar.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate flex items-center gap-1.5">
                              {m.user.full_name || m.user.username}
                              {m.role === "owner" && (
                                <Tooltip content="Owner" placement="top">
                                  <span className="flex">
                                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                  </span>
                                </Tooltip>
                              )}
                              {m.role === "admin" && (
                                <Tooltip content="Admin" placement="top">
                                  <span className="flex">
                                    <ShieldAlert className="w-3.5 h-3.5 text-accent-default" />
                                  </span>
                                </Tooltip>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {m.role === "owner" && (
                              <span className="text-[9px] font-black bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Owner
                              </span>
                            )}
                            {m.role === "admin" && (
                              <span className={`text-[9px] font-black bg-accent-default/10 text-accent-default px-2 py-0.5 rounded-md uppercase tracking-wider transall ${
                                canKick(m.role, m.user.id) ? "md:group-hover:hidden" : ""
                              }`}>
                                Admin
                              </span>
                            )}
                            {m.role === "user" && (
                              <span className={`text-[9px] font-bold bg-white/5 text-text-muted px-2 py-0.5 rounded-md uppercase tracking-wider transall ${
                                canKick(m.role, m.user.id) ? "md:group-hover:hidden" : ""
                              }`}>
                                Anggota
                              </span>
                            )}
                            {canKick(m.role, m.user.id) && (
                              <Tooltip
                                content="Kick Member"
                                placement="left"
                                triggerClassName="inline-flex md:hidden md:group-hover:flex shrink-0"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmKickUser({
                                      id: m.user.id,
                                      name: m.user.full_name || m.user.username,
                                    });
                                  }}
                                  disabled={isKicking === m.user.id}
                                  className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transall disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                >
                                  {isKicking === m.user.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Custom Premium Confirmation Dialog */}
            {confirmKickUser && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flexcc p-6">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm bg-secondary p-6 rounded-3xl border border-border-divider shadow-2xl text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flexcc mx-auto mb-4">
                    <UserMinus className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-2">
                    Kick Member?
                  </h4>
                  <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    Apakah Anda yakin ingin mengeluarkan{" "}
                    <span className="text-white font-black">
                      @{confirmKickUser.name}
                    </span>{" "}
                    dari grup ini?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmKickUser(null)}
                      className="flex-1 py-3 bg-elevated hover:bg-elevated/80 text-white font-bold rounded-2xl transall cursor-pointer text-sm"
                    >
                      Batal
                    </button>
                    <button
                      onClick={async () => {
                        const targetId = confirmKickUser.id;
                        setConfirmKickUser(null);
                        await handleKick(targetId);
                      }}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transall cursor-pointer text-sm"
                    >
                      Kick
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
            {/* Confirm Save Description Modal */}
            {isConfirmingSaveDesc && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flexcc p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm bg-secondary p-6 rounded-3xl border border-border-divider shadow-2xl text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-default/10 text-accent-default flexcc mx-auto mb-4">
                    <PenSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-2">
                    Simpan Perubahan?
                  </h4>
                  <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    Apakah Anda yakin ingin menyimpan deskripsi grup yang baru?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setTempDescription(roomDescription);
                        setIsEditingDescription(false);
                        setIsConfirmingSaveDesc(false);
                      }}
                      className="flex-1 py-3 bg-elevated hover:bg-elevated/80 text-white font-bold rounded-2xl transall cursor-pointer text-sm"
                    >
                      Batal
                    </button>
                    <button
                      onClick={executeSaveDescription}
                      className="flex-1 py-3 bg-accent-default hover:bg-accent-hover text-white font-bold rounded-2xl transall cursor-pointer text-sm"
                    >
                      Simpan
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
