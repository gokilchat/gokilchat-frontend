import { User, Room } from "@/types/chat";
import clsx from "clsx";
import SidebarHeader from "./partials/SidebarHeader";
import SidebarSearch from "./partials/SidebarSearch";
import SidebarRoomList from "./partials/SidebarRoomList";
import SidebarFooter from "./partials/SidebarFooter";
import { useState, useEffect } from "react";

interface SidebarProps {
  width: number;
  rooms: Room[];
  activeRoomId: string | null;
  onRoomClick: (id: string) => void;
  onSelectDM: () => void;
  onSelectGroup: () => void;
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
  onSelectDM,
  onSelectGroup,
  user,
  onLogout,
  onSettingsClick,
  isLoading = false,
  presenceStatus = {},
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <aside
      className={clsx(
        "bg-primary backdrop-blur-xl flex flex-col relative shrink-0 z-40 group/sidebar",
        activeRoomId ? "hidden md:flex" : "flex w-full md:w-auto"
      )}
      style={{ width: isMobile && !activeRoomId ? '100%' : width }}
    >
      <SidebarHeader
        onSelectDM={onSelectDM}
        onSelectGroup={onSelectGroup}
        user={user}
        onLogout={onLogout}
        onSettingsClick={onSettingsClick}
      />
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
