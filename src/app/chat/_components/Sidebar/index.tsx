import { User, Room } from "@/types/chat";
import SidebarHeader from "./partials/SidebarHeader";
import SidebarSearch from "./partials/SidebarSearch";
import SidebarRoomList from "./partials/SidebarRoomList";
import SidebarFooter from "./partials/SidebarFooter";

interface SidebarProps {
  width: number;
  rooms: Room[];
  activeRoomId: string | null;
  onRoomClick: (id: string) => void;
  onCreateRoom: () => void;
  user: User;
  onLogout: () => void;
  onSettingsClick: () => void;
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
  onSettingsClick,
  isLoading = false,
  presenceStatus = {},
}: SidebarProps) {
  return (
    <aside
      style={{ width }}
      className="bg-primary backdrop-blur-xl flex flex-col relative shrink-0 z-20 group/sidebar"
    >
      <SidebarHeader onCreateRoom={onCreateRoom} />
      <SidebarSearch />
      <SidebarRoomList
        rooms={rooms}
        activeRoomId={activeRoomId}
        onRoomClick={onRoomClick}
        isLoading={isLoading}
        presenceStatus={presenceStatus}
        user={user}
      />
      <SidebarFooter
        user={user}
        onLogout={onLogout}
        onSettingsClick={onSettingsClick}
      />
    </aside>
  );
}
