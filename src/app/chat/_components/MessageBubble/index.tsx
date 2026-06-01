import { Message } from "@/types/chat";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "motion/react";
import { useState, useRef } from "react";
import MessageReceiptModal from "../modals/MessageReceiptModal";
import { Forward } from "lucide-react";

// Partials
import RoomInviteContent from "./partials/RoomInviteContent";
import ReceiptsIcon from "./partials/ReceiptsIcon";
import MessageBubbleMenu, {
  type MessageBubbleMenuHandle,
} from "./partials/MessageBubbleMenu";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isOnline?: boolean;
  onUserClick?: (userId: string) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
  isConsecutive?: boolean;
  onReplyClick?: (message: Message) => void;
  onForwardClick?: (message: Message) => void;
  onDeleteClick?: (message: Message) => void;
  onHideClick?: (message: Message) => void;
  onUnhideClick?: (message: Message) => void;
  onReportClick?: (message: Message) => void;
  canDelete?: boolean;
  parentMessage?: Message;
}

const renderHighlightedText = (text: string, query?: string) => {
  if (!query || !query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-accent-default/40 text-white px-0.5 rounded-xs underline decoration-accent-default decoration-2 underline-offset-2">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function MessageBubble({ 
  message, 
  isMe, 
  onUserClick,
  searchQuery,
  isHighlighted,
  isConsecutive = false,
  onReplyClick,
  onForwardClick,
  onDeleteClick,
  onHideClick,
  onUnhideClick,
  onReportClick,
  canDelete = false,
  parentMessage
}: MessageBubbleProps) {
  const [showReceipts, setShowReceipts] = useState(false);
  const menuRef = useRef<MessageBubbleMenuHandle>(null);

  const isDeleted = !!message.deleted_at;
  const isHidden = !!message.hidden_for_me;

  // Klik kanan di bubble → buka menu aksi di posisi kursor 🗿
  const handleContextMenu = (e: React.MouseEvent) => {
    if (isHidden) return;
    e.preventDefault();
    e.stopPropagation();
    menuRef.current?.openAt(e.clientX, e.clientY);
  };
  const deletedBySelf = message.deleted_by === message.sender_id;
  const deletedText = deletedBySelf 
    ? "Pesan ini telah dihapus"
    : "Pesan ini dihapus oleh admin";

  const handleScrollToParent = () => {
    if (message.parent_id) {
      const el = document.getElementById(`msg-${message.parent_id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-accent-default", "ring-offset-2", "ring-offset-primary");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-accent-default", "ring-offset-2", "ring-offset-primary");
        }, 1500);
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          "flex gap-2 md:gap-3 group",
          isMe ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isMe && (
          <div
            className={clsx(
              "relative shrink-0 h-fit self-start transall",
              !isConsecutive && "cursor-pointer hover:opacity-80"
            )}
            onClick={!isConsecutive ? () => onUserClick?.(message.sender_id) : undefined}
          >
            {!isConsecutive ? (
              <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0">
                <Image
                  src={message.sender_avatar || "/images/default-avatar.png"}
                  alt="avatar"
                  fill
                  className="rounded-full shadow-sm object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.srcset = "";
                    e.currentTarget.src = "/images/default-avatar.png";
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
            )}
          </div>
        )}
        <div
          className={clsx(
            "flex flex-col max-w-[75%] md:max-w-[65%] min-w-0",
            isMe ? "items-end" : "items-start",
          )}
        >
          <div
            onContextMenu={handleContextMenu}
            className={clsx(
              "px-3.5 py-2.5 md:px-5 md:py-3 shadow-lg shadow-secondary relative pr-8 md:pr-10 transall min-w-0 w-fit max-w-full",
              isMe
                ? (isConsecutive 
                    ? "bg-accent-hover text-text-on-accent rounded-3xl"
                    : "bg-accent-hover text-text-on-accent rounded-3xl rounded-tr-sm")
                : (isConsecutive
                    ? "bg-elevated text-text-primary rounded-3xl"
                    : "bg-elevated text-text-primary rounded-3xl rounded-tl-sm"),
              isHighlighted && "ring-2 ring-accent-default ring-offset-2 ring-offset-primary animate-pulse"
            )}
          >
            {/* Bubble Dropdown Menu */}
            {!isHidden && (
              <MessageBubbleMenu
                ref={menuRef}
                isMe={isMe}
                isDeleted={isDeleted}
                onInfoClick={() => setShowReceipts(true)}
                onReplyClick={() => onReplyClick?.(message)}
                onForwardClick={() => onForwardClick?.(message)}
                onDeleteClick={() => onDeleteClick?.(message)}
                onHideClick={() => onHideClick?.(message)}
                onReportClick={() => onReportClick?.(message)}
                canDelete={canDelete}
              />
            )}
            {/* Forwarded label 🗿 */}
            {message.template_type === "forwarded" && !isDeleted && !isHidden && (
              <div className="flex items-center gap-1 opacity-60 mb-1 select-none">
                <Forward className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-bold italic tracking-wide">
                  Diteruskan
                </span>
              </div>
            )}
            {/* Nama Pengirim ala Telegram 🗿✈️ */}
            {!isMe && !isConsecutive && (
              <p
                className="text-[11px] md:text-xs font-semibold text-text-secondary mb-1 tracking-wide cursor-pointer hover:text-accent-default transall w-fit"
                onClick={() => onUserClick?.(message.sender_id)}
              >
                {message.sender_full_name || message.sender_username}
              </p>
            )}

            {/* Reply Preview inside bubble */}
            {message.parent_id && !isHidden && (
              <div
                onClick={handleScrollToParent}
                className={clsx(
                  "cursor-pointer border-l-2 pl-2 py-0.5 mb-2 rounded-r-md text-[11px] select-none text-left bg-black/10 hover:bg-black/15 transall w-full max-w-full overflow-hidden min-w-0",
                  isMe ? "border-text-on-accent/60" : "border-accent-default"
                )}
              >
                <span className={clsx("font-bold block truncate", isMe ? "text-text-on-accent" : "text-accent-default")}>
                  {parentMessage 
                    ? (parentMessage.sender_full_name || parentMessage.sender_username)
                    : "Pesan Asal"}
                </span>
                <span className={clsx("block truncate opacity-80 mt-0.5", isMe ? "text-text-on-accent/80" : "text-text-secondary")}>
                  {parentMessage ? parentMessage.content : message.reply_preview || "Pesan tidak ditemukan"}
                </span>
              </div>
            )}

            {isDeleted ? (
              <p className="text-[13px] md:text-sm font-medium italic opacity-60 leading-relaxed whitespace-pre-wrap wrap-break-word [word-break:break-word] min-w-0">
                {deletedText}
              </p>
            ) : isHidden ? (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] md:text-sm font-medium italic opacity-60 leading-relaxed">
                  Kamu menghapus pesan ini untuk dirimu
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnhideClick?.(message);
                  }}
                  className={clsx(
                    "text-[11px] md:text-xs font-bold underline underline-offset-2 transall cursor-pointer shrink-0",
                    isMe ? "text-text-on-accent/90 hover:text-text-on-accent" : "text-accent-default hover:opacity-80",
                  )}
                >
                  Tampilkan
                </button>
              </div>
            ) : message.template_type === "room_invite" && message.invite_info ? (
              <RoomInviteContent message={message} isMe={isMe} />
            ) : (
              <p className="text-[13px] md:text-sm font-medium leading-relaxed whitespace-pre-wrap wrap-break-word [word-break:break-word] min-w-0">
                {renderHighlightedText(message.content || "", searchQuery)}
              </p>
            )}

            <div
              className={clsx(
                "flex items-center gap-1 mt-1.5 md:mt-2",
                isMe ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[9px] md:text-[10px] font-bold opacity-60">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <ReceiptsIcon
                message={message}
                isMe={isMe}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {showReceipts && (
        <MessageReceiptModal
          isOpen={showReceipts}
          onClose={() => setShowReceipts(false)}
          message={message}
        />
      )}
    </>
  );
}
