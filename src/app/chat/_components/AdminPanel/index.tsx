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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { User } from "@/types/chat";
import { useToast } from "@/components/Toast";
import Tooltip from "@/components/Tooltip";
import Image from "next/image";
import clsx from "clsx";
import SettingsModal from "../modals/SettingsModal";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [activeTab, setActiveTab] = useState<"users" | "moderators">("users");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      await fetchUsers(1);
      if (activeTab === "moderators") {
        await fetchInvites();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, roleFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      await fetchUsers(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleStatusChangeConfirmed = async () => {
    if (!targetUser || !pendingStatusChange) return;
    if (pendingStatusChange === "banned" && banConfirmUsername !== `@${targetUser.username}`) {
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
      <header className="h-18 border-b border-border-divider bg-secondary/80 backdrop-blur-xl px-6 flex justify-between items-center z-10">
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
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
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
                                    title="Copy ID full"
                                  >
                                    <Copy className="w-3 h-3 text-text-muted hover:text-text-primary" />
                                  </button>
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

                              {targetUserItem.status !== "banned" &&
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

            {/* Invites List */}
            <div className="lg:col-span-2 bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-border-divider/50 bg-secondary/30 flex justify-between items-center">
                <h3 className="text-sm font-black text-text-primary">
                  Daftar Undangan Moderator
                </h3>
                <button
                  onClick={fetchInvites}
                  className="text-xs font-bold text-accent-default hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-y-auto max-h-120">
                {isLoadingInvites ? (
                  <div className="py-20 text-center flexcc flex-col gap-2">
                    <Loader2 className="w-6 h-6 text-accent-default animate-spin" />
                    <span className="text-text-muted text-xs">
                      Memuat data...
                    </span>
                  </div>
                ) : invitesList.length === 0 ? (
                  <div className="py-20 text-center text-text-muted text-sm">
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
                              {new Date(invite.created_at).toLocaleDateString()}
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
                            onClick={() => copyInviteLink(invite.invite_token)}
                            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-white/5 text-text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
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
                    Ketik <strong className="text-red-500 font-black">@{targetUser.username}</strong> untuk konfirmasi ban
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
                  disabled={pendingStatusChange === "banned" && banConfirmUsername !== `@${targetUser.username}`}
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
