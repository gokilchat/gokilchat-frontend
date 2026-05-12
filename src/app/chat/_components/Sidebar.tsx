import { Search, Edit, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { User, Room } from "@/types/chat";
import SidebarSkeleton from "./SidebarSkeleton";

interface SidebarProps {
  width: number;
  rooms: Room[];
  activeRoomId: string | null;
  onRoomClick: (id: string) => void;
  onCreateRoom: () => void;
  user: User;
  onLogout: () => void;
  isLoading?: boolean;
  presenceStatus?: Record<string, boolean>;
}

export default function Sidebar({
  width,
  rooms,
  activeRoomId,
  onRoomClick,
  onCreateRoom,
  user,
  onLogout,
  isLoading = false,
  presenceStatus = {},
}: SidebarProps) {
  return (
    <aside
      style={{ width }}
      className="bg-secondary backdrop-blur-xl border-r border-border-divider flex flex-col relative shrink-0 z-20 group/sidebar"
    >
      {/* Sidebar Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border-divider bg-secondary/50 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Image
            src="/images/logo-light.png"
            alt="Lion"
            width={40}
            height={40}
            className="drop-shadow-lg"
          />
          <span className="text-xl font-black text-white tracking-tighter">
            GokilChat
          </span>
        </div>
        <button
          onClick={onCreateRoom}
          className="w-8 h-8 rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-accent-default transall" />
          <input
            type="text"
            placeholder="Cari obrolan..."
            className="w-full bg-elevated/50 border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-primary focus:outline-none focus:border-accent-default/50 transall placeholder:text-text-muted/50"
          />
        </div>
      </div>

      {/* Rooms List */}
      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onRoomClick(room.id)}
              className={clsx(
                "w-full p-3 rounded-2xl flex items-center gap-3 transall group",
                activeRoomId === room.id
                  ? "bg-accent-default shadow-lg shadow-accent-default/20 text-text-on-accent"
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
                    />
                  ) : (
                    room.name?.charAt(0) || "#"
                  )}
                </div>

                {/* Dot Online On-Demand - Premium Cut-out Effect 🗿🟢 */}
                {room.type === "dm" &&
                  room.dm_user_id &&
                  presenceStatus[room.dm_user_id] && (
                    <div className="absolute bottom-[0.05rem] right-[0.05rem] size-[0.8rem] border-[1.5px] border-secondary bg-status-online rounded-full z-30" />
                  )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-black text-sm truncate tracking-tight">
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
      )}

      {/* User Profile Footer */}
      <div className="p-4 border-t border-border-divider bg-secondary/30">
        <div className="p-3 bg-elevated/30 rounded-2xl flex items-center gap-3 border border-border-subtle/30 shadow-inner">
          <div className="relative">
            <Image
              src={user.avatar_url || "/images/default-avatar.png"}
              alt="avatar"
              width={42}
              height={42}
              className="rounded-xl border border-border-divider"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-online rounded-full border-2 border-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">
              {user.username}
            </p>
            <p className="text-[10px] text-text-secondary truncate uppercase tracking-widest font-bold">
              Online
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-text-secondary hover:text-white transall">
              <Settings className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-text-secondary hover:text-red-400 transall"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
