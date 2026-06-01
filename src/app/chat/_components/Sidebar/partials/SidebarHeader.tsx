import {
  Edit,
  User as UserIcon,
  Users,
  X,
  MoreVertical,
  Settings,
  LogOut,
  Bell,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "@/types/chat";
import ConfirmModal from "@/components/ConfirmModal";
import { useNotificationStore } from "@/store/useNotificationStore";
import clsx from "clsx";

interface SidebarHeaderProps {
  onSelectDM: () => void;
  onSelectGroup: () => void;
  user: User;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export default function SidebarHeader({
  onSelectDM,
  onSelectGroup,
  user,
  onLogout,
  onSettingsClick,
}: SidebarHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThreeDotsOpen, setIsThreeDotsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { notifications, unreadCount, markAsRead, deleteNotification, clearAllNotifications } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const threeDotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (
        threeDotsRef.current &&
        !threeDotsRef.current.contains(e.target as Node)
      ) {
        setIsThreeDotsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-16 px-3.5 flex items-center justify-between border-b border-border-divider bg-secondary/50 backdrop-blur-sm shrink-0 relative z-30">
      <div className="flex items-center gap-1">
        <Image
          src="/images/logo-light.png"
          alt="Lion"
          width={40}
          height={40}
          className="drop-shadow-lg"
        />
        <span className="text-xl font-black text-white tracking-tighter">
          GokilChat
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsOpen(false);
              setIsThreeDotsOpen(false);
            }}
            className="relative size-8.5 cursor-pointer rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flexcc leading-none border border-secondary">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 md:left-0 md:right-auto top-full mt-2 w-80 bg-secondary border border-border-divider rounded-2xl shadow-lg overflow-hidden z-50 origin-top-right md:origin-top-left"
              >
                <div className="p-4 border-b border-border-divider/50 bg-primary/20 flex justify-between items-center">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-accent-default" />
                    Notifikasi Official
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-accent-default bg-accent-default/10 px-2 py-0.5 rounded-full border border-accent-default/20">
                        {unreadCount} Baru
                      </span>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllNotifications();
                        }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border-divider/30">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-xs font-medium">
                      Belum ada notifikasi official 🗿
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read_at) {
                            markAsRead(notif.id);
                          }
                        }}
                        className={clsx(
                          "p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left relative group/notif",
                          !notif.read_at
                            ? "bg-accent-default/5 hover:bg-accent-default/10"
                            : "hover:bg-white/5",
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent-default/10 flexcc text-accent-default shrink-0 border border-accent-default/20">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-black text-xs text-white">
                              GokilChat Official
                            </span>
                            <span className="text-[9px] text-text-muted shrink-0">
                              {new Date(notif.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5 wrap-break-word">
                            {notif.content}
                          </p>
                        </div>

                        {/* Individual Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover/notif:opacity-100 transition-opacity p-1 text-text-muted hover:text-red-400 absolute right-2 top-2 rounded-md hover:bg-white/5 cursor-pointer z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {!notif.read_at && (
                          <div className="absolute right-2 bottom-2 w-1.5 h-1.5 bg-accent-default rounded-full" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pencil Button (New DM / Group) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setIsThreeDotsOpen(false);
            }}
            className="size-8.5 cursor-pointer rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 md:left-0 md:right-auto top-full mt-2 w-64 bg-secondary border border-border-divider rounded-2xl shadow-lg overflow-hidden z-50 origin-top-right md:origin-top-left"
              >
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSelectDM();
                    }}
                    className="w-full p-3 rounded-xl bg-transparent border border-transparent hover:border-accent-default hover:bg-accent-default/5 flex items-center gap-3 transall group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent-default/10 flexcc text-accent-default transall shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-sm text-white group-hover:text-accent-default transall">
                        Pesan Pribadi (DM)
                      </p>
                      <p className="text-[10px] text-text-secondary font-medium">
                        Ngobrol 1-on-1 lebih privat.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSelectGroup();
                    }}
                    className="w-full p-3 rounded-xl bg-transparent border border-transparent hover:border-accent-default hover:bg-accent-default/5 flex items-center gap-3 transall group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent-default/10 flexcc text-accent-default transall shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-sm text-white group-hover:text-accent-default transall">
                        Bikin Grup Baru
                      </p>
                      <p className="text-[10px] text-text-secondary font-medium">
                        Kumpulin orang-orang gokil.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Three-Dots Button (User Settings & Logout) - Visible only on mobile */}
        <div className="relative md:hidden" ref={threeDotsRef}>
          <button
            onClick={() => {
              setIsThreeDotsOpen(!isThreeDotsOpen);
              setIsOpen(false);
            }}
            className="size-8.5 cursor-pointer rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
          >
            {isThreeDotsOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <MoreVertical className="w-4.5 h-4.5" />
            )}
          </button>

          <AnimatePresence>
            {isThreeDotsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-secondary border border-border-divider rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
              >
                <div className="p-2 space-y-1">
                  {/* User Profile Mini Header */}
                  <div className="flex items-center gap-2 p-2 border-b border-border-divider/50 mb-1 bg-primary/20 rounded-xl">
                    <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-elevated border border-border-divider flexcc">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt="avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-bold text-accent-default text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-white truncate leading-tight">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-[9px] text-text-secondary truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsThreeDotsOpen(false);
                      onSettingsClick();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-elevated/50 flex items-center gap-2.5 text-text-secondary hover:text-white transall cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    <span className="font-bold text-xs">Pengaturan Profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsThreeDotsOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-red-500/10 flex items-center gap-2.5 text-text-secondary hover:text-red-400 transall cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-text-muted" />
                    <span className="font-bold text-xs">Keluar / Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Konfirmasi Keluar"
        description="Yakin mau keluar dari GokilChat? Ntar kangen lho 🗿"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
