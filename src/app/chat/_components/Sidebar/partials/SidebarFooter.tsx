import { LogOut } from "lucide-react";
import Image from "next/image";
import { User } from "@/types/chat";
import Tooltip from "@/components/Tooltip";
import { useRef, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

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
  const profileAnchorRef = useRef<HTMLDivElement>(null);
  const logoutAnchorRef = useRef<HTMLButtonElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="p-4 border-t border-border-divider bg-secondary/30">
      <div className="flex items-stretch gap-2">
        <Tooltip
          content="Klik untuk Pengaturan"
          placement="top"
          triggerClassName="flex flex-1 min-w-0"
          anchorRef={profileAnchorRef}
        >
          <div
            ref={profileAnchorRef}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer p-3 bg-elevated/30 hover:bg-elevated/60 border border-border-subtle/30 hover:border-border-divider shadow-inner rounded-2xl transall"
            onClick={onSettingsClick}
          >
            <div className="relative shrink-0">
              <Image
                src={user.avatar_url || "/images/default-avatar.png"}
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full border border-border-divider shadow-sm"
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
              <p className="text-[11px] text-text-secondary truncate font-medium">
                @{user.username}
              </p>
            </div>
          </div>
        </Tooltip>

        <Tooltip
          content="Keluar"
          placement="top"
          anchorRef={logoutAnchorRef}
        >
          <button
            ref={logoutAnchorRef}
            onClick={() => setShowLogoutConfirm(true)}
            className="p-3 bg-transparent hover:bg-red-500/10 border border-transparent text-text-secondary hover:text-red-400 rounded-2xl transall flexcc shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Konfirmasi Keluar"
        description="Yakin mau keluar dari GokilChat? Ntar kangen lho 🗿"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
