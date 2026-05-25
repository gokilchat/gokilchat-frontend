import { Message } from "@/types/chat";
import { Check, CheckCheck } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

interface ReceiptsIconProps {
  message: Message;
  isMe: boolean;
}

export default function ReceiptsIcon({
  message,
  isMe,
}: ReceiptsIconProps) {
  const activeRoom = useChatStore((state) =>
    state.rooms.find((r) => r.id === message.room_id),
  );

  if (!isMe) return null;

  const receipts = message.receipts || [];
  // Gunakan receipts.length sebagai source of truth (karena db bikin row receipt saat pesan dikirim),
  // fallback ke member saat ini kalau misalnya baru banget ngirim dan state belum sync.
  const expectedRecipients =
    receipts.length > 0
      ? receipts.length
      : Math.max(1, (activeRoom?.members_count || 2) - 1);

  // Delivered logic: hitung yg delivered atau read (karena kalo read pasti delivered)
  const deliveredCount = receipts.filter((r) => r.delivered_at || r.read_at).length;
  const readCount = receipts.filter((r) => r.read_at).length;

  let checks = null;

  if (expectedRecipients > 0 && readCount >= expectedRecipients) {
    checks = (
      <CheckCheck className="w-3.5 h-3.5 text-blue-300 ml-1" strokeWidth={3} />
    );
  } else if (expectedRecipients > 0 && deliveredCount >= expectedRecipients) {
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
    <div className="flex items-center" title="Status pesan">
      {checks}
    </div>
  );
}
