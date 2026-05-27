import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User as UserIcon, MessageSquare, Calendar, AtSign } from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

interface UserProfileData {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  system_role: string;
  created_at?: string;
}

interface UserProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSendMessage?: (userId: string) => void;
}

export default function UserProfileSlider({
  isOpen,
  onClose,
  userId,
  onSendMessage,
}: UserProfileSliderProps) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevKey, setPrevKey] = useState("");

  const fetchKey = isOpen ? userId : "";
  if (fetchKey !== prevKey) {
    setPrevKey(fetchKey);
    if (fetchKey) {
      setIsLoading(true);
      setProfileData(null);
      apiFetch(`/users/${fetchKey}`, { cache: "no-store" })
        .then((res) => {
          if (res.success) setProfileData(res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
            {/* Header */}
            <div className="h-20 px-6 bg-secondary/50 border-b border-border-divider flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-accent-default" /> Info User
              </h3>
              <button
                onClick={onClose}
                className="cursor-pointer p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoading ? (
                <div className="py-10 flexcc text-xs text-text-muted animate-pulse">
                  Memuat info...
                </div>
              ) : profileData ? (
                <>
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center mb-8 pt-4">
                    <div className="w-40 h-40 bg-secondary/80 rounded-full flexcc mb-5 shadow-lg overflow-hidden border-2 border-border-divider/50 relative">
                      {profileData.avatar_url ? (
                        <Image
                          src={profileData.avatar_url}
                          alt={profileData.full_name || profileData.username}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.srcset = "";
                            e.currentTarget.src = "/images/default-avatar.png";
                          }}
                        />
                      ) : (
                        <span className="text-5xl font-black text-text-secondary">
                          {(profileData.full_name || profileData.username)?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-black text-white text-center">
                      {profileData.full_name || profileData.username}
                    </h2>
                    <p className="text-sm text-text-secondary font-medium mt-1">
                      @{profileData.username}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {onSendMessage && (
                    <div className="flex justify-center mb-8">
                      <button
                        onClick={() => onSendMessage(profileData.id)}
                        className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl hover:bg-elevated transall group"
                      >
                        <div className="w-12 h-12 bg-elevated border border-border-divider rounded-full flexcc group-hover:border-accent-default transall">
                          <MessageSquare className="w-5 h-5 text-text-secondary group-hover:text-accent-default transall" />
                        </div>
                        <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transall">
                          Message
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-border-divider mb-6" />

                  {/* Info Section */}
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-accent-default mb-3">
                        Informasi
                      </p>
                      <div className="space-y-4">
                        {/* Username */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-elevated rounded-xl flexcc shrink-0">
                            <AtSign className="w-4 h-4 text-text-secondary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-muted">Username</p>
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {profileData.username}
                            </p>
                          </div>
                        </div>

                        {/* Full Name */}
                        {profileData.full_name && (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-elevated rounded-xl flexcc shrink-0">
                              <UserIcon className="w-4 h-4 text-text-secondary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-text-muted">Nama Lengkap</p>
                              <p className="text-sm font-semibold text-text-primary truncate">
                                {profileData.full_name}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Join Date */}
                        {profileData.created_at && (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-elevated rounded-xl flexcc shrink-0">
                              <Calendar className="w-4 h-4 text-text-secondary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-text-muted">Bergabung Sejak</p>
                              <p className="text-sm font-semibold text-text-primary">
                                {formatDate(profileData.created_at)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 flexcc text-xs text-text-muted">
                  Gagal memuat profil user.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
