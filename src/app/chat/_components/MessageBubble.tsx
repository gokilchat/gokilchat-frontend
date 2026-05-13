import { Message } from "@/types/chat";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "motion/react";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isOnline?: boolean;
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex gap-3 group",
        isMe ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isMe && (
        <div className="relative shrink-0 h-fit self-start">
          <Image
            src={message.sender_avatar || "/images/default-avatar.png"}
            alt="avatar"
            width={40}
            height={40}
            className="rounded-full shadow-sm"
          />
        </div>
      )}
      <div
        className={clsx(
          "flex flex-col max-w-[70%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        <div
          className={clsx(
            "px-5 py-3 shadow-lg shadow-secondary relative",
            isMe
              ? "bg-accent-hover text-text-on-accent rounded-3xl rounded-tr-sm"
              : "bg-elevated text-text-primary rounded-3xl rounded-tl-sm",
          )}
        >
          {/* Nama Pengirim ala Telegram 🗿✈️ */}
          {!isMe && (
            <p className="text-[0.8rem] font-medium text-text-secondary mb-1.5 tracking-wide">
              {message.sender_full_name || message.sender_username}
            </p>
          )}

          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          <div
            className={clsx(
              "flex items-center gap-1.5 mt-2",
              isMe ? "justify-end" : "justify-start",
            )}
          >
            <span className="text-[9px] font-bold opacity-60">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
}
