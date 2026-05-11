import { MessageCircle, Search, Info, MoreVertical, Paperclip, Smile, Send, UserPlus } from "lucide-react";
import { User, Room, Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import clsx from "clsx";

interface ChatWindowProps {
  activeRoom: Room | null;
  messages: Message[];
  user: User;
  onInviteClick: () => void;
  messageInput: string;
  onMessageInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ChatWindow({
  activeRoom,
  messages,
  user,
  onInviteClick,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  messagesEndRef,
  inputRef,
}: ChatWindowProps) {
  if (!activeRoom) {
    return (
      <main className="flex-1 flexcc bg-primary relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('/images/chat-bg.png')] bg-fixed opacity-5" />
        <div className="relative text-center p-12">
          <div className="w-32 h-32 bg-accent-default/10 rounded-[2.5rem] flexcc mx-auto mb-8 border border-accent-default/20 rotate-6 group-hover:rotate-12 transall shadow-2xl">
            <MessageCircle className="w-16 h-16 text-accent-default" />
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

  return (
    <main className="flex-1 flex flex-col relative bg-primary overflow-hidden">
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
            onClick={onInviteClick}
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
              Jadilah yang pertama ngirim pesan dan bikin suasana jadi pecah! 🗿
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
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-primary">
        <form
          onSubmit={onSendMessage}
          className="relative bg-secondary border border-border-divider rounded-[2rem] p-2 pr-4 flex items-end gap-2 shadow-2xl focus-within:border-accent-default/50 transall"
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
            ref={inputRef as any}
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
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/50 py-3 resize-none max-h-40 custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={clsx(
              "w-11 h-11 rounded-full flexcc transall mb-0.5 shadow-lg",
              messageInput.trim()
                ? "bg-accent-default text-text-on-accent scale-100 rotate-0 hover:bg-accent-hover"
                : "bg-elevated text-text-muted scale-90 -rotate-12 opacity-50"
            )}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </main>
  );
}
