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
import ForwardMessageModal from "../modals/ForwardMessageModal";
import ReportModal from "../modals/ReportModal";

interface ChatWindowProps {
  activeRoom: Room | null;
  messages: Message[];
  user: User;
  isOnline: boolean;
  onInviteClick: () => void;
  onGroupInfoClick: () => void;
  onLeaveGroupClick?: () => void;
  onSendMessage: (message: string, parentId?: string | null) => void;
  onDeleteMessage?: (message: Message) => void;
  onHideMessage?: (message: Message) => void;
  onUnhideMessage?: (message: Message) => void;
  onClearChat?: () => void;
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
  onDeleteMessage,
  onHideMessage,
  onUnhideMessage,
  onClearChat,
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

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"owner" | "admin" | "user">("user");
  // Map userId -> role di room ini, buat nentuin hak hapus per-pesan (hierarki owner>admin>user)
  const [memberRoles, setMemberRoles] = useState<Record<string, "owner" | "admin" | "user">>({});
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const [reportingUser, setReportingUser] = useState<Partial<User> | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

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
    setReplyingTo(null);
    // Reset role ke "user" dulu tiap ganti room; effect di bawah yang fetch role asli buat grup.
    // DM gak ada owner/admin — keduanya "user" (ERD v5), jadi default ini juga final buat DM.
    setCurrentUserRole("user");
    setMemberRoles({});
  }

  // Fetch group members for the header subtitle (boleh di-cache, nama jarang berubah)
  useEffect(() => {
    if (activeRoom && activeRoom.type !== "dm" && !membersCache[activeRoom.id]) {
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
  }, [activeRoom, membersCache, user.id]);

  // Role user di room ini WAJIB selalu fresh tiap ganti room — JANGAN di-cache.
  // Dulu di-gate `!membersCache[room]`, jadi pas balik ke room ter-cache role nyangkut
  // di "user" → owner/admin kehilangan hak "hapus untuk semua" sampai refresh. 🗿
  // (Default "user" sudah di-set di blok render saat ganti room; di sini cuma fetch role asli grup.)
  useEffect(() => {
    if (!activeRoom || activeRoom.type === "dm") return;
    let cancelled = false;
    apiFetch(`/rooms/${activeRoom.id}`, { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.members) {
          const me = res.data.members.find(
            (m: { user: User; role: "owner" | "admin" | "user" }) =>
              m.user.id === user.id,
          );
          setCurrentUserRole(me ? me.role : "user");
          // Bangun map role semua member buat gating tombol hapus per-pesan
          const roleMap: Record<string, "owner" | "admin" | "user"> = {};
          res.data.members.forEach(
            (m: { user: User; role: "owner" | "admin" | "user" }) => {
              roleMap[m.user.id] = m.role;
            },
          );
          setMemberRoles(roleMap);
        }
      })
      .catch(() => {
        // 403 kalau user udah gak di room — biarin
      });
    return () => {
      cancelled = true;
    };
  }, [activeRoom, user.id]);

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

    // Kalau role MILIK GUA berubah live (di-promote/demote owner), update canDelete instan
    const handleRoleChanged = (data: {
      room_id: string;
      user_id: string;
      role: "owner" | "admin" | "user";
    }) => {
      if (data.room_id === activeRoom.id) {
        // Update map role semua member (buat gating hapus per-pesan)
        setMemberRoles((prev) => ({ ...prev, [data.user_id]: data.role }));
        // Kalau yang berubah role-nya gua sendiri, update juga currentUserRole
        if (data.user_id === user.id) setCurrentUserRole(data.role);
      }
    };

    socket.on("room:member_left", handleMemberLeft);
    socket.on("room:member_joined", handleMemberJoined);
    socket.on("room:member_role_changed", handleRoleChanged);
    return () => {
      socket.off("room:member_left", handleMemberLeft);
      socket.off("room:member_joined", handleMemberJoined);
      socket.off("room:member_role_changed", handleRoleChanged);
    };
  }, [activeRoom, user.id]);

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
        onClearChat={onClearChat}
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
        onReplyClick={(msg) => setReplyingTo(msg)}
        onForwardClick={(msg) => setForwardingMessage(msg)}
        onDeleteClick={onDeleteMessage}
        onHideClick={onHideMessage}
        onUnhideClick={onUnhideMessage}
        onReportClick={(msg) => {
          setReportingMessage(msg);
          setReportingUser(null);
          setShowReportModal(true);
        }}
        currentUserRole={currentUserRole}
        memberRoles={memberRoles}
      />

      <ChatInput
        key={activeRoom?.id}
        onSendMessage={(val) => {
          onSendMessage(val, replyingTo?.id);
          setReplyingTo(null);
        }}
        onTyping={() => {
          if (activeRoom) {
            getSocket()?.emit("presence:typing", { room_id: activeRoom.id });
          }
        }}
        inputRef={inputRef}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onPreviewClick={(messageId) => {
          // Scroll ke pesan asal yang lagi dibalas + kasih highlight sekejap 🗿
          const el = document.getElementById(`msg-${messageId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-accent-default", "ring-offset-2", "ring-offset-primary");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-accent-default", "ring-offset-2", "ring-offset-primary");
            }, 1500);
          }
        }}
      />

        <UserProfileSlider
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
          onReportClick={(repUser) => {
            setReportingUser({
              id: repUser.id,
              username: repUser.username,
              full_name: repUser.full_name || undefined,
              avatar_url: repUser.avatar_url || undefined,
            });
            setReportingMessage(null);
            setShowReportModal(true);
          }}
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

      {forwardingMessage && (
        <ForwardMessageModal
          isOpen={!!forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          message={forwardingMessage}
        />
      )}

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportingMessage(null);
            setReportingUser(null);
          }}
          reportedMessage={reportingMessage}
          reportedUser={reportingUser}
        />
      )}
    </div>
  );
}
