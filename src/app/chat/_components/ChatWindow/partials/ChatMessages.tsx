import { MessageCircle, ArrowDown } from "lucide-react";
import { Message, User } from "@/types/chat";
import MessageBubble from "../../MessageBubble";
import { RefObject, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessagesProps {
  messages: Message[];
  user: User;
  presenceStatus: Record<string, boolean>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onUserClick?: (userId: string) => void;
  searchQuery?: string;
  searchedMessageId?: string;
  onClearHighlight?: () => void;
  onReplyClick?: (message: Message) => void;
  onForwardClick?: (message: Message) => void;
  onDeleteClick?: (message: Message) => void;
  onHideClick?: (message: Message) => void;
  onUnhideClick?: (message: Message) => void;
  onReportClick?: (message: Message) => void;
  canDelete?: boolean;
}

export default function ChatMessages({
  messages,
  user,
  presenceStatus,
  messagesEndRef,
  onUserClick,
  searchQuery = "",
  searchedMessageId = "",
  onClearHighlight,
  onReplyClick,
  onForwardClick,
  onDeleteClick,
  onHideClick,
  onUnhideClick,
  onReportClick,
  canDelete = false,
}: ChatMessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
      setShowScrollBtn(isScrolledUp);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll to selected message from search
  useEffect(() => {
    if (searchedMessageId && scrollContainerRef.current) {
      const el = document.getElementById(`msg-${searchedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Optional: you could trigger a brief animation on the element here
      }
    }
  }, [searchedMessageId]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col px-2.5 sm:px-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={() => {
          if ((searchedMessageId || searchQuery) && onClearHighlight) {
            onClearHighlight();
          }
        }}
        className="flex-1 overflow-y-auto px-3 py-4 md:px-12 lg:px-24 pb-16 space-y-6 md:space-y-8 custom-scrollbar bg-[url('/images/chat-bg.png')] bg-fixed opacity-95"
      >
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
          <div className="flex flex-col">
            <div className="flexcc py-4">
              <div className="px-4 py-1.5 bg-secondary border border-border-divider rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted shadow-sm">
                Hari Ini
              </div>
            </div>

            {messages.map((msg, idx) => {
              const isConsecutive =
                idx > 0 && messages[idx - 1].sender_id === msg.sender_id;

              const parentMsg = msg.parent_id
                ? messages.find((m) => m.id === msg.parent_id)
                : undefined;

              return (
                <div
                  key={msg.id || idx}
                  id={`msg-${msg.id}`}
                  className={isConsecutive ? "mt-1 md:mt-1.5" : "mt-6"}
                >
                  <MessageBubble
                    message={msg}
                    isMe={msg.sender_id === user.id}
                    isOnline={!!presenceStatus[msg.sender_id]}
                    onUserClick={onUserClick}
                    searchQuery={searchQuery}
                    isHighlighted={msg.id === searchedMessageId}
                    isConsecutive={isConsecutive}
                    onReplyClick={onReplyClick}
                    onForwardClick={onForwardClick}
                    onDeleteClick={onDeleteClick}
                    onHideClick={onHideClick}
                    onUnhideClick={onUnhideClick}
                    onReportClick={onReportClick}
                    canDelete={canDelete}
                    parentMessage={parentMsg}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Efek Fade "Tenggelam" 🗿✨ */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-primary pointer-events-none z-10" />

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 md:right-12 lg:right-24 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-elevated/80 border border-border-divider/50 backdrop-blur-md text-text-secondary hover:text-white shadow-xl hover:bg-secondary cursor-pointer transition-colors duration-150"
            style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
