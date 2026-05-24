import { motion, AnimatePresence } from "motion/react";
import { X, Search, UserMinus, Plus } from "lucide-react";
import { useState } from "react";
import { User } from "@/types/chat";
import Image from "next/image";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, selectedUsers: User[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: User[];
  isSearching: boolean;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSubmit,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
}: CreateRoomModalProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || selectedUsers.length === 0) return;
    onSubmit(newRoomName, selectedUsers);
    setNewRoomName("");
    setSelectedUsers([]);
  };

  const toggleUser = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

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
            className="relative w-full max-w-md bg-secondary border border-border-divider rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-border-divider flex items-center justify-between bg-elevated/20 shrink-0">
              <h3 className="text-lg font-black text-white">Bikin Room Baru</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-xs text-text-secondary mb-4 font-medium leading-relaxed">
                Kasih nama yang gokil buat room baru lu, terus pilih minimal 1
                temen buat diundang. Jangan bikin grup sepi ya! 🦁
              </p>

              <div className="relative mb-6">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nama room (misal: Markas Gokil)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-2xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent-default transall shadow-inner"
                />
              </div>

              {/* Selected Users Chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1.5 bg-accent-default/20 border border-accent-default/30 rounded-full py-1 pl-1.5 pr-3"
                    >
                      <Image
                        src={u.avatar_url || "/images/default-avatar.png"}
                        alt="avatar"
                        width={24}
                        height={24}
                        className="rounded-full w-6 h-6 object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.srcset = "";
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                      <span className="text-xs font-bold text-accent-default truncate max-w-25">
                        {u.username}
                      </span>
                      <button
                        onClick={() => toggleUser(u)}
                        className="ml-1 text-accent-default hover:text-red-400 transall"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search User */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari username temen..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                />
              </div>

              <div className="space-y-2 min-h-30">
                {isSearching ? (
                  <div className="py-6 flexcc text-xs text-text-muted animate-pulse">
                    Mencari...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => {
                    const isSelected = selectedUsers.some(
                      (su) => su.id === u.id,
                    );
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u)}
                        className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transall group ${
                          isSelected
                            ? "bg-accent-default/10 border-accent-default/50"
                            : "bg-primary/40 border-transparent hover:border-accent-default/30 hover:bg-accent-default/5"
                        }`}
                      >
                        <Image
                          src={u.avatar_url || "/images/default-avatar.png"}
                          alt={u.username}
                          width={36}
                          height={36}
                          className="rounded-full border border-border-divider w-9 h-9 object-cover"
                          referrerPolicy="no-referrer"
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
                        {isSelected ? (
                          <UserMinus className="w-4 h-4 text-accent-default" />
                        ) : (
                          <Plus className="w-4 h-4 text-text-muted group-hover:text-accent-default opacity-0 group-hover:opacity-100 transall" />
                        )}
                      </div>
                    );
                  })
                ) : searchQuery.length >= 2 ? (
                  <div className="py-6 flexcc text-xs text-text-muted italic">
                    User nggak ketemu...
                  </div>
                ) : (
                  <div className="py-6 flexcc text-xs text-text-muted italic text-center">
                    Cari dan pilih minimal 1 temen
                    <br />
                    buat dimasukin ke grup.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border-divider bg-elevated/20 shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-primary/40 hover:bg-elevated border border-border-divider rounded-2xl text-sm font-bold text-text-secondary transall"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!newRoomName.trim() || selectedUsers.length === 0}
                  className="flex-1 py-3.5 bg-accent-default hover:bg-accent-hover text-text-on-accent rounded-2xl text-sm font-black transall shadow-lg shadow-accent-default/20 disabled:opacity-30 flexcc gap-2"
                >
                  Bikin Room
                  {selectedUsers.length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                      {selectedUsers.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
