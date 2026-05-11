"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { initSocket, getSocket, disconnectSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LogOut,
  Settings,
  MessageCircle,
  Send,
  Search,
  Info,
  MoreVertical,
  Paperclip,
  Smile,
  Edit,
  UserPlus,
  X,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

import { User } from "@/types/chat";

export default function ChatPage() {
  const { user, token, logout } = useAuthStore();
  const {
    rooms,
    activeRoomId,
    messages,
    setRooms,
    setActiveRoomId,
    setMessages,
    addMessage,
  } = useChatStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);
  const router = useRouter();

  // Handle hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Resizable Sidebar logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Protect route
  useEffect(() => {
    if (isHydrated && !user) router.push("/");
  }, [user, router, isHydrated]);

  // Init socket and fetch rooms
  useEffect(() => {
    if (!isHydrated || !user || !token) return;

    const socket = initSocket(token);
    socket.connect();

    socket.on("new_message", (message) => {
      addMessage(message);
    });

    apiFetch("/rooms")
      .then((res) => {
        if (res.success) setRooms(res.data);
      })
      .catch(console.error);

    return () => {
      socket.off("new_message");
      disconnectSocket();
    };
  }, [isHydrated, user, token, setRooms, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeRoomId) inputRef.current?.focus();
  }, [activeRoomId]);

  const handleRoomClick = async (roomId: string) => {
    if (activeRoomId === roomId) return;
    setActiveRoomId(roomId);

    const socket = getSocket();
    if (socket) socket.emit("join_room", roomId);

    try {
      const res = await apiFetch(`/rooms/${roomId}/messages`);
      if (res.success) setMessages(res.data);
    } catch {
      console.error("Gagal mengambil pesan");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoomId) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("send_message", {
        room_id: activeRoomId,
        content: messageInput,
      });
      setMessageInput("");
    }
  };

  const handleCreateRoom = async () => {
    const name = prompt("Masukkan nama room baru:");
    if (!name) return;
    try {
      const res = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (res.success) {
        setRooms([res.data, ...rooms]);
        handleRoomClick(res.data.id);
      }
    } catch {
      alert("Gagal bikin room");
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiFetch(`/users?query=${query}`);
      if (res.success) setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (targetUserId: string) => {
    if (!activeRoomId) return;
    try {
      const res = await apiFetch(`/rooms/${activeRoomId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: targetUserId })
      });
      if (res.success) {
        alert("User berhasil di-invite!");
        setShowInviteModal(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal invite user";
      alert(msg);
    }
  };

  if (!isHydrated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <div className="flex h-screen overflow-hidden bg-primary font-sans">
      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="flex flex-col h-full bg-secondary border-r border-border-divider relative group"
      >
        {/* Resize Handle */}
        <div
          onMouseDown={() => {
            isResizing.current = true;
            document.body.style.cursor = "col-resize";
          }}
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-accent-default/30 transall z-20"
        />

        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border-divider bg-secondary/50 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <Image
              src="/images/logo-light.png"
              alt="Lion"
              width={40}
              height={40}
            />
            <span className="font-black text-xl tracking-tight text-white">
              GokilChat
            </span>
          </div>
          <button
            onClick={handleCreateRoom}
            className="w-8 h-8 rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-default transall" />
            <input
              type="text"
              placeholder="Cari obrolan..."
              className="w-full bg-elevated border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-primary focus:outline-none focus:border-accent-default transall"
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 space-y-1">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className={clsx(
                  "group p-3 rounded-2xl flex items-center gap-3 cursor-pointer transall relative",
                  activeRoomId === room.id
                    ? "bg-accent-default/10 border border-accent-default/20"
                    : "hover:bg-elevated/50 border border-transparent",
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-accent-default to-primary-hover flexcc text-white font-bold shadow-lg">
                    {room.name?.charAt(0) || "P"}
                  </div>
                  {/* Status online dot mock */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-status-online rounded-full border-2 border-secondary shadow-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={clsx(
                        "font-bold text-sm truncate",
                        activeRoomId === room.id
                          ? "text-white"
                          : "text-text-primary",
                      )}
                    >
                      {room.name || "Private Chat"}
                    </h3>
                    <span className="text-[10px] text-text-muted font-medium">
                      12:45
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate pr-4">
                    Pesan gokil terakhir lu di sini...
                  </p>
                </div>

                {/* Unread Badge mock */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transall">
                  <div className="w-5 h-5 bg-accent-default rounded-full flexcc text-[10px] font-black text-white shadow-md">
                    2
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-elevated/20 border-t border-border-divider">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-secondary/40 backdrop-blur-md border border-white/5">
            <div className="relative">
              {user.avatar_url && (
                <Image
                  src={user.avatar_url}
                  alt="Profile"
                  width={42}
                  height={42}
                  className="rounded-2xl border border-accent-default/30 shadow-md"
                />
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-status-online rounded-full border-2 border-[#222] shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">
                {user.username}
              </p>
              <p className="text-[10px] text-text-secondary truncate uppercase tracking-widest font-bold">
                Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 text-text-secondary hover:text-white transall">
                <Settings className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-text-secondary hover:text-red-400 transall"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-primary overflow-hidden">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-primary/80 backdrop-blur-xl border-b border-border-divider z-10 sticky top-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-default/20 flexcc border border-accent-default/20 text-accent-default font-black">
                  {activeRoom.name?.charAt(0) || "#"}
                </div>
                <div>
                  <h3 className="font-black text-white tracking-tight">
                    {activeRoom.name || "Private Chat"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-online shadow-[0_0_8px_var(--color-status-online)]" />
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                      12 member online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="p-2.5 hover:bg-elevated/50 rounded-xl transall hover:text-accent-default text-accent-default"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
                <button className="p-2.5 hover:bg-elevated/50 rounded-xl transall hover:text-white">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2.5 hover:bg-elevated/50 rounded-xl transall hover:text-white">
                  <Info className="w-5 h-5" />
                </button>
                <button className="p-2.5 hover:bg-elevated/50 rounded-xl transall hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[url('/images/chat-bg.png')] bg-fixed opacity-95">
              {messages.length === 0 ? (
                <div className="h-full flexcc text-center p-10">
                  <div className="w-24 h-24 bg-accent-default/5 rounded-full flexcc mb-6 border border-accent-default/10 animate-pulse">
                    <MessageCircle className="w-10 h-10 text-accent-default/40" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">
                    Belum ada gokil-gokilan di sini.
                  </h3>
                  <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
                    Jadilah yang pertama ngirim pesan dan bikin suasana jadi
                    pecah! 🗿
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Date Separator mock */}
                  <div className="flexcc py-4">
                    <div className="px-4 py-1.5 bg-secondary border border-border-divider rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted shadow-sm">
                      Hari Ini
                    </div>
                  </div>

                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || idx}
                        className={clsx(
                          "flex gap-4 group",
                          isMe ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        {!isMe && (
                          <div className="relative shrink-0">
                            <Image
                              src={
                                msg.sender_avatar ||
                                "/images/default-avatar.png"
                              }
                              alt="avatar"
                              width={40}
                              height={40}
                              className="rounded-xl border border-border-divider shadow-sm"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-online rounded-full border-2 border-primary shadow-sm" />
                          </div>
                        )}
                        <div
                          className={clsx(
                            "flex flex-col max-w-[70%]",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          {!isMe && (
                            <span className="text-[10px] font-black text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">
                              {msg.sender_username}
                            </span>
                          )}
                          <div
                            className={clsx(
                              "px-5 py-3.5 shadow-xl relative",
                              isMe
                                ? "bg-accent-default text-text-on-accent rounded-3xl rounded-tr-sm"
                                : "bg-secondary border border-border-divider text-text-primary rounded-3xl rounded-tl-sm",
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>

                            {/* Read Receipt Mock */}
                            <div
                              className={clsx(
                                "flex items-center gap-1.5 mt-2",
                                isMe ? "justify-end" : "justify-start",
                              )}
                            >
                              <span className="text-[9px] font-bold opacity-60">
                                {new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {isMe && (
                                <span className="text-text-on-accent/80 font-bold text-[10px]">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 pb-6 bg-secondary/80 backdrop-blur-xl border-t border-border-divider">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-3 max-w-5xl mx-auto"
              >
                <div className="flex items-center gap-1 mb-1">
                  <button
                    type="button"
                    className="p-2.5 hover:bg-elevated/80 rounded-xl transall text-text-secondary hover:text-accent-default"
                  >
                    <Paperclip className="w-5.5 h-5.5" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Tulis pesan gokil..."
                    className="w-full bg-elevated/50 border border-border-divider rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-accent-default transall text-text-primary pr-12 shadow-inner"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-accent-default transall"
                  >
                    <Smile className="w-5.5 h-5.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="w-14 h-14 bg-accent-default hover:bg-accent-hover text-text-on-accent rounded-2xl flexcc disabled:opacity-30 disabled:grayscale transall shadow-[0_8px_20px_-5px_rgba(107,52,16,0.5)] active:scale-95"
                >
                  <Send className="w-6 h-6 -ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flexcc text-center p-10 bg-primary">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-elevated rounded-full flexcc mb-8 border border-accent-default/20 relative"
            >
              <div className="absolute inset-0 bg-accent-default blur-3xl opacity-10" />
              <MessageCircle className="w-14 h-14 text-accent-default/30" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
              Selamat Datang di GokilChat!
            </h2>
            <p className="text-text-secondary max-w-md text-sm leading-relaxed">
              Pilih ruangan di sebelah kiri buat mulai ngobrol gokil bareng
              temen-temen lu. Nggak ada temen? Ya nasib. 🗿
            </p>
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flexcc p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-secondary border border-border-divider rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-divider flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Invite Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-elevated rounded-xl transall">
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
                    onChange={(e) => handleSearchUsers(e.target.value)}
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
                        onClick={() => handleInviteUser(u.id)}
                        className="p-3 rounded-2xl bg-primary/40 border border-transparent hover:border-accent-default/30 hover:bg-accent-default/5 flex items-center gap-3 cursor-pointer transall group"
                      >
                        <Image src={u.avatar_url || "/images/default-avatar.png"} alt={u.username} width={40} height={40} className="rounded-xl border border-border-divider" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white group-hover:text-accent-default transall">{u.username}</p>
                          <p className="text-[10px] text-text-secondary">{u.email}</p>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(61, 42, 24, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b3410;
        }
      `}</style>
    </div>
  );
}
