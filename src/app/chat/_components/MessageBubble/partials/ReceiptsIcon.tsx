import { Message } from "@/types/chat";
import { Check, CheckCheck } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

interface ReceiptsIconProps {
  message: Message;
  isMe: boolean;
  onShowReceipts: () => void;
}

export default function ReceiptsIcon({
  message,
  isMe,
  onShowReceipts,
}: ReceiptsIconProps) {
  const activeRoom = useChatStore((state) =>
    state.rooms.find((r) => r.id === message.room_id),
  );

  if (!isMe) return null;

  const totalOtherMembers = Math.max(1, (activeRoom?.members_count || 2) - 1);

  const receipts = message.receipts || [];
  const deliveredCount = receipts.filter((r) => r.delivered_at).length;
  const readCount = receipts.filter((r) => r.read_at).length;

  let checks = null;
  if (readCount >= totalOtherMembers) {
    checks = (
      <CheckCheck className="w-3.5 h-3.5 text-blue-300 ml-1" strokeWidth={3} />
    );
  } else if (deliveredCount >= totalOtherMembers) {
    checks = (
      <CheckCheck
        className="w-3.5 h-3.5 text-text-on-accent/60 ml-1"
        strokeWidth={3}
      />
    );
  } else {
    checks = (
      <Check
        className="w-3 h-3 text-text-on-accent/60 ml-1"
        strokeWidth={3}
      />
    );
  }

  return (
    <button
      onClick={onShowReceipts}
      className="flex items-center focus:outline-none hover:opacity-80 transall cursor-pointer"
      title="Lihat info pesan"
    >
      {checks}
    </button>
  );
}
