import { User, Room, Message } from "@/types/chat";
import ChatSkeleton from "../ChatSkeleton";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";

// Partials
import ChatHeader from "./partials/ChatHeader";
import ChatMessages from "./partials/ChatMessages";
import ChatInput from "./partials/ChatInput";
import EmptyState from "./partials/EmptyState";

interface ChatWindowProps {
  activeRoom: Room | null;
  messages: Message[];
  user: User;
  isOnline: boolean;
  onInviteClick: () => void;
  onGroupInfoClick: () => void;
  onLeaveGroupClick?: () => void;
  messageInput: string;
  onMessageInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  presenceStatus?: Record<string, boolean>;
  isLoading?: boolean;
}

export default function ChatWindow({
  activeRoom,
  messages,
  user,
  isOnline,
  onInviteClick,
  onGroupInfoClick,
  onLeaveGroupClick,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  messagesEndRef,
  inputRef,
  presenceStatus = {},
  isLoading = false,
}: ChatWindowProps) {
  const [membersCache, setMembersCache] = useState<Record<string, string>>({});
  const [showSubtitleHint, setShowSubtitleHint] = useState(false);

  // Fetch group members for the header subtitle
  useEffect(() => {
    if (
      activeRoom &&
      activeRoom.type !== "dm" &&
      !membersCache[activeRoom.id]
    ) {
      apiFetch(`/rooms/${activeRoom.id}`, { cache: "no-store" })
        .then((res) => {
          if (res.success && res.data?.members) {
            const names = res.data.members
              .map((m: { user: User }) => m.user.full_name || m.user.username)
              .join(", ");
            setMembersCache((prev) => ({ ...prev, [activeRoom.id]: names }));
          }
        })
        .catch(console.error);
    }
  }, [activeRoom, membersCache]);

  // Listen for socket events to update membersCache
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeRoom) return;

    const handleMemberLeft = (data: { room_id: string; user_id: string }) => {
      if (data.room_id === activeRoom.id) {
        // Clear the cache so it will be refetched
        setMembersCache((prev) => {
          const newCache = { ...prev };
          delete newCache[activeRoom.id];
          return newCache;
        });
      }
    };

    const handleMemberJoined = (data: { room_id: string }) => {
      if (data.room_id === activeRoom.id) {
        setMembersCache((prev) => {
          const newCache = { ...prev };
          delete newCache[activeRoom.id];
          return newCache;
        });
      }
    };

    socket.on("room:member_left", handleMemberLeft);
    socket.on("room:member_joined", handleMemberJoined);
    return () => {
      socket.off("room:member_left", handleMemberLeft);
      socket.off("room:member_joined", handleMemberJoined);
    };
  }, [activeRoom]);

  // Handle subtitle hint animation
  useEffect(() => {
    if (activeRoom?.type !== "dm") {
      const showTimer = setTimeout(() => setShowSubtitleHint(true), 0);
      const hideTimer = setTimeout(() => setShowSubtitleHint(false), 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      const hideTimer = setTimeout(() => setShowSubtitleHint(false), 0);
      return () => clearTimeout(hideTimer);
    }
  }, [activeRoom?.id, activeRoom?.type]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);

  if (!activeRoom) {
    return <EmptyState />;
  }

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <main className="flex-1 flex flex-col relative bg-primary overflow-hidden">
      <ChatHeader
        activeRoom={activeRoom}
        isOnline={isOnline}
        onInviteClick={onInviteClick}
        onGroupInfoClick={onGroupInfoClick}
        onLeaveGroupClick={onLeaveGroupClick}
        membersCache={membersCache}
        showSubtitleHint={showSubtitleHint}
      />

      <ChatMessages
        messages={messages}
        user={user}
        presenceStatus={presenceStatus}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        messageInput={messageInput}
        onMessageInputChange={onMessageInputChange}
        onSendMessage={onSendMessage}
        inputRef={inputRef}
      />
    </main>
  );
}
