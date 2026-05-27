import { Message } from "@/types/chat";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";
import MessageReceiptModal from "../modals/MessageReceiptModal";

// Partials
import RoomInviteContent from "./partials/RoomInviteContent";
import ReceiptsIcon from "./partials/ReceiptsIcon";
import MessageBubbleMenu from "./partials/MessageBubbleMenu";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isOnline?: boolean;
  onUserClick?: (userId: string) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
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
  isHighlighted
}: MessageBubbleProps) {
  const [showReceipts, setShowReceipts] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          "flex gap-3 group",
          isMe ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isMe && (
          <div
            className="relative shrink-0 h-fit self-start cursor-pointer hover:opacity-80 transall"
            onClick={() => onUserClick?.(message.sender_id)}
          >
            <Image
              src={message.sender_avatar || "/images/default-avatar.png"}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.srcset = "";
                e.currentTarget.src = "/images/default-avatar.png";
              }}
            />
          </div>
        )}
        <div
          className={clsx(
            "flex flex-col max-w-[75%] md:max-w-[65%] min-w-0",
            isMe ? "items-end" : "items-start",
          )}
        >
          <div
            className={clsx(
              "px-5 py-3 shadow-lg shadow-secondary relative pr-10 transall",
              isMe
                ? "bg-accent-hover text-text-on-accent rounded-3xl rounded-tr-sm"
                : "bg-elevated text-text-primary rounded-3xl rounded-tl-sm",
              isHighlighted && "ring-2 ring-accent-default ring-offset-2 ring-offset-primary animate-pulse"
            )}
          >
            {/* Bubble Dropdown Menu */}
            <MessageBubbleMenu isMe={isMe} onInfoClick={() => setShowReceipts(true)} />
            {/* Nama Pengirim ala Telegram 🗿✈️ */}
            {!isMe && (
              <p
                className="text-[0.8rem] font-medium text-text-secondary mb-1.5 tracking-wide cursor-pointer hover:text-accent-default transall w-fit"
                onClick={() => onUserClick?.(message.sender_id)}
              >
                {message.sender_full_name || message.sender_username}
              </p>
            )}

            {message.template_type === "room_invite" && message.invite_info ? (
              <RoomInviteContent message={message} isMe={isMe} />
            ) : (
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap wrap-break-word [word-break:break-word] min-w-0">
                {renderHighlightedText(message.content || "", searchQuery)}
              </p>
            )}

            <div
              className={clsx(
                "flex items-center gap-1.5 mt-2",
                isMe ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[11px] font-bold opacity-60">
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
