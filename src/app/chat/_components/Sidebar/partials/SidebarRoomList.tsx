import { Room } from "@/types/chat";
import Image from "next/image";
import clsx from "clsx";
import SidebarSkeleton from "../../SidebarSkeleton";

interface SidebarRoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomClick: (id: string) => void;
  isLoading?: boolean;
  presenceStatus?: Record<string, boolean>;
}

export default function SidebarRoomList({
  rooms,
  activeRoomId,
  onRoomClick,
  isLoading = false,
  presenceStatus = {},
}: SidebarRoomListProps) {
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onRoomClick(room.id)}
          className={clsx(
            "cursor-pointer w-full p-2.5 rounded-2xl flex items-center gap-3 transall group",
            activeRoomId === room.id
              ? "bg-accent-default text-text-on-accent"
              : "text-text-secondary hover:bg-elevated hover:text-white",
          )}
        >
          <div className="relative shrink-0">
            <div
              className={clsx(
                "size-[3.3rem] rounded-full flexcc font-black text-lg transall shadow-sm overflow-hidden",
                activeRoomId === room.id
                  ? "bg-white/20 text-white"
                  : "bg-secondary text-accent-default",
              )}
            >
              {room.avatar_url ? (
                <Image
                  src={room.avatar_url}
                  alt={room.name || ""}
                  width={55}
                  height={50}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.srcset = "";
                    e.currentTarget.src = "/images/default-avatar.png";
                  }}
                />
              ) : (
                room.name?.charAt(0) || "#"
              )}
            </div>

            {/* Dot Online On-Demand - Premium Cut-out Effect 🗿🟢 */}
            {room.type === "dm" &&
              room.dm_user_id &&
              presenceStatus[room.dm_user_id] && (
                <div className="absolute bottom-[0.05rem] right-[0.05rem] size-[0.8rem] border-[2.5px] border-secondary bg-status-online rounded-full z-30" />
              )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-black text-[0.9rem] truncate tracking-tight">
                {room.name}
              </span>
              <span
                className={clsx(
                  "text-[9px] font-bold opacity-60",
                  activeRoomId === room.id
                    ? "text-white"
                    : "text-text-muted",
                )}
              >
                12:45
              </span>
            </div>
            <p
              className={clsx(
                "text-[11px] truncate leading-tight font-medium",
                activeRoomId === room.id
                  ? "text-white/80"
                  : "text-text-muted",
              )}
            >
              Pesan terakhir gokil di sini...
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
