"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  Shield,
  Search,
  Plus,
  Ban,
  LogOut,
  Copy,
  Mail,
  Send,
  AlertTriangle,
  UserCheck,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  History,
  ShieldAlert,
  Bell,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { User } from "@/types/chat";
import { useToast } from "@/components/Toast";
import Tooltip from "@/components/Tooltip";
import Image from "next/image";
import clsx from "clsx";
import SettingsModal from "../modals/SettingsModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { initSocket } from "@/lib/socket";
import { AnimatePresence, motion } from "motion/react";

// Custom Dropdown Component — mengganti native <select> yang jelek
interface SelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
}: {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 bg-secondary/80 border rounded-xl px-4 py-2.5 text-sm font-medium transition-all min-w-36",
          isOpen
            ? "border-accent-default ring-1 ring-accent-default text-text-primary"
            : "border-border-divider text-text-secondary hover:border-accent-default/50 hover:text-text-primary",
        )}
      >
        <span className="flex-1 text-left truncate">{selectedLabel}</span>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-text-muted transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-elevated border border-border-divider rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                opt.value === value
                  ? "bg-accent-default/15 text-accent-default font-bold"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminPanelProps {
  user: User;
  logout: () => void;
}

interface PaginatedUsers {
  users: (User & {
    status: "active" | "suspended" | "banned";
    created_at: string;
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface ModeratorInvite {
  id: string;
  email: string;
  invite_token: string;
  invited_by: string;
  used_at: string | null;
  created_at: string;
}

export default function AdminPanel({ user, logout }: AdminPanelProps) {
  const { toast } = useToast();
  const { token } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<"users" | "moderators" | "logs">(
    "users",
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User Management State
  const [usersList, setUsersList] = useState<PaginatedUsers["users"]>([]);
  const [pagination, setPagination] = useState<PaginatedUsers["pagination"]>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Status Update State
  const [targetUser, setTargetUser] = useState<
    PaginatedUsers["users"][number] | null
  >(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<
    "active" | "suspended" | "banned" | null
  >(null);
  const [statusReason, setStatusReason] = useState("");
  const [banConfirmUsername, setBanConfirmUsername] = useState("");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  // Demote Moderator State
  const [showDemoteConfirm, setShowDemoteConfirm] = useState(false);
  const [demoteTargetUser, setDemoteTargetUser] = useState<
    PaginatedUsers["users"][number] | null
  >(null);

  // Send Notification Modal State
  const [notifTargetUser, setNotifTargetUser] = useState<
    PaginatedUsers["users"][number] | null
  >(null);
  const [notifContent, setNotifContent] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Super Admin Moderator Invite State
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [invitesList, setInvitesList] = useState<ModeratorInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [moderatorsList, setModeratorsList] = useState<PaginatedUsers["users"]>(
    [],
  );
  const [isLoadingModerators, setIsLoadingModerators] = useState(false);

  // Audit Logs State
  interface AuditLog {
    id: string;
    admin_id: string;
    admin_username: string;
    admin_email: string;
    action: string;
    target_id: string;
    target_name: string;
    details: string;
    created_at: string;
  }
  const [logsList, setLogsList] = useState<AuditLog[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    total_pages: 1,
  });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const isSuperAdmin = user.system_role === "super_admin";

  // Fetch Users
  const fetchUsers = async (pageNumber = 1) => {
    setIsLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "15",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { system_role: roleFilter }),
      });
      const res = await apiFetch(`/admin/users?${queryParams.toString()}`);
      if (res.success) {
        setUsersList(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data user";
      toast(msg, "error");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Invites (Super Admin only)
  const fetchInvites = async () => {
    if (!isSuperAdmin) return;
    setIsLoadingInvites(true);
    try {
      const res = await apiFetch("/admin/moderators/invites");
      if (res.success) {
        setInvitesList(res.data);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data invites";
      toast(msg, "error");
    } finally {
      setIsLoadingInvites(false);
    }
  };

  // Fetch Moderators (Super Admin only)
  const fetchModerators = async () => {
    if (!isSuperAdmin) return;
    setIsLoadingModerators(true);
    try {
      const res = await apiFetch(
        "/admin/users?system_role=moderator&limit=100",
      );
      if (res.success && res.data) {
        setModeratorsList(res.data.users || []);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data moderator";
      toast(msg, "error");
    } finally {
      setIsLoadingModerators(false);
    }
  };

  const handleDemoteModerator = (user: PaginatedUsers["users"][number]) => {
    setDemoteTargetUser(user);
    setShowDemoteConfirm(true);
  };

  const handleDemoteModeratorConfirmed = async () => {
    if (!demoteTargetUser) return;
    const modId = demoteTargetUser.id;
    const modUsername = demoteTargetUser.username;
    try {
      const res = await apiFetch(`/admin/moderators/${modId}/demote`, {
        method: "PATCH",
      });
      if (res.success) {
        toast(
          `Jabatan @${modUsername} berhasil diturunkan menjadi user biasa 🗿`,
          "success",
        );
        setShowDemoteConfirm(false);
        setDemoteTargetUser(null);
        fetchModerators();
        fetchUsers(pagination.page);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menurunkan jabatan moderator";
      toast(msg, "error");
    }
  };

  // Fetch Logs (Super Admin only)
  const fetchLogs = async (pageNumber = 1) => {
    if (!isSuperAdmin) return;
    setIsLoadingLogs(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "15",
      });
      const res = await apiFetch(`/admin/logs?${queryParams.toString()}`);
      if (res.success) {
        setLogsList(res.data.logs);
        setLogsPagination(res.data.pagination);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data log audit";
      toast(msg, "error");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (activeTab === "users") {
        await fetchUsers(1);
      } else if (activeTab === "moderators") {
        await Promise.all([fetchInvites(), fetchModerators()]);
      } else if (activeTab === "logs") {
        await fetchLogs(1);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, roleFilter]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);
    socket.connect();

    const handleModeratorInvited = () => {
      fetchInvites();
    };

    const handleModeratorInviteAccepted = () => {
      fetchInvites();
      fetchModerators();
    };

    const handleModeratorStatusChanged = () => {
      fetchModerators();
      fetchUsers(pagination.page);
    };

    const handleUserStatusChanged = () => {
      fetchUsers(pagination.page);
      fetchModerators();
    };

    socket.on("admin:moderator_invited", handleModeratorInvited);
    socket.on("admin:moderator_invite_accepted", handleModeratorInviteAccepted);
    socket.on("admin:moderator_status_changed", handleModeratorStatusChanged);
    socket.on("admin:user_status_changed", handleUserStatusChanged);

    // Listen for notifications aimed at this staff member
    const handleNewNotification = (notif: {
      id: string;
      content: string;
      read_at: string | null;
      created_at: string;
    }) => {
      addNotification(notif);
      toast("Notifikasi Official Baru dari Staff 🛡️", "info");
    };
    socket.on("notification:new", handleNewNotification);

    // Force logout / redirect on kick event
    const handleAuthKick = (data: { error: string }) => {
      logout();
      window.location.href = `/?error=${encodeURIComponent(data.error)}`;
    };
    socket.on("auth:kick", handleAuthKick);

    // Fetch existing notifications on mount
    fetchNotifications();

    return () => {
      socket.off("admin:moderator_invited", handleModeratorInvited);
      socket.off(
        "admin:moderator_invite_accepted",
        handleModeratorInviteAccepted,
      );
      socket.off(
        "admin:moderator_status_changed",
        handleModeratorStatusChanged,
      );
      socket.off("admin:user_status_changed", handleUserStatusChanged);
      socket.off("notification:new", handleNewNotification);
      socket.off("auth:kick", handleAuthKick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pagination.page]);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search trigger for users
  useEffect(() => {
    if (activeTab !== "users") return;
    const delayDebounce = setTimeout(async () => {
      await fetchUsers(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleStatusChangeConfirmed = async () => {
    if (!targetUser || !pendingStatusChange) return;
    if (pendingStatusChange === "banned" && !isSuperAdmin) {
      toast(
        "Akses ditolak: Moderator tidak memiliki wewenang untuk melakukan Ban Permanen 🗿",
        "error",
      );
      return;
    }
    if (
      pendingStatusChange === "banned" &&
      banConfirmUsername !== `@${targetUser.username}`
    ) {
      toast("Konfirmasi username salah 🗿", "error");
      return;
    }
    try {
      const payload: {
        status: "active" | "suspended" | "banned";
        reason?: string;
      } = {
        status: pendingStatusChange,
      };
      if (pendingStatusChange !== "active" && statusReason.trim()) {
        payload.reason = statusReason.trim();
      }

      const res = await apiFetch(`/admin/users/${targetUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.success) {
        toast(
          `Status ${targetUser.username} berhasil diubah ke ${pendingStatusChange} 🗿`,
          "success",
        );
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, status: pendingStatusChange } : u,
          ),
        );
        setModeratorsList((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, status: pendingStatusChange } : u,
          ),
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengubah status user";
      toast(msg, "error");
    } finally {
      setShowStatusConfirm(false);
      setTargetUser(null);
      setPendingStatusChange(null);
      setStatusReason("");
      setBanConfirmUsername("");
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTargetUser || !notifContent.trim()) return;
    setIsSendingNotif(true);
    try {
      const res = await apiFetch("/notifications", {
        method: "POST",
        body: JSON.stringify({
          recipient_id: notifTargetUser.id,
          content: notifContent.trim(),
        }),
      });
      if (res.success) {
        toast(
          `Notifikasi resmi berhasil dikirim ke ${notifTargetUser.username} 📣`,
          "success",
        );
        setNotifTargetUser(null);
        setNotifContent("");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengirim notifikasi";
      toast(msg, "error");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const res = await apiFetch("/admin/moderators/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.success) {
        toast(
          `Undangan moderator berhasil dibuat untuk ${inviteEmail}! Link siap di-copy.`,
          "success",
        );
        setInviteEmail("");
        fetchInvites();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengundang moderator";
      toast(msg, "error");
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/join/moderator?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast("Link undangan disalin ke clipboard 📋", "success");
  };

  return (
    <div className="flex-1 h-screen bg-primary flex flex-col font-sans text-text-primary overflow-hidden relative">
      {/* Top Navigation / Dashboard Header */}
      <header className="h-18 border-b border-border-divider bg-secondary/80 backdrop-blur-xl px-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-default/10 border border-accent-default/20 rounded-xl flexcc shadow-inner">
            <Shield className="w-5 h-5 text-accent-default" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-text-primary flex items-center gap-2">
              Staff Portal{" "}
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default border border-accent-default/20 font-bold">
                {user.system_role === "super_admin"
                  ? "Super Admin"
                  : "Moderator"}
              </span>
            </h1>
            <p className="text-xs text-text-muted">
              Akses panel kontrol moderator dan administrasi
            </p>
          </div>
        </div>

        {/* User Info / LogOut */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <Tooltip content="Notifikasi" placement="bottom">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-10 h-10 bg-secondary/30 border border-white/5 hover:bg-white/5 hover:border-white/10 rounded-xl flexcc transition-all cursor-pointer text-text-secondary hover:text-accent-default"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flexcc leading-none border border-secondary">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-secondary border border-border-divider rounded-2xl shadow-lg overflow-hidden z-50 origin-top-right"
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

          <Tooltip content="Pengaturan Profil" placement="left">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2.5 bg-secondary/30 border border-white/5 py-1.5 pl-2.5 pr-4 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-accent-default"
            >
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-accent-default/20 text-accent-default flexcc font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-black text-text-primary leading-tight">
                  {user.full_name || user.username}
                </div>
                <div className="text-[10px] text-text-muted leading-tight">
                  {user.email}
                </div>
              </div>
            </button>
          </Tooltip>

          <Tooltip content="Keluar" placement="left">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/20 rounded-xl flexcc transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 flex gap-2 border-b border-border-divider bg-primary z-10">
        <button
          onClick={() => setActiveTab("users")}
          className={clsx(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === "users"
              ? "border-accent-default text-text-primary"
              : "border-transparent text-text-muted hover:text-text-primary",
          )}
        >
          <Users className="w-4 h-4" />
          <span>Daftar User</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("moderators")}
            className={clsx(
              "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === "moderators"
                ? "border-accent-default text-text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Manajemen Moderator</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("logs")}
            className={clsx(
              "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === "logs"
                ? "border-accent-default text-text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            <History className="w-4 h-4" />
            <span>Log Audit</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 z-10">
        {activeTab === "users" && (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            {/* Filters / Search Bar — always visible, never scrolls */}
            <div className="flex flex-col md:flex-row gap-3 bg-secondary/20 border border-white/5 p-4 rounded-2xl shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari user berdasarkan username atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/80 border border-border-divider rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-default focus:ring-1 focus:ring-accent-default focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Semua Status"
                  options={[
                    { value: "", label: "Semua Status" },
                    { value: "active", label: "Active" },
                    { value: "suspended", label: "Suspended" },
                    { value: "banned", label: "Banned" },
                  ]}
                />

                {isSuperAdmin && (
                  <CustomSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    placeholder="Semua Role"
                    options={[
                      { value: "", label: "Semua Role" },
                      { value: "user", label: "User" },
                      { value: "moderator", label: "Moderator" },
                      { value: "super_admin", label: "Super Admin" },
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Users Table — scrollable data area */}
            <div className="flex-1 bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0">
              {/* Table Header Wrapper (no scrollbar next to it) */}
              <div className="bg-secondary border-b border-border-divider/50 pr-4 max-md:pr-1">
                <table className="w-full text-left border-collapse text-sm table-fixed">
                  <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[27%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-text-muted font-bold text-xs uppercase tracking-wider">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Table Body Wrapper (scrollable with overflow-y-scroll) */}
              <div className="flex-1 overflow-y-scroll custom-scrollbar min-h-0">
                <table className="w-full text-left border-collapse text-sm table-fixed">
                  <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[27%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <tbody>
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flexcc flex-col gap-3">
                            <Loader2 className="w-8 h-8 text-accent-default animate-spin" />
                            <span className="text-text-secondary text-xs">
                              Memuat data user...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-20 text-center text-text-muted text-sm"
                        >
                          Tidak ada user yang ditemukan 🗿
                        </td>
                      </tr>
                    ) : (
                      usersList.map((targetUserItem) => (
                        <tr
                          key={targetUserItem.id}
                          className="border-b border-border-divider/50 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {targetUserItem.avatar_url ? (
                                <Image
                                  src={targetUserItem.avatar_url}
                                  alt={targetUserItem.username}
                                  width={36}
                                  height={36}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-accent-default/10 text-accent-default border border-accent-default/20 flexcc font-black text-sm">
                                  {targetUserItem.username
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-text-primary block leading-tight">
                                  {targetUserItem.username}
                                </span>
                                <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                  ID: {targetUserItem.id.substring(0, 8)}...
                                  <Tooltip
                                    content="Salin ID Lengkap"
                                    placement="top"
                                  >
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          targetUserItem.id,
                                        );
                                        toast(
                                          "ID User disalin ke clipboard 📋",
                                          "success",
                                        );
                                      }}
                                      className="p-0.5 hover:bg-white/10 rounded cursor-pointer transition-colors"
                                    >
                                      <Copy className="w-3 h-3 text-text-muted hover:text-text-primary" />
                                    </button>
                                  </Tooltip>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-text-secondary">
                            {targetUserItem.email}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold border inline-block",
                                targetUserItem.system_role === "super_admin" &&
                                  "bg-red-500/10 text-red-400 border-red-500/20",
                                targetUserItem.system_role === "moderator" &&
                                  "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                targetUserItem.system_role === "user" &&
                                  "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              )}
                            >
                              {targetUserItem.system_role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold border inline-block",
                                targetUserItem.status === "active" &&
                                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                targetUserItem.status === "suspended" &&
                                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                targetUserItem.status === "banned" &&
                                  "bg-red-500/10 text-red-500 border-red-500/20",
                              )}
                            >
                              {targetUserItem.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Send Official Notification Button */}
                              {targetUserItem.status !== "banned" &&
                                targetUserItem.id !== user.id &&
                                targetUserItem.email !== user.email && (
                                  <Tooltip
                                    content="Kirim Notifikasi Official"
                                    placement="top"
                                  >
                                    <button
                                      onClick={() =>
                                        setNotifTargetUser(targetUserItem)
                                      }
                                      className="px-3 py-1.5 bg-accent-default/20 hover:bg-accent-default/35 border border-accent-default/30 text-text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                      <Send className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary" />
                                      <span>Notifikasi</span>
                                    </button>
                                  </Tooltip>
                                )}

                              {/* Toggle Status Buttons */}
                              {targetUserItem.status === "suspended" &&
                                targetUserItem.id !== user.id &&
                                targetUserItem.email !== user.email && (
                                  <Tooltip
                                    content="Aktifkan Akun"
                                    placement="top"
                                  >
                                    <button
                                      onClick={() => {
                                        setTargetUser(targetUserItem);
                                        setPendingStatusChange("active");
                                        setShowStatusConfirm(true);
                                      }}
                                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  </Tooltip>
                                )}

                              {targetUserItem.status === "active" &&
                                targetUserItem.id !== user.id &&
                                targetUserItem.email !== user.email && (
                                  <Tooltip
                                    content="Suspend Akun"
                                    placement="top"
                                  >
                                    <button
                                      onClick={() => {
                                        setTargetUser(targetUserItem);
                                        setPendingStatusChange("suspended");
                                        setShowStatusConfirm(true);
                                      }}
                                      className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold transition-all"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </button>
                                  </Tooltip>
                                )}

                              {isSuperAdmin &&
                                targetUserItem.status !== "banned" &&
                                targetUserItem.id !== user.id &&
                                targetUserItem.email !== user.email && (
                                  <Tooltip content="Ban Akun" placement="top">
                                    <button
                                      onClick={() => {
                                        setTargetUser(targetUserItem);
                                        setPendingStatusChange("banned");
                                        setShowStatusConfirm(true);
                                      }}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  </Tooltip>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-border-divider/50 bg-secondary/20 flex justify-between items-center text-xs text-text-muted">
                  <span>
                    Menampilkan {usersList.length} dari {pagination.total} user
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchUsers(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 bg-secondary/30 hover:bg-secondary/50 rounded-lg border border-white/5 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="flexcc px-3 font-bold bg-accent-default/10 border border-accent-default/20 text-accent-default rounded-lg">
                      {pagination.page} / {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => fetchUsers(pagination.page + 1)}
                      disabled={pagination.page === pagination.total_pages}
                      className="p-2 bg-secondary/30 hover:bg-secondary/50 rounded-lg border border-white/5 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "moderators" && isSuperAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
            {/* Invite Moderator Form */}
            <div className="lg:col-span-1 bg-secondary/10 border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-fit gap-4">
              <div>
                <h3 className="text-md font-black text-text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-default" />
                  <span>Undang Moderator</span>
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Masukkan email Google calon Moderator. Undangan ini
                  memungkinkan mereka mengaktifkan akun Staff.
                </p>
              </div>

              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">
                    Email Google
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="calon.staff@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-secondary/80 border border-border-divider rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-default focus:ring-1 focus:ring-accent-default focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full py-3 bg-accent-default hover:bg-accent-hover text-text-primary font-black rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-accent-default/10 flexcc gap-2 disabled:opacity-50"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Token...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Buat Undangan</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Moderators & Invites Lists */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active/Suspended Moderators Panel */}
              <div className="bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-border-divider/50 bg-secondary/30 flex justify-between items-center">
                  <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent-default" />
                    <span>Daftar Moderator</span>
                  </h3>
                  <button
                    onClick={fetchModerators}
                    className="text-xs font-bold text-accent-default hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  {isLoadingModerators ? (
                    <div className="py-12 text-center flexcc flex-col gap-2">
                      <Loader2 className="w-6 h-6 text-accent-default animate-spin" />
                      <span className="text-text-muted text-xs">
                        Memuat data...
                      </span>
                    </div>
                  ) : moderatorsList.length === 0 ? (
                    <div className="py-12 text-center text-text-muted text-sm">
                      Belum ada moderator terdaftar.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-divider/30">
                      {moderatorsList.map((mod) => (
                        <div
                          key={mod.id}
                          className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {mod.avatar_url ? (
                              <Image
                                src={mod.avatar_url}
                                alt={mod.username}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-accent-default/10 text-accent-default border border-accent-default/20 flexcc font-black text-sm">
                                {mod.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-text-primary text-sm block">
                                @{mod.username}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-text-muted">
                                  {mod.email}
                                </span>
                                <span
                                  className={clsx(
                                    "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                                    mod.status === "active"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : mod.status === "banned"
                                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                  )}
                                >
                                  {mod.status === "active"
                                    ? "Aktif"
                                    : mod.status === "banned"
                                      ? "Dibanned"
                                      : "Ditangguhkan"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Notifikasi Button (Active or Suspended) */}
                            {mod.status !== "banned" && (
                              <Tooltip
                                content="Kirim Notifikasi Official"
                                placement="top"
                              >
                                <button
                                  onClick={() => setNotifTargetUser(mod)}
                                  className="px-3 py-1.5 bg-secondary/40 border border-white/5 hover:bg-white/5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary group"
                                >
                                  <Send className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary" />
                                  <span>Notifikasi</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Demote Button (Super Admin only, Active status only) */}
                            {isSuperAdmin && mod.status === "active" && (
                              <Tooltip
                                content="Turunkan Jabatan"
                                placement="top"
                              >
                                <button
                                  onClick={() => handleDemoteModerator(mod)}
                                  className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 hover:border-purple-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span>Demote</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Suspend Button (Active status only) */}
                            {mod.status === "active" && (
                              <Tooltip content="Suspend Akun" placement="top">
                                <button
                                  onClick={() => {
                                    setTargetUser(mod);
                                    setPendingStatusChange("suspended");
                                    setShowStatusConfirm(true);
                                  }}
                                  className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white border border-yellow-500/20 hover:border-yellow-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Reaktifkan Button (Suspended status only) */}
                            {mod.status === "suspended" && (
                              <Tooltip content="Aktifkan Akun" placement="top">
                                <button
                                  onClick={() => {
                                    setTargetUser(mod);
                                    setPendingStatusChange("active");
                                    setShowStatusConfirm(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Reaktifkan</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Ban Button (Super Admin only, Active or Suspended status only) */}
                            {isSuperAdmin && mod.status !== "banned" && (
                              <Tooltip content="Ban Akun" placement="top">
                                <button
                                  onClick={() => {
                                    setTargetUser(mod);
                                    setPendingStatusChange("banned");
                                    setShowStatusConfirm(true);
                                  }}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Ban</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Banned Permanen Status (Banned status only) */}
                            {mod.status === "banned" && (
                              <span className="px-3 py-1.5 bg-red-500/5 text-red-500/60 border border-red-500/10 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Ban className="w-3.5 h-3.5" />
                                <span>Permanen</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Invites List Panel */}
              <div className="bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-border-divider/50 bg-secondary/30 flex justify-between items-center">
                  <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-default" />
                    <span>Daftar Undangan Moderator</span>
                  </h3>
                  <button
                    onClick={fetchInvites}
                    className="text-xs font-bold text-accent-default hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  {isLoadingInvites ? (
                    <div className="py-12 text-center flexcc flex-col gap-2">
                      <Loader2 className="w-6 h-6 text-accent-default animate-spin" />
                      <span className="text-text-muted text-xs">
                        Memuat data...
                      </span>
                    </div>
                  ) : invitesList.length === 0 ? (
                    <div className="py-12 text-center text-text-muted text-sm">
                      Belum ada undangan moderator yang dibuat.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-divider/30">
                      {invitesList.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <span className="font-bold text-text-primary text-sm block">
                              {invite.email}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-text-muted">
                                Dibuat:{" "}
                                {new Date(
                                  invite.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <span
                                className={clsx(
                                  "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                                  invite.used_at
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                )}
                              >
                                {invite.used_at ? "Digunakan" : "Pending"}
                              </span>
                            </div>
                          </div>

                          {!invite.used_at && (
                            <button
                              onClick={() =>
                                copyInviteLink(invite.invite_token)
                              }
                              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-white/5 text-text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && isSuperAdmin && (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            {/* Table Area */}
            <div className="flex-1 bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-xl relative">
              {/* Table Header Wrapper (no scrollbar next to it) */}
              <div className="bg-secondary border-b border-border-divider/50 pr-4 max-md:pr-1">
                <table className="w-full text-left border-collapse text-sm table-fixed">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[18%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-text-muted font-bold text-xs uppercase tracking-wider">
                      <th className="py-4 px-6">Waktu</th>
                      <th className="py-4 px-6">Staf Admin</th>
                      <th className="py-4 px-6">Aksi</th>
                      <th className="py-4 px-6">Target</th>
                      <th className="py-4 px-6">Detail / Alasan</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Table Body Wrapper (scrollable with overflow-y-scroll) */}
              <div className="flex-1 overflow-y-scroll custom-scrollbar min-h-0 relative">
                {isLoadingLogs ? (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flexcc flex-col gap-2 z-20">
                    <Loader2 className="w-8 h-8 text-accent-default animate-spin" />
                    <span className="text-text-muted text-xs font-bold">
                      Memuat log audit...
                    </span>
                  </div>
                ) : null}

                <table className="w-full text-left border-collapse text-sm table-fixed">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[18%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <tbody className="divide-y divide-border-divider/30 text-sm">
                    {logsList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-20 text-center text-text-muted"
                        >
                          Belum ada log audit tindakan staff.
                        </td>
                      </tr>
                    ) : (
                      logsList.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6 text-text-secondary text-xs">
                            {new Date(log.created_at).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-bold text-text-primary text-xs">
                                @{log.admin_username}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {log.admin_email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                log.action.includes("suspend") &&
                                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                log.action.includes("ban") &&
                                  "bg-red-500/10 text-red-400 border-red-500/20",
                                log.action.includes("activate") &&
                                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                log.action.includes("delete_room") &&
                                  "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                log.action.includes("invite_moderator") &&
                                  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                                log.action.includes("broadcast") &&
                                  "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                log.action.includes("demote") &&
                                  "bg-purple-500/10 text-purple-400 border-purple-500/20",
                              )}
                            >
                              {log.action.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-text-primary font-medium text-xs">
                            {log.target_name || `-`}
                          </td>
                          <td className="py-4 px-6 text-text-muted text-xs leading-relaxed max-w-xs truncate">
                            {log.details || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {logsPagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-border-divider/50 bg-secondary/20 flex justify-between items-center shrink-0">
                  <span className="text-xs text-text-muted">
                    Menampilkan{" "}
                    <strong className="text-text-secondary">
                      {(logsPagination.page - 1) * logsPagination.limit + 1}
                    </strong>{" "}
                    -{" "}
                    <strong className="text-text-secondary">
                      {Math.min(
                        logsPagination.page * logsPagination.limit,
                        logsPagination.total,
                      )}
                    </strong>{" "}
                    dari{" "}
                    <strong className="text-text-secondary">
                      {logsPagination.total}
                    </strong>{" "}
                    log
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fetchLogs(logsPagination.page - 1)}
                      disabled={logsPagination.page === 1 || isLoadingLogs}
                      className="p-1.5 bg-secondary border border-border-divider rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-secondary transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-text-primary font-bold px-2">
                      {logsPagination.page} / {logsPagination.total_pages}
                    </span>
                    <button
                      onClick={() => fetchLogs(logsPagination.page + 1)}
                      disabled={
                        logsPagination.page === logsPagination.total_pages ||
                        isLoadingLogs
                      }
                      className="p-1.5 bg-secondary border border-border-divider rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-secondary transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Notification Modal */}
      {notifTargetUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNotifTargetUser(null);
              setNotifContent("");
            }
          }}
          className="fixed inset-0 bg-black/70 flexcc z-999 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-secondary border border-border-divider p-6 rounded-3xl relative shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setNotifTargetUser(null);
                setNotifContent("");
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-text-primary flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-accent-default" />
              <span>Kirim Notifikasi Official</span>
            </h2>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Kirim pesan resmi satu arah ke{" "}
              <strong className="text-text-primary">
                @{notifTargetUser.username}
              </strong>
              . Nama pengirim akan disamarkan sebagai{" "}
              <strong className="text-accent-default">
                GokilChat Official
              </strong>{" "}
              demi kenyamanan moderasi.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1.5">
                  Isi Pesan Notifikasi
                </label>
                <textarea
                  required
                  placeholder="Ketik pesan resmi di sini..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  rows={4}
                  className="w-full bg-primary border border-border-divider rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-default focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setNotifTargetUser(null);
                    setNotifContent("");
                  }}
                  className="px-4 py-2 border border-border-divider/50 hover:border-border-divider bg-transparent hover:bg-white/5 text-text-muted hover:text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-4 py-2 bg-accent-default hover:bg-accent-hover disabled:opacity-50 text-text-primary text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isSendingNotif ? "Mengirim..." : "Kirim Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Ban Confirmation Modal */}
      {showStatusConfirm && targetUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusConfirm(false);
              setTargetUser(null);
              setPendingStatusChange(null);
              setStatusReason("");
              setBanConfirmUsername("");
            }
          }}
          className="fixed inset-0 bg-black/70 flexcc z-999 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-secondary border border-border-divider p-6 rounded-3xl relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowStatusConfirm(false);
                setTargetUser(null);
                setPendingStatusChange(null);
                setStatusReason("");
                setBanConfirmUsername("");
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-text-primary flex items-center gap-2 mb-2">
              {pendingStatusChange === "banned" ? (
                <>
                  <Ban className="w-5 h-5 text-red-500" />
                  <span>Ban Akun?</span>
                </>
              ) : pendingStatusChange === "suspended" ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>Suspend Akun?</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                  <span>Aktifkan Akun?</span>
                </>
              )}
            </h2>

            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Lu yakin mau mengubah status akun{" "}
              <strong className="text-text-primary">
                @{targetUser.username}
              </strong>{" "}
              menjadi{" "}
              <span
                className={clsx(
                  "font-bold uppercase",
                  pendingStatusChange === "banned" && "text-red-500",
                  pendingStatusChange === "suspended" && "text-yellow-500",
                  pendingStatusChange === "active" && "text-emerald-500",
                )}
              >
                {pendingStatusChange}
              </span>
              ? User mungkin akan langsung kehilangan akses atau terputus secara
              real-time.
            </p>

            <div className="space-y-4">
              {pendingStatusChange !== "active" && (
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">
                    Alasan{" "}
                    {pendingStatusChange === "banned" ? "Banned" : "Suspended"}{" "}
                    (Opsional)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder={`Ketik alasan kenapa user ini di-${pendingStatusChange}...`}
                    rows={3}
                    className="w-full bg-primary border border-border-divider rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-default focus:outline-none transition-all resize-none"
                  />
                </div>
              )}

              {pendingStatusChange === "banned" && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">
                    Ketik{" "}
                    <strong className="text-red-500 font-black">
                      @{targetUser.username}
                    </strong>{" "}
                    untuk konfirmasi ban
                  </label>
                  <input
                    type="text"
                    value={banConfirmUsername}
                    onChange={(e) => setBanConfirmUsername(e.target.value)}
                    placeholder={`@${targetUser.username}`}
                    className="w-full bg-primary border border-border-divider rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-red-500 focus:outline-none transition-all"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusConfirm(false);
                    setTargetUser(null);
                    setPendingStatusChange(null);
                    setStatusReason("");
                    setBanConfirmUsername("");
                  }}
                  className="px-4 py-2 border border-border-divider/50 hover:border-border-divider bg-transparent hover:bg-white/5 text-text-muted hover:text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleStatusChangeConfirmed}
                  disabled={
                    pendingStatusChange === "banned" &&
                    banConfirmUsername !== `@${targetUser.username}`
                  }
                  className={clsx(
                    "px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer",
                    pendingStatusChange === "banned" &&
                      "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-600/30 disabled:text-white/40 disabled:cursor-not-allowed",
                    pendingStatusChange === "suspended" &&
                      "bg-yellow-600 hover:bg-yellow-700 text-black",
                    pendingStatusChange === "active" &&
                      "bg-emerald-600 hover:bg-emerald-700 text-white",
                  )}
                >
                  Ya, Ubah Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDemoteConfirm && demoteTargetUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDemoteConfirm(false);
              setDemoteTargetUser(null);
            }
          }}
          className="fixed inset-0 bg-black/70 flexcc z-999 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-secondary border border-border-divider p-6 rounded-3xl relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowDemoteConfirm(false);
                setDemoteTargetUser(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-text-primary flex items-center gap-2 mb-2">
              <UserMinus className="w-5 h-5 text-purple-500" />
              <span>Turunkan Jabatan Moderator?</span>
            </h2>

            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              Lu yakin mau menurunkan jabatan{" "}
              <strong className="text-text-primary">
                @{demoteTargetUser.username}
              </strong>{" "}
              menjadi user biasa? Akun akan langsung kehilangan hak akses moderator dan dikeluarkan dari panel admin secara real-time.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDemoteConfirm(false);
                  setDemoteTargetUser(null);
                }}
                className="px-4 py-2 border border-border-divider/50 hover:border-border-divider bg-transparent hover:bg-white/5 text-text-muted hover:text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDemoteModeratorConfirmed}
                className="px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer bg-purple-600 hover:bg-purple-750 text-white"
              >
                Ya, Turunkan Jabatan
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Konfirmasi Keluar"
        description="Yakin mau keluar dari panel admin? Kerja keras lu hari ini luar biasa 🗿"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
