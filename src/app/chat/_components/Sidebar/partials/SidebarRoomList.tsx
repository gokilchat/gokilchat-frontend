import { Room } from "@/types/chat";
import Image from "next/image";
import clsx from "clsx";
import SidebarSkeleton from "../../SidebarSkeleton";
import GroupIcon from "@/components/GroupIcon";

const formatTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface SidebarRoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomClick: (id: string) => void;
  isLoading?: boolean;
  presenceStatus?: Record<string, boolean>;
  user: import("@/types/chat").User;
}

export default function SidebarRoomList({
  rooms,
  activeRoomId,
  onRoomClick,
  isLoading = false,
  presenceStatus = {},
  user,
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
              ) : room.type === "dm" ? (
                room.name?.charAt(0) || "#"
              ) : (
                <GroupIcon className="text-accent-default" />
              )}
            </div>

            {/* Dot Online On-Demand - Premium Cut-out Effect 🗿🟢 */}
            {room.type === "dm" &&
              room.dm_user_id &&
              presenceStatus[room.dm_user_id] && (
                <div className="absolute bottom-[0.05rem] right-[0.05rem] size-[0.8rem] border-[2.5px] border-secondary bg-status-online rounded-full z-25" />
              )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-black text-[0.9rem] truncate tracking-tight flex items-center gap-1">
                {room.name}
                {room.type === "dm" && room.dm_user_status === "banned" && (
                  <span className="bg-red-500/20 text-red-500 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">Banned</span>
                )}
                {room.type === "dm" && room.dm_user_status === "suspended" && (
                  <span className="bg-orange-500/20 text-orange-500 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">Suspended</span>
                )}
              </span>
              <span
                className={clsx(
                  "text-[10px] font-bold opacity-60",
                  activeRoomId === room.id ? "text-white" : "text-text-muted",
                )}
              >
                {formatTime(room.last_message?.created_at)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <p
                className={clsx(
                  "text-[11px] truncate leading-tight font-medium flex-1",
                  activeRoomId === room.id
                    ? "text-white/80"
                    : "text-text-muted",
                )}
              >
                {room.last_message ? (
                  room.last_message.template_type === "room_invite" ? (
                    <span className="italic">
                      <span className="font-bold opacity-80">
                        {room.last_message.sender?.username === user.username
                          ? "Anda"
                          : room.last_message.sender?.full_name ||
                            room.last_message.sender?.username}
                        :
                      </span>{" "}
                      ✉️ Undangan Grup
                    </span>
                  ) : (
                    <>
                      <span className="font-bold opacity-80">
                        {room.last_message.sender?.username === user.username
                          ? "Anda"
                          : room.last_message.sender?.full_name ||
                            room.last_message.sender?.username}
                        :
                      </span>{" "}
                      {room.last_message.content}
                    </>
                  )
                ) : (
                  <span className="italic">Belum ada obrolan...</span>
                )}
              </p>
              {!!room.unread_count &&
                room.unread_count > 0 &&
                activeRoomId !== room.id && (
                  <div className="bg-status-unread text-text-on-accent text-[10px] font-black h-4 min-w-4 px-1 rounded-full flexcc shrink-0">
                    {room.unread_count > 99 ? "99+" : room.unread_count}
                  </div>
                )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
