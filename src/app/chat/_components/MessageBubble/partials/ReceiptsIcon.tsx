import { Message } from "@/types/chat";
import { Check, CheckCheck } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import Tooltip from "@/components/Tooltip";

interface ReceiptsIconProps {
  message: Message;
  isMe: boolean;
}

export default function ReceiptsIcon({
  message,
  isMe,
}: ReceiptsIconProps) {
  const activeRoom = useChatStore((state) =>
    state.rooms.find((r) => r.id === (message.room_id || state.activeRoomId)),
  );

  if (!isMe) return null;

  const receipts = message.receipts || [];
  // Menghitung jumlah penerima yang diharapkan:
  // Untuk room bertipe DM, selalu 1.
  // Untuk group, jumlah anggota dikurangi 1 (pengirim/diri kita sendiri).
  // Fallback jika room info tidak tersedia: gunakan receipts.length atau minimal 1.
  const expectedRecipients = activeRoom
    ? activeRoom.type === "dm"
      ? 1
      : Math.max(1, (activeRoom.members_count || 2) - 1)
    : Math.max(1, receipts.length);

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
    <Tooltip content="Status pesan" placement="top">
      <div className="flex items-center">
        {checks}
      </div>
    </Tooltip>
  );
}
