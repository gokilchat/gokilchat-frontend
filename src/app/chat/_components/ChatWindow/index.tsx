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
import UserProfileSlider from "../modals/UserProfileSlider";
import SearchMessageSlider from "../modals/SearchMessageSlider";

interface ChatWindowProps {
  activeRoom: Room | null;
  messages: Message[];
  user: User;
  isOnline: boolean;
  onInviteClick: () => void;
  onGroupInfoClick: () => void;
  onLeaveGroupClick?: () => void;
  onSendMessage: (message: string) => void;
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
  onSendMessage,
  messagesEndRef,
  inputRef,
  presenceStatus = {},
  isLoading = false,
  typingUser,
}: ChatWindowProps & { typingUser?: string }) {
  const [membersCache, setMembersCache] = useState<Record<string, string>>({});
  const [showSubtitleHint, setShowSubtitleHint] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prevRoomId, setPrevRoomId] = useState(activeRoom?.id);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [searchedMessageId, setSearchedMessageId] = useState("");

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleSelectMessage = (msgId: string) => {
    setSearchedMessageId(msgId);
    setIsSearchActive(false);
  };

  const [prevSearchQuery, setPrevSearchQuery] = useState("");
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    if (!searchQuery) {
      setSearchedMessageId("");
    }
  }

  // Clear search on room change
  if (activeRoom?.id !== prevRoomId) {
    setPrevRoomId(activeRoom?.id);
    setIsSearchActive(false);
    setSearchQuery("");
    setSearchedMessageId("");
  }

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
        .catch(() => {
          // Ignore error silently, it throws 403 when user leaves the room
        });
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
    return (
      <div className="hidden md:flex flex-1 overflow-hidden bg-primary relative">
        <EmptyState />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex overflow-hidden bg-primary relative">
        <ChatSkeleton />
      </div>
    );
  }

  // Dulu di sini ada filter pesannya, sekarang main chat window ga di filter
  // Tapi kita akan kirim query ke dalam biar di highlight
  const displayMessages = messages;

  return (
    <div className="flex-1 flex overflow-hidden bg-primary relative">
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <ChatHeader
        activeRoom={activeRoom}
        isOnline={isOnline}
        onInviteClick={onInviteClick}
        onGroupInfoClick={onGroupInfoClick}
        onLeaveGroupClick={onLeaveGroupClick}
        membersCache={membersCache}
        showSubtitleHint={showSubtitleHint}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
        onDmUserClick={handleUserClick}
        typingUser={typingUser}
      />

      <ChatMessages
        messages={displayMessages}
        user={user}
        presenceStatus={presenceStatus}
        messagesEndRef={messagesEndRef}
        onUserClick={handleUserClick}
        searchQuery={searchQuery}
        searchedMessageId={searchedMessageId}
        onClearHighlight={() => {
          setSearchedMessageId("");
          setSearchQuery("");
        }}
      />

      <ChatInput
        key={activeRoom?.id}
        onSendMessage={onSendMessage}
        onTyping={() => {
          if (activeRoom) {
            getSocket()?.emit("presence:typing", { room_id: activeRoom.id });
          }
        }}
        inputRef={inputRef}
      />

        <UserProfileSlider
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
        />
      </main>

      <SearchMessageSlider
        isOpen={isSearchActive}
        onClose={() => {
          setIsSearchActive(false);
          setSearchQuery("");
          setSearchedMessageId("");
        }}
        messages={messages}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectMessage={handleSelectMessage}
      />
    </div>
  );
}
