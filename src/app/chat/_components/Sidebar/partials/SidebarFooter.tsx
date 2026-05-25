import { Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { User } from "@/types/chat";

interface SidebarFooterProps {
  user: User;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export default function SidebarFooter({
  user,
  onLogout,
  onSettingsClick,
}: SidebarFooterProps) {
  return (
    <div className="p-4 border-t border-border-divider bg-secondary/30">
      <div className="p-3 bg-elevated/30 rounded-2xl flex items-center gap-3 border border-border-subtle/30 shadow-inner">
        <div className="relative">
          <Image
            src={user.avatar_url || "/images/default-avatar.png"}
            alt="avatar"
            width={42}
            height={42}
            className="rounded-full border border-border-divider"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.srcset = "";
              e.currentTarget.src = "/images/default-avatar.png";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">
            {user.full_name || user.username}
          </p>
          <p className="text-[10px] text-text-secondary truncate uppercase tracking-widest font-bold">
            Online
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onSettingsClick}
            className="p-2 text-text-secondary hover:text-white transall"
          >
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
  );
}
