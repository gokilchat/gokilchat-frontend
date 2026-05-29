"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { User, Room } from "@/types/chat";
import { useToast } from "@/components/Toast";


// Components
import Sidebar from "./_components/Sidebar";
import ChatWindow from "./_components/ChatWindow";

import CreateRoomModal from "./_components/modals/CreateRoomModal";
import InviteMemberModal from "./_components/modals/InviteMemberModal";
import GroupInfoModal from "./_components/modals/GroupInfoModal";
import SettingsModal from "./_components/modals/SettingsModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function ChatPage() {
  const { toast } = useToast();
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
  const [typingData, setTypingData] = useState<Record<string, string>>({});
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [modalContext, setModalContext] = useState<"dm" | "invite">("dm");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState<Record<string, boolean>>(
    {},
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isResizing = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) setSidebarWidth(newWidth);
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

  // Sinkronisasi hardware back button (HP) untuk menutup chat
  useEffect(() => {
    if (!isHydrated) return;
    const handlePopState = (e: PopStateEvent) => {
      if (!e.state?.roomOpen) {
        useChatStore.getState().setActiveRoomId(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHydrated]);

  // Inject state ke browser history saat room terbuka di mobile
  useEffect(() => {
    if (!isHydrated) return;
    if (activeRoomId && window.innerWidth < 768) {
      if (!window.history.state?.roomOpen) {
        window.history.pushState({ roomOpen: true }, "");
      }
    } else if (!activeRoomId && window.innerWidth < 768) {
      if (window.history.state?.roomOpen) {
        window.history.back();
      }
    }
  }, [activeRoomId, isHydrated]);

  useEffect(() => {
    if (isHydrated && !user) router.push("/");
  }, [user, router, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !user || !token) return;

    const socket = initSocket(token);
    socket.connect();

    socket.on("presence:typing", (data: { room_id: string; username: string }) => {
      setTypingData((prev) => ({ ...prev, [data.room_id]: data.username }));
      setTimeout(() => {
        setTypingData((prev) => {
          const next = { ...prev };
          delete next[data.room_id];
          return next;
        });
      }, 3000);
    });

    socket.on("message:new", (message) => {
      // Backend spec v2 wraps content inside `data`
      const formattedMessage = {
        ...message,
        content: message.data?.content || "",
        receipts: message.receipts || []
      };

      addMessage(formattedMessage);
      
      const activeId = useChatStore.getState().activeRoomId;
      const isUnread = message.sender_id !== user.id && (activeId !== message.room_id || document.hidden);

      if (message.sender_id !== user.id) {
        if (!isUnread) {
          socket.emit("message:read:room", { room_id: message.room_id });
        } else {
          socket.emit("message:delivered", { message_id: message.id, room_id: message.room_id });
          
          if (Notification.permission === "granted") {
            const roomName = useChatStore.getState().rooms.find(r => r.id === message.room_id)?.name || "GokilChat";
            const notifTitle = roomName;
            const notifOptions = {
              body: `${message.sender_full_name || message.sender_username}: ${formattedMessage.content}`,
              icon: "/favicon.ico",
            };
            
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(notifTitle, notifOptions);
              }).catch(() => {
                const notif = new Notification(notifTitle, notifOptions);
                notif.onclick = () => window.focus();
              });
            } else {
              const notif = new Notification(notifTitle, notifOptions);
              notif.onclick = () => window.focus();
            }
          }
        }
      }

      // Update last message in rooms list for realtime sidebar
      setRooms((prevRooms: Room[]) => {
        const roomExists = prevRooms.some((r) => r.id === message.room_id);

        if (!roomExists) {
          // Jika room belum ada di sidebar, refresh list room dari API
          apiFetch("/rooms").then((res) => {
            if (res.success) setRooms(res.data);
          });
          return prevRooms;
        }

        return prevRooms.map((r) =>
          r.id === message.room_id
            ? {
                ...r,
                unread_count: isUnread ? (r.unread_count || 0) + 1 : r.unread_count,
                last_message: {
                  content: formattedMessage.content,
                  created_at: message.created_at,
                  sender: { 
                    username: message.sender_username,
                    full_name: message.sender_full_name 
                  },
                  template_type: message.template_type || "text",
                },
              }
            : r,
        );
      });
    });

    socket.on(
      "presence:status",
      (data: { user_id: string; online: boolean }) => {
        console.log(
          `[PRESENCE] User ${data.user_id} is now ${data.online ? "ONLINE" : "OFFLINE"}`,
        );
        setPresenceStatus((prev) => ({ ...prev, [data.user_id]: data.online }));
      },
    );

    socket.on("receipt:update:batch", (data: { room_id: string, receipts: { message_id: string; user_id: string; delivered_at: string | null; read_at: string | null }[] }) => {
      useChatStore.getState().updateReceipts(data.receipts);
    });

    socket.on("room:added", (data: { room_id: string }) => {
      // Refresh list room dari API supaya grup baru muncul di sidebar
      apiFetch("/rooms").then((res) => {
        if (res.success) {
          setRooms(res.data);
          // Langsung join socket room-nya juga
          socket.emit("room:join", { room_id: data.room_id });
        }
      });
    });

    socket.on("room:kicked", (data: { room_id: string }) => {
      toast("Waduh, lu abis di-kick dari salah satu grup! Mampus 🗿", "warning");
      
      // Kalo lagi buka grupnya, tutup
      if (useChatStore.getState().activeRoomId === data.room_id) {
        useChatStore.getState().setActiveRoomId(null);
      }
      
      // Hapus dari sidebar
      setRooms((prevRooms: Room[]) => prevRooms.filter((r) => r.id !== data.room_id));
      
      // Leave socket room biar gak nerima chat lagi
      socket.emit("room:leave", { room_id: data.room_id });
    });

    socket.on("room:member_joined", (data: { room_id: string; user_id: string }) => {
      setRooms((prevRooms: Room[]) =>
        prevRooms.map((r) =>
          r.id === data.room_id
            ? { ...r, members_count: (r.members_count || 1) + 1 }
            : r
        )
      );
    });

    socket.on("room:member_left", (data: { room_id: string; user_id: string }) => {
      setRooms((prevRooms: Room[]) =>
        prevRooms.map((r) =>
          r.id === data.room_id
            ? { ...r, members_count: Math.max(1, (r.members_count || 2) - 1) }
            : r
        )
      );
    });

    socket.on("room:updated", (data: { room_id: string; name: string; description: string; avatar_url?: string }) => {
      setRooms((prevRooms: Room[]) =>
        prevRooms.map((r) =>
          r.id === data.room_id
            ? { ...r, name: data.name, description: data.description, avatar_url: data.avatar_url ?? r.avatar_url }
            : r
        )
      );
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    apiFetch("/rooms")
      .then((res) => {
        if (res.success) {
          setRooms(res.data);
          res.data.forEach((room: Room) => {
            socket.emit("room:join", { room_id: room.id });
            socket.emit("messages:delivered:room", { room_id: room.id });
            // Initial presence check for all DM partners
            if (room.type === "dm" && room.dm_user_id) {
              socket.emit("presence:check", { user_id: room.dm_user_id });
            }
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingRooms(false));

    return () => {
      socket.off("message:new");
      socket.off("presence:status");
      socket.off("room:added");
      socket.off("room:kicked");
      socket.off("room:member_joined");
      socket.off("room:member_left");
      socket.off("receipt:update:batch");
      disconnectSocket();
    };
  }, [isHydrated, user, token, setRooms, addMessage, toast]);

  // Patroli Status On-Demand (Hemat Resource) 🗿
  useEffect(() => {
    if (!isHydrated || !user || !token) return;

    const pollPresence = () => {
      const socket = getSocket();
      if (!socket) return;

      // Cek semua user yang ada di sidebar (rooms)
      rooms.forEach((room) => {
        if (room.type === "dm" && room.dm_user_id) {
          socket.emit("presence:check", { user_id: room.dm_user_id });
        }
      });
    };

    // Jalankan patroli pertama kali, lalu tiap 3 detik biar sat-set 🗿⚡
    pollPresence();
    const interval = setInterval(pollPresence, 3000);

    return () => clearInterval(interval);
  }, [isHydrated, user, token, rooms]);

  const handleRoomClick = async (roomId: string) => {
    if (roomId === activeRoomId) return; // Udah di sini, gausah fetch lagi 🗿

    const room = rooms.find((r) => r.id === roomId);
    setActiveRoomId(roomId);
    
    // Clear unread count when opening a room
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));

    setIsLoadingMessages(true);
    const socket = getSocket();
    socket?.emit("room:join", { room_id: roomId });

    // Check presence if it's a DM
    if (room?.type === "dm" && room.dm_user_id) {
      socket?.emit("presence:check", { user_id: room.dm_user_id });
    }

    if (roomId.startsWith("temp-")) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    try {
      const res = await apiFetch(`/rooms/${roomId}/messages`);
      if (res.success) {
        setMessages(res.data);
        socket?.emit("message:read:room", { room_id: roomId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !activeRoomId) return;

    let currentRoomId = activeRoomId;
    const activeRoom = rooms.find((r) => r.id === activeRoomId);

    try {
      // If it's a ghost room, create it first
      if (activeRoomId.startsWith("temp-")) {
        const targetUserId = activeRoomId.replace("temp-", "");
        const res = await apiFetch("/rooms/dm", {
          method: "POST",
          body: JSON.stringify({
            target_user_id: targetUserId,
          }),
        });

        if (res.success) {
          const newRoom = res.data;
          // Replace temp room with real room in list while PRESERVING ghost room metadata (Google Name & Avatar)
          setRooms((prevRooms) =>
            prevRooms.map((r) =>
              r.id === activeRoomId
                ? {
                    ...newRoom,
                    name: activeRoom?.name || newRoom.name,
                    avatar_url: activeRoom?.avatar_url || newRoom.avatar_url,
                    dm_user_id: targetUserId,
                  }
                : r,
            ),
          );
          setActiveRoomId(newRoom.id);
          currentRoomId = newRoom.id;
          // IMPORTANT: Join the newly created room socket
          getSocket()?.emit("room:join", { room_id: newRoom.id });
        } else {
          throw new Error("Gagal membuat chat room");
        }
      }

      getSocket()?.emit("message:send", {
        room_id: currentRoomId,
        template_id: "00000000-0000-0000-0000-000000000001",
        data: { content: message },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (name: string, selectedUsers: User[]) => {
    try {
      const res = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (res.success) {
        const roomId = res.data.id;
        
        // Langsung invite user yang dipilih
        for (const user of selectedUsers) {
          await apiFetch(`/rooms/${roomId}/invites/${user.id}`, { method: "POST" });
        }

        setRooms([res.data, ...rooms]);
        handleRoomClick(roomId);
        setShowCreateRoomModal(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      toast("Gagal bikin room", "error");
    }
  };

  const handleLeaveGroupConfirmed = async () => {
    setShowLeaveConfirm(false);
    if (!activeRoomId) return;
    try {
      const res = await apiFetch(`/rooms/${activeRoomId}/leave`, {
        method: "POST",
      });
      if (res.success) {
        setRooms((rooms) => rooms.filter((r) => r.id !== activeRoomId));
        setActiveRoomId(null);
        toast("Berhasil keluar dari grup.", "info");
      } else {
        toast(res.error || "Gagal keluar grup", "error");
      }
    } catch {
      toast("Terjadi kesalahan saat keluar grup", "error");
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiFetch(`/users/search?username=${q}`);
      if (res.success) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (targetUserId: string) => {
    if (modalContext === "dm") {
      const targetUser = searchResults.find((u) => u.id === targetUserId);
      if (!targetUser) return;

      // Check if we already have a room with this user
      const existingRoom = rooms.find(
        (r) =>
          r.id === "temp-" + targetUserId ||
          (r.type === "dm" && r.dm_user_id === targetUserId),
      );

      if (existingRoom) {
        handleRoomClick(existingRoom.id);
      } else {
        const ghostRoom: Room = {
          id: "temp-" + targetUserId,
          name: targetUser.full_name || targetUser.username,
          avatar_url: targetUser.avatar_url,
          dm_user_id: targetUserId,
          type: "dm",
        };
        setRooms([ghostRoom, ...rooms]);
        setActiveRoomId(ghostRoom.id);
        getSocket()?.emit("room:join", { room_id: ghostRoom.id });
      }

      setShowInviteModal(false);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    if (!activeRoomId) return;
    try {
      const res = await apiFetch(
        `/rooms/${activeRoomId}/invites/${targetUserId}`,
        {
          method: "POST",
        },
      );
      if (res.success) {
        toast("User berhasil di-invite!", "success");
        window.dispatchEvent(new CustomEvent("gokilchat:member_joined", { detail: { roomId: activeRoomId } }));
        setShowInviteModal(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal invite user";
      toast(msg, "error");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isHydrated || !user) return null;

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const targetUserId = activeRoom?.dm_user_id;
  const isOnline = targetUserId ? !!presenceStatus[targetUserId] : false;

  return (
    <div className="flex h-screen bg-primary font-sans text-text-primary overflow-hidden">
      <Sidebar
        width={sidebarWidth}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onRoomClick={handleRoomClick}
        onSelectDM={() => {
          setModalContext("dm");
          setShowInviteModal(true);
        }}
        onSelectGroup={() => setShowCreateRoomModal(true)}
        user={user}
        onLogout={logout}
        onSettingsClick={() => setShowSettingsModal(true)}
        isLoading={isLoadingRooms}
        presenceStatus={presenceStatus}
      />

      <div
        onMouseDown={() => {
          isResizing.current = true;
          document.body.style.cursor = "col-resize";
        }}
        className="hidden md:block w-px h-full bg-border-divider relative z-30 group cursor-col-resize"
      >
        {/* Area Drag "Hantu" 👻 - Lebar tapi nggak nampak */}
        <div className="atranscenter h-full w-3.5 z-40 transall hover:bg-accent-default/20" />
      </div>

      <ChatWindow
        activeRoom={activeRoom}
        messages={messages}
        user={user}
        isOnline={isOnline}
        onInviteClick={() => {
          setModalContext("invite");
          setShowInviteModal(true);
        }}
        onGroupInfoClick={() => setShowGroupInfoModal(true)}
        onLeaveGroupClick={() => setShowLeaveConfirm(true)}
        onSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
        presenceStatus={presenceStatus}
        isLoading={isLoadingMessages}
        typingUser={activeRoomId ? typingData[activeRoomId] : undefined}
      />



      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onSubmit={handleCreateRoom}
        searchQuery={searchQuery}
        onSearchChange={handleSearchUsers}
        searchResults={searchResults}
        isSearching={isSearching}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchUsers}
        searchResults={searchResults}
        isSearching={isSearching}
        onInvite={handleInviteUser}
        title={modalContext === "dm" ? "Mulai DM Baru" : "Invite ke Grup"}
        activeRoomId={
          modalContext === "invite" && activeRoomId ? activeRoomId : undefined
        }
      />

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {activeRoomId && (
        <GroupInfoModal
          isOpen={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          roomId={activeRoomId}
          onInviteClick={() => {
            setModalContext("invite");
            setShowInviteModal(true);
          }}
        />
      )}
      
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroupConfirmed}
        title="Keluar dari Grup?"
        description="Lu yakin mau keluar dari grup ini? Lu nggak bakal bisa liat chat dan harus di-invite lagi buat masuk."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
