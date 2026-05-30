import {
  Search,
  Info,
  MoreVertical,
  UserPlus,
  LogOut,
  X,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { Room } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import Tooltip from "@/components/Tooltip";
import GroupIcon from "@/components/GroupIcon";
import { useChatStore } from "@/store/useChatStore";

interface ChatHeaderProps {
  activeRoom: Room;
  isOnline: boolean;
  onInviteClick: () => void;
  onGroupInfoClick: () => void;
  onLeaveGroupClick?: () => void;
  membersCache: Record<string, string>;
  showSubtitleHint: boolean;
  isSearchActive: boolean;
  setIsSearchActive: (val: boolean) => void;
  onDmUserClick?: (userId: string) => void;
  typingUser?: string;
}

export default function ChatHeader({
  activeRoom,
  isOnline,
  onInviteClick,
  onGroupInfoClick,
  onLeaveGroupClick,
  membersCache,
  showSubtitleHint,
  isSearchActive,
  setIsSearchActive,
  onDmUserClick,
  typingUser,
}: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tooltipAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setActiveRoomId = useChatStore((state) => state.setActiveRoomId);

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-3 md:px-6 bg-primary/80 backdrop-blur-xl border-b border-border-divider/50 z-20 sticky top-0">
      <div className="flex flex-1 min-w-0 items-center mr-4 h-full gap-2">
        <button
          onClick={() => setActiveRoomId(null)}
          className="md:hidden p-3 text-text-secondary hover:text-white hover:bg-elevated rounded-xl transall shrink-0 focus:outline-none active:outline-none border-none"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {activeRoom.type !== "dm" ? (
          <Tooltip
            content="Klik untuk info grup"
            placement="bottom"
            triggerClassName="flex flex-1 min-w-0 h-full items-center"
            anchorRef={tooltipAnchorRef}
          >
            <div
              className="flex items-center gap-4 w-full h-full transall cursor-pointer hover:opacity-80"
              onClick={onGroupInfoClick}
            >
              <div
                ref={tooltipAnchorRef}
                className="flex items-center gap-4 max-w-full min-w-0"
              >
                <div className="relative shrink-0">
                  <div className="size-9 md:size-11 rounded-full bg-elevated flexcc border border-border-divider/50 overflow-hidden shadow-inner">
                    {activeRoom.avatar_url ? (
                      <Image
                        src={activeRoom.avatar_url}
                        alt={activeRoom.name || ""}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.srcset = "";
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                    ) : activeRoom.type === "dm" ? (
                      <span className="font-black text-accent-default text-lg">
                        {activeRoom.name?.charAt(0) || "#"}
                      </span>
                    ) : (
                      <GroupIcon className="text-accent-default" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white text-base tracking-tight leading-tight mb-1 truncate">
                    {activeRoom.name || "Private Chat"}
                  </h3>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {typingUser ? (
                      <span className="truncate w-full text-xs text-accent-default animate-pulse font-medium">
                        {typingUser} sedang mengetik...
                      </span>
                    ) : (
                      <span
                        className={clsx(
                          "truncate w-full",
                          showSubtitleHint
                            ? "text-xs text-accent-default/90"
                            : "text-xs text-text-muted",
                        )}
                      >
                        {showSubtitleHint
                          ? "Klik di sini untuk info grup"
                          : membersCache[activeRoom.id] || "Group Chat"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tooltip>
        ) : (
          <Tooltip
            content="Klik untuk info profil"
            placement="bottom"
            triggerClassName="flex flex-1 min-w-0 h-full items-center animate-in fade-in slide-in-from-left-4 duration-200"
            anchorRef={tooltipAnchorRef}
          >
            <div
              className="flex items-center gap-4 w-full h-full transall cursor-pointer hover:opacity-80"
              onClick={() =>
                activeRoom.dm_user_id && onDmUserClick?.(activeRoom.dm_user_id)
              }
            >
              <div
                ref={tooltipAnchorRef}
                className="flex items-center gap-2.5 md:gap-4 max-w-full min-w-0"
              >
                <div className="relative shrink-0">
                  <div className="size-9 md:size-11 rounded-full bg-elevated flexcc border border-border-divider/50 overflow-hidden shadow-inner">
                    {activeRoom.avatar_url ? (
                      <Image
                        src={activeRoom.avatar_url}
                        alt={activeRoom.name || ""}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.srcset = "";
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                    ) : (
                      <span className="font-black text-accent-default text-lg">
                        {activeRoom.name?.charAt(0) || "#"}
                      </span>
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-status-online rounded-full border-[2.5px] border-primary shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white text-base tracking-tight leading-tight mb-1 truncate">
                    {activeRoom.name || "Private Chat"}
                  </h3>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {typingUser ? (
                      <span className="truncate w-full text-xs text-accent-default animate-pulse font-medium">
                        sedang mengetik...
                      </span>
                    ) : (
                      <span
                        className={clsx(
                          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                          isOnline
                            ? "bg-status-online/15 text-status-online"
                            : "bg-text-muted/10 text-text-muted",
                        )}
                      >
                        {isOnline ? "Online ⚡" : "Offline ⚡"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          className={clsx(
            "p-2 transall cursor-pointer rounded-xl focus:outline-none active:outline-none border-none",
            isSearchActive
              ? "text-accent-default bg-accent-default/10"
              : "text-text-secondary hover:text-white",
          )}
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          onClick={() => {
            setIsSearchActive(!isSearchActive);
          }}
        >
          {isSearchActive ? (
            <X className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-text-secondary hover:text-white transall cursor-pointer focus:outline-none active:outline-none border-none"
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-elevated border border-border-divider rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col p-1 origin-top-right animate-in fade-in zoom-in duration-150">
              {activeRoom.type !== "dm" ? (
                <>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onInviteClick();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-white/5 rounded-xl transall cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-text-secondary" /> Tambah
                    Anggota
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onGroupInfoClick();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-white/5 rounded-xl transall cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-text-secondary" /> Info Grup
                  </button>
                  <div className="h-px bg-border-divider my-1 mx-2" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLeaveGroupClick?.();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-xl transall cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Keluar Grup
                  </button>
                </>
              ) : (
                <div className="px-4 py-3 text-xs text-text-muted text-center font-medium">
                  (Belum ada menu untuk DM)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
