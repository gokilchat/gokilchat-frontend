import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Link as LinkIcon, RefreshCw, Copy, Check } from "lucide-react";
import { User } from "@/types/chat";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import Tooltip from "@/components/Tooltip";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: User[];
  isSearching: boolean;
  onInvite: (userId: string) => Promise<void> | void;
  title?: string;
  activeRoomId?: string;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onInvite,
  title = "Invite Member",
  activeRoomId
}: InviteMemberModalProps) {
  const { toast } = useToast();
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isInviting, setIsInviting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeRoomId) {
      apiFetch(`/rooms/${activeRoomId}`).then(res => {
        if (res.success && res.data.invite_token) {
          setInviteToken(res.data.invite_token);
        }
      }).catch(() => {
        // Ignore error
      });
    } else {
      const timer = setTimeout(() => setInviteToken(null), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeRoomId]);

  const baseUrl = "https://chat.gokilchat.online";
  const inviteLink = inviteToken ? `${baseUrl}/join/${inviteToken}` : "";

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!activeRoomId) return;
    setIsRegenerating(true);
    try {
      const res = await apiFetch(`/rooms/${activeRoomId}/invite-token/regenerate`, { method: 'POST' });
      if (res.success) {
        setInviteToken(res.data.invite_token);
        setIsCopied(false);
      }
    } catch (err) {
      console.error(err);
      toast("Gagal memperbarui link undangan. Pastikan kamu owner grup.", "error");
    } finally {
      setIsRegenerating(false);
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
              <h3 className="text-lg font-black text-white">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-xl transall cursor-pointer">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
              {/* Bagian Link Undangan (Cuma Muncul di Grup) */}
              {activeRoomId && (
                <div className="mb-6 space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                    Link Undangan
                  </label>
                  {inviteToken ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-elevated border border-border-subtle rounded-2xl px-3 py-2 overflow-hidden group">
                        <LinkIcon className="w-4 h-4 text-text-muted shrink-0 mr-2" />
                        <span className="text-sm text-text-primary truncate font-medium">{inviteLink}</span>
                      </div>
                      <Tooltip content="Copy Link" placement="top">
                        <button 
                          onClick={handleCopy}
                          className="p-3 bg-accent-default hover:bg-accent-hover text-white rounded-2xl transall shrink-0 shadow-lg cursor-pointer"
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </Tooltip>
                      <Tooltip content="Reset Link" placement="top">
                        <button 
                          onClick={handleRegenerate}
                          disabled={isRegenerating}
                          className="p-3 bg-secondary border border-border-divider hover:bg-elevated text-text-secondary rounded-2xl transall shrink-0 cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="h-11 bg-elevated animate-pulse rounded-2xl" />
                  )}
                  <p className="text-[10px] text-text-muted px-1">
                    Siapapun yang punya link ini bisa langsung masuk grup (gak terpengaruh setting privasi).
                  </p>
                </div>
              )}

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Cari username atau email..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="py-10 flexcc text-xs text-text-muted animate-pulse">Mencari user gokil...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div 
                      key={u.id}
                      onClick={async () => {
                        if (isInviting) return;
                        setIsInviting(u.id);
                        try {
                          await onInvite(u.id);
                        } finally {
                          setIsInviting(null);
                        }
                      }}
                      className={`p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 transall group ${
                        isInviting === u.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <Image src={u.avatar_url || "/images/default-avatar.png"} alt={u.username} width={40} height={40} className="rounded-full border border-border-divider" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white group-hover:text-accent-default transall truncate">
                          {u.full_name || u.username}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold tracking-wider">
                          @{u.username}
                        </p>
                      </div>
                      {isInviting === u.id ? (
                        <RefreshCw className="w-4 h-4 text-accent-default animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 text-accent-default opacity-0 group-hover:opacity-100 transall" />
                      )}
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="py-10 flexcc text-xs text-text-muted italic">User nggak ketemu...</div>
                ) : (
                  <div className="py-10 flexcc text-xs text-text-muted italic text-center">
                    Ketik minimal 2 karakter buat <br/> cari calon temen gokil lu.
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
