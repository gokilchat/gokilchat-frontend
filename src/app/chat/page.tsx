"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { initSocket, getSocket, disconnectSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { LogOut, Settings, MessageCircle, Send, Hash, Plus } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

export default function ChatPage() {
  const { user, token, logout } = useAuthStore();
  const { rooms, activeRoomId, messages, setRooms, setActiveRoomId, setMessages, addMessage } = useChatStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle hydration to prevent mismatch and ensure store is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/");
    }
  }, [user, router, isHydrated]);

  // Init socket and fetch rooms
  useEffect(() => {
    if (!isHydrated || !user || !token) return;

    const socket = initSocket(token);
    socket.connect();

    socket.on('new_message', (message) => {
      addMessage(message);
    });

    // Fetch rooms
    apiFetch('/rooms').then(res => {
      if (res.success) setRooms(res.data);
    }).catch(console.error);

    return () => {
      socket.off('new_message');
      disconnectSocket();
    };
  }, [isHydrated, user, token, setRooms, addMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Room Change
  const handleRoomClick = async (roomId: string) => {
    if (activeRoomId === roomId) return;
    setActiveRoomId(roomId);

    const socket = getSocket();
    if (socket) {
      socket.emit('join_room', roomId);
    }

    // Fetch messages
    try {
      const res = await apiFetch(`/rooms/${roomId}/messages`);
      if (res.success) setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoomId) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { room_id: activeRoomId, content: messageInput });
      setMessageInput("");
    }
  };

  const handleCreateRoom = async () => {
    const name = prompt("Masukkan nama room baru:");
    if (!name) return;
    try {
      const res = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      if (res.success) {
        setRooms([res.data, ...rooms]);
        handleRoomClick(res.data.id);
      }
    } catch (error) {
      alert("Gagal bikin room");
    }
  };

  if (!isHydrated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className={clsx("flex h-screen overflow-hidden", "bg-primary text-text-primary")}>
      {/* Sidebar */}
      <aside className={clsx(
        "w-80 flex flex-col h-full border-r",
        "bg-secondary border-border-divider",
        "max-md:hidden"
      )}>
        <div className="p-6 border-b border-border-divider flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="text-accent-default" />
            GokilChat
          </h2>
          <Settings className="w-5 h-5 text-text-secondary cursor-pointer hover:text-text-primary transall" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Rooms</p>
            <button onClick={handleCreateRoom} className="text-text-muted hover:text-accent-default transall">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => handleRoomClick(room.id)}
              className={clsx(
                "p-3 rounded-xl text-sm transall cursor-pointer flex items-center gap-2",
                activeRoomId === room.id 
                  ? "bg-elevated border border-accent-default/30 text-text-primary" 
                  : "hover:bg-elevated/50 text-text-secondary"
              )}
            >
              <Hash className="w-4 h-4" />
              {room.name || "Private Chat"}
            </div>
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-text-secondary italic px-2">Belum ada room.</p>
          )}
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-border-divider bg-elevated/30">
          <div className="flex items-center gap-3">
            {user.avatar_url && (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={40}
                height={40}
                className="rounded-full border border-accent-default/30"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-text-secondary truncate">
                {user.email}
              </p>
            </div>
            <LogOut
              className="w-5 h-5 text-text-secondary cursor-pointer hover:text-red-400 transall"
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-primary">
        {activeRoom ? (
          <>
            <header className="h-16 border-b border-border-divider flex items-center px-6 bg-secondary/50 backdrop-blur-md z-10 sticky top-0">
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="w-5 h-5 text-accent-default" />
                {activeRoom.name || "Private Chat"}
              </h3>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id || idx} className={clsx("flex gap-4 max-w-2xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                    {msg.sender_avatar && !isMe && (
                      <Image 
                        src={msg.sender_avatar} 
                        alt="avatar" 
                        width={36} 
                        height={36} 
                        className="w-9 h-9 rounded-full mt-1 border border-border-divider" 
                      />
                    )}
                    <div className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {!isMe && <span className="text-xs text-text-secondary mb-1 ml-1">{msg.sender_username}</span>}
                      <div className={clsx(
                        "p-3 rounded-2xl text-sm shadow-sm",
                        isMe ? "bg-accent-default text-text-on-accent rounded-tr-none" : "bg-elevated border border-border-divider text-text-primary rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-secondary border-t border-border-divider">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ketik pesan gokil lu di sini..."
                  className="flex-1 bg-elevated border border-border-divider rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-default transall text-text-primary"
                />
                <button 
                  type="submit" 
                  disabled={!messageInput.trim()}
                  className="w-12 h-12 bg-accent-default hover:bg-accent-hover text-text-on-accent rounded-xl flexcc disabled:opacity-50 disabled:cursor-not-allowed transall"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flexcc text-center p-10">
            <div className="w-20 h-20 bg-elevated rounded-full flexcc mb-4 border border-accent-default/20">
              <MessageCircle className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Selamat Datang di GokilChat!</h2>
            <p className="text-text-secondary max-w-md">
              Pilih ruangan di sebelah kiri untuk mulai ngobrol gokil sama temen-temen lu.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
