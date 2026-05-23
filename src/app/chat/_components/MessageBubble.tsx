import { Message } from "@/types/chat";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "motion/react";
import { Users, Check, X } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isOnline?: boolean;
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const { setActiveRoomId } = useChatStore();
  const [inviteStatus, setInviteStatus] = useState(message.invite_info?.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInviteAction = async (action: 'accept' | 'reject') => {
    if (!message.invite_info) return;
    setIsProcessing(true);
    try {
      const res = await apiFetch(`/rooms/${message.invite_info.target_room_id}/invites/${message.id}/${action}`, {
        method: 'PATCH'
      });
      if (res.success) {
        setInviteStatus((action + 'ed') as 'accepted' | 'rejected');
        if (action === 'accept') {
          // Fetch ulang list room biar grup yang baru di-acc langsung muncul di sidebar
          const roomsRes = await apiFetch("/rooms");
          if (roomsRes.success) {
            useChatStore.getState().setRooms(roomsRes.data);
          }
          
          // Gabung ke socket room grup baru
          const socket = getSocket();
          if (socket) {
            socket.emit("room:join", { room_id: message.invite_info.target_room_id });
          }
          
          // Arahin ke room yang baru dijoin
          setActiveRoomId(message.invite_info.target_room_id);
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Gagal ${action} undangan`);
    } finally {
      setIsProcessing(false);
    }
  };

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

          {message.template_type === "room_invite" && message.invite_info ? (
            <div className="min-w-[200px] mt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flexcc overflow-hidden">
                  {message.invite_info.target_room_avatar ? (
                    <Image src={message.invite_info.target_room_avatar} alt="grup" width={40} height={40} className="object-cover" />
                  ) : (
                    <Users className="w-5 h-5 opacity-70" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary mb-0.5">Undangan Grup</p>
                  <p className="text-sm font-black truncate max-w-[140px]">{message.invite_info.target_room_name}</p>
                </div>
              </div>

              {!isMe && inviteStatus === "pending" ? (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => handleInviteAction("accept")}
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-accent-default hover:bg-accent-hover text-white rounded-xl text-xs font-bold flexcc gap-1 transall disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Terima
                  </button>
                  <button 
                    onClick={() => handleInviteAction("reject")}
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-primary/20 hover:bg-primary/40 text-text-primary rounded-xl text-xs font-bold flexcc gap-1 transall disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Tolak
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-center py-2 bg-primary/10 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                    {inviteStatus === "accepted" ? "Telah Diterima" : inviteStatus === "rejected" ? "Ditolak" : "Menunggu"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}

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
