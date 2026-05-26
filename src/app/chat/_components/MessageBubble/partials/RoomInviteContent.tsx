import { Message } from "@/types/chat";
import Image from "next/image";
import { Users, Check, X } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useToast } from "@/components/Toast";

interface RoomInviteContentProps {
  message: Message;
  isMe: boolean;
}

export default function RoomInviteContent({
  message,
  isMe,
}: RoomInviteContentProps) {
  const { setActiveRoomId } = useChatStore();
  const { toast } = useToast();
  const [inviteStatus, setInviteStatus] = useState(message.invite_info?.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInviteAction = async (action: "accept" | "reject") => {
    if (!message.invite_info) return;
    setIsProcessing(true);
    try {
      const res = await apiFetch(
        `/rooms/${message.invite_info.target_room_id}/invites/${message.id}/${action}`,
        {
          method: "PATCH",
        },
      );
      if (res.success) {
        setInviteStatus((action + "ed") as "accepted" | "rejected");
        if (action === "accept") {
          // Fetch ulang list room biar grup yang baru di-acc langsung muncul di sidebar
          const roomsRes = await apiFetch("/rooms");
          if (roomsRes.success) {
            useChatStore.getState().setRooms(roomsRes.data);
          }

          // Gabung ke socket room grup baru
          const socket = getSocket();
          if (socket) {
            socket.emit("room:join", {
              room_id: message.invite_info.target_room_id,
            });
          }

          // Arahin ke room yang baru dijoin
          setActiveRoomId(message.invite_info.target_room_id);
        }
      }
    } catch (err) {
      console.error(err);
      toast(`Gagal ${action} undangan`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!message.invite_info) return null;

  return (
    <div className="min-w-50 mt-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flexcc overflow-hidden">
          {message.invite_info.target_room_avatar ? (
            <Image
              src={message.invite_info.target_room_avatar}
              alt="grup"
              width={40}
              height={40}
              className="object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.srcset = "";
                e.currentTarget.src = "/images/default-avatar.png";
              }}
            />
          ) : (
            <Users className="w-5 h-5 opacity-70" />
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-text-secondary mb-0.5">
            Undangan Grup
          </p>
          <p className="text-sm font-black truncate max-w-35">
            {message.invite_info.target_room_name}
          </p>
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
            {inviteStatus === "accepted"
              ? "Telah Diterima"
              : inviteStatus === "rejected"
                ? "Ditolak"
                : "Menunggu"}
          </p>
        </div>
      )}
    </div>
  );
}
