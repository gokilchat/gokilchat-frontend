"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { User, Room } from "@/types/chat";

// Components
import Sidebar from "./_components/Sidebar";
import ChatWindow from "./_components/ChatWindow";
import NewChatModal from "./_components/modals/NewChatModal";
import CreateRoomModal from "./_components/modals/CreateRoomModal";
import InviteMemberModal from "./_components/modals/InviteMemberModal";

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
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalContext, setModalContext] = useState<'dm' | 'invite'>('dm');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

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

  useEffect(() => {
    if (isHydrated && !user) router.push("/");
  }, [user, router, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !user || !token) return;

    const socket = initSocket(token);
    socket.connect();

    socket.on("new_message", (message) => addMessage(message));

    apiFetch("/rooms")
      .then((res) => {
        if (res.success) {
          setRooms(res.data);
          // Auto-join all rooms for real-time notifications
          res.data.forEach((room: Room) => {
            socket.emit("join_room", room.id);
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingRooms(false));

    return () => {
      socket.off("new_message");
      disconnectSocket();
    };
  }, [isHydrated, user, token, setRooms, addMessage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleRoomClick = async (roomId: string) => {
    setActiveRoomId(roomId);
    getSocket()?.emit("join_room", roomId);
    try {
      const res = await apiFetch(`/rooms/${roomId}/messages`);
      if (res.success) setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoomId) return;

    let currentRoomId = activeRoomId;
    const activeRoom = rooms.find(r => r.id === activeRoomId);

    try {
      // If it's a ghost room, create it first
      if (activeRoomId.startsWith('temp-')) {
        const targetUserId = activeRoomId.replace('temp-', '');
        const res = await apiFetch("/rooms/dm", {
          method: "POST",
          body: JSON.stringify({ 
            target_user_id: targetUserId
          }),
        });
        
        if (res.success) {
          const newRoom = res.data;
          // Replace temp room with real room in list
          setRooms(rooms.map(r => r.id === activeRoomId ? { ...newRoom, name: activeRoom?.name } : r));
          setActiveRoomId(newRoom.id);
          currentRoomId = newRoom.id;
          // IMPORTANT: Join the newly created room socket
          getSocket()?.emit("join_room", newRoom.id);
        } else {
          throw new Error("Gagal membuat chat room");
        }
      }

      getSocket()?.emit("send_message", { 
        room_id: currentRoomId, 
        content: messageInput 
      });
      setMessageInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const res = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (res.success) {
        setRooms([res.data, ...rooms]);
        handleRoomClick(res.data.id);
        setShowCreateRoomModal(false);
      }
    } catch {
      alert("Gagal bikin room");
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
    if (modalContext === 'dm') {
      const targetUser = searchResults.find(u => u.id === targetUserId);
      if (!targetUser) return;

      // Check if we already have a room with this user
      const existingRoom = rooms.find(r => 
        r.id === 'temp-' + targetUserId || 
        (r.type === 'dm' && r.dm_user_id === targetUserId)
      );

      if (existingRoom) {
        handleRoomClick(existingRoom.id);
      } else {
        const ghostRoom: Room = {
          id: 'temp-' + targetUserId,
          name: targetUser.full_name || targetUser.username,
          avatar_url: targetUser.avatar_url,
          dm_user_id: targetUserId,
          type: 'dm',
        };
        setRooms([ghostRoom, ...rooms]);
        setActiveRoomId(ghostRoom.id);
        getSocket()?.emit("join_room", ghostRoom.id);
      }
      
      setShowInviteModal(false);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

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

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  return (
    <div className="flex h-screen bg-primary font-sans text-text-primary overflow-hidden">
      <Sidebar 
        width={sidebarWidth}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onRoomClick={handleRoomClick}
        onCreateRoom={() => setShowNewChatModal(true)}
        user={user}
        onLogout={logout}
        isLoading={isLoadingRooms}
      />

      <div
        onMouseDown={() => {
          isResizing.current = true;
          document.body.style.cursor = "col-resize";
        }}
        className="w-1.5 h-full hover:bg-accent-default/30 cursor-col-resize transall z-30 relative group"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border-divider group-hover:bg-accent-default/50 transall" />
      </div>

      <ChatWindow 
        activeRoom={activeRoom}
        messages={messages}
        user={user}
        onInviteClick={() => {
          setModalContext('invite');
          setShowInviteModal(true);
        }}
        messageInput={messageInput}
        onMessageInputChange={setMessageInput}
        onSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
      />

      <NewChatModal 
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectDM={() => {
          setModalContext('dm');
          setShowNewChatModal(false);
          setShowInviteModal(true);
        }}
        onSelectGroup={() => {
          setShowNewChatModal(false);
          setShowCreateRoomModal(true);
        }}
      />

      <CreateRoomModal 
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onSubmit={handleCreateRoom}
      />

      <InviteMemberModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchUsers}
        searchResults={searchResults}
        isSearching={isSearching}
        onInvite={handleInviteUser}
        title={modalContext === 'dm' ? "Mulai DM Baru" : "Invite ke Grup"}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(61, 42, 24, 0.5); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b3410; }
      `}</style>
    </div>
  );
}
