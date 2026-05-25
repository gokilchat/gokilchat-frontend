import { MessageCircle } from "lucide-react";
import { Message, User } from "@/types/chat";
import MessageBubble from "../../MessageBubble";
import { RefObject } from "react";

interface ChatMessagesProps {
  messages: Message[];
  user: User;
  presenceStatus: Record<string, boolean>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
  messages,
  user,
  presenceStatus,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 md:px-12 lg:px-24 pb-16 space-y-8 custom-scrollbar bg-[url('/images/chat-bg.png')] bg-fixed opacity-95">
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
  );
}
