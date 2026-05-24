import {
  MessageCircle,
  Search,
  Info,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  UserPlus,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { User, Room, Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import ChatSkeleton from "./ChatSkeleton";
import clsx from "clsx";

interface ChatWindowProps {
  activeRoom: Room | null;
  messages: Message[];
  user: User;
  isOnline: boolean;
  onInviteClick: () => void;
  onGroupInfoClick: () => void;
  onLeaveGroupClick?: () => void;
  messageInput: string;
  onMessageInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  presenceStatus?: Record<string, boolean>;
  isLoading?: boolean;
}

export default function ChatWindow({
  activeRoom,
  messages,
  user,
  isOnline,
  onInviteClick,
  onGroupInfoClick,
  onLeaveGroupClick,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  messagesEndRef,
  inputRef,
  presenceStatus = {},
  isLoading = false,
}: ChatWindowProps) {
  if (!activeRoom) {
    return (
      <main className="flex-1 flexcc bg-primary relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('/images/chat-bg.png')] bg-fixed opacity-5" />
        <div className="relative text-center p-12">
          <div className="size-52 flexcc mx-auto mb-4 relative">
            <div>
              <Image
                src="/images/logo-light.png"
                alt="logo"
                fill
                className="object-cover"
              />
            </div>
            {/* <MessageCircle className="w-16 h-16 text-accent-default" /> */}
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">
            Selamat Datang di GokilChat!
          </h2>
          <p className="text-text-secondary text-base max-w-sm mx-auto leading-relaxed font-medium">
            Pilih ruangan di sebelah kiri buat mulai ngobrol gokil bareng
            temen-temen lu. Nggak ada temen? Ya nasib. 🗿
          </p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <main className="flex-1 flex flex-col relative bg-primary overflow-hidden">
      {/* Chat Header */}
      <header className="h-20 flex items-center justify-between px-6 bg-primary/80 backdrop-blur-xl border-b border-border-divider/50 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          {/* Avatar Header Gokil 🗿 */}
          <div className="relative shrink-0">
            <div className="size-11 rounded-full bg-elevated flexcc border border-border-divider/50 overflow-hidden shadow-inner">
              {activeRoom.avatar_url ? (
                <Image
                  src={activeRoom.avatar_url}
                  alt={activeRoom.name || ""}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.srcset = "";
                    e.currentTarget.src = "/images/default-avatar.png";
                  }}
                />
              ) : (
                <span className="font-black text-accent-default text-lg">
                  {activeRoom.name?.charAt(0) || "#"}
                </span>
              )}
            </div>

            {/* Dot Online On-Demand di Header 🗿🟢 */}
            {activeRoom.type === "dm" && isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-status-online rounded-full border-[2.5px] border-primary shadow-sm" />
            )}
          </div>

          <div>
            <h3 className="font-black text-white text-base tracking-tight leading-none mb-1.5">
              {activeRoom.name || "Private Chat"}
            </h3>
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest",
                  activeRoom.type === "dm"
                    ? isOnline
                      ? "text-status-online"
                      : "text-text-muted"
                    : "text-accent-default",
                )}
              >
                {activeRoom.type === "dm"
                  ? isOnline
                    ? "Online"
                    : "Offline"
                  : "Group Chat"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeRoom.type !== "dm" && (
            <>
              <button
                onClick={onInviteClick}
                className="p-2 text-text-secondary hover:text-white transall"
                title="Tambah Anggota"
              >
                <UserPlus className="w-5 h-5" />
              </button>
              <button
                onClick={onGroupInfoClick}
                className="p-2 text-text-secondary hover:text-white transall"
                title="Info Grup"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={onLeaveGroupClick}
                className="p-2 text-text-secondary hover:text-red-500 transall"
                title="Keluar Grup"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
          <button className="p-2 text-text-secondary hover:text-white transall">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-text-secondary hover:text-white transall">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 pb-16 space-y-8 custom-scrollbar bg-[url('/images/chat-bg.png')] bg-fixed opacity-95">
          {messages.length === 0 ? (
            <div className="h-full flexcc text-center p-10">
              <div className="w-24 h-24 bg-accent-default/5 rounded-full flexcc mb-6 border border-accent-default/10 animate-pulse">
                <MessageCircle className="w-10 h-10 text-accent-default/40" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Belum ada gokil-gokilan di sini.
              </h3>
              <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
                Jadilah yang pertama ngirim pesan dan bikin suasana jadi pecah!
                🗿
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flexcc py-4">
                <div className="px-4 py-1.5 bg-secondary border border-border-divider rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted shadow-sm">
                  Hari Ini
                </div>
              </div>

              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || idx}
                  message={msg}
                  isMe={msg.sender_id === user.id}
                  isOnline={!!presenceStatus[msg.sender_id]}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Efek Fade "Tenggelam" 🗿✨ */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-primary from-20% to-transparent pointer-events-none z-10" />
      </div>

      {/* Input Area */}
      <div className="p-6 pb-8 pt-0 bg-primary">
        <form
          onSubmit={onSendMessage}
          className="relative bg-secondary border border-border-divider rounded-4xl p-2 pr-4 flex items-end gap-2 focus-within:border-accent-default/50 transall"
        >
          <div className="flex items-center gap-1 pl-2 mb-1.5">
            <button
              type="button"
              className="p-2 text-text-muted hover:text-accent-default transall"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-text-muted hover:text-accent-default transall"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSendMessage(e);
              }
            }}
            placeholder="Tulis pesan gokil lu di sini..."
            rows={1}
            className="flex-1 bg-secondary border-none outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/50 py-3 resize-none max-h-40 custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={clsx(
              "w-11 h-11 rounded-full flexcc transall mb-0.5 shadow-lg",
              messageInput.trim()
                ? "bg-accent-default text-text-on-accent scale-100 rotate-0 hover:bg-accent-hover"
                : "bg-elevated text-text-muted scale-90 -rotate-12 opacity-50",
            )}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </main>
  );
}
