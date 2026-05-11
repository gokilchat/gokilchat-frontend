import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus } from "lucide-react";
import { User } from "@/types/chat";
import Image from "next/image";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: User[];
  isSearching: boolean;
  onInvite: (userId: string) => void;
  title?: string;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onInvite,
  title = "Invite Member"
}: InviteMemberModalProps) {
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
            className="relative w-full max-w-md bg-secondary border border-border-divider rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-divider flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-xl transall">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
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
                      onClick={() => onInvite(u.id)}
                      className="p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 cursor-pointer transall group"
                    >
                      <Image src={u.avatar_url || "/images/default-avatar.png"} alt={u.username} width={40} height={40} className="rounded-xl border border-border-divider" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-accent-default transall">{u.username}</p>
                      </div>
                      <Plus className="w-4 h-4 text-accent-default opacity-0 group-hover:opacity-100 transall" />
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
