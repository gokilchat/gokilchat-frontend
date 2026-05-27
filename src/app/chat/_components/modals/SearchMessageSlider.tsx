import { useMemo, useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Message } from "@/types/chat";
import clsx from "clsx";

interface SearchMessageSliderProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSelectMessage: (msgId: string) => void;
}

export default function SearchMessageSlider({
  isOpen,
  onClose,
  messages,
  searchQuery,
  setSearchQuery,
  onSelectMessage,
}: SearchMessageSliderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Sync from parent if cleared externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.content?.toLowerCase().includes(query))
      .reverse(); // Show newest first
  }, [messages, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      <div
        className={clsx(
          "fixed inset-y-0 right-0 z-50 lg:relative lg:inset-auto lg:z-auto h-full flex justify-end overflow-hidden transition-all duration-300 ease-out border-border-divider/50",
          isOpen
            ? "w-full lg:w-90 lg:border-l opacity-100"
            : "w-0 lg:border-l-0 opacity-0 lg:opacity-100 pointer-events-none",
        )}
      >
        <div className="w-screen lg:w-90 shrink-0 h-full bg-primary shadow-2xl flex flex-col">
          {/* Header */}
          <div className="h-16 px-5 bg-secondary/80 backdrop-blur-md border-b border-border-divider flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-text-muted" />
              <h3 className="text-base font-black text-white">Cari Pesan</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-elevated rounded-xl transall"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-border-divider/50 bg-secondary/30">
            <div className="relative flex items-center h-10 bg-elevated/50 border border-border-divider rounded-xl px-4 overflow-hidden focus-within:border-accent-default focus-within:bg-elevated transall">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Cari pesan di chat ini..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium px-3 placeholder:text-text-muted"
                autoFocus
              />
              {localQuery && (
                <button
                  onClick={() => setLocalQuery("")}
                  className="p-1 text-text-muted hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {!searchQuery.trim() ? (
              <div className="h-full flexcc text-center px-6">
                <p className="text-sm font-semibold text-text-muted">
                  Ketik sesuatu untuk mencari pesan di obrolan ini.
                </p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flexcc text-center px-6">
                <p className="text-sm font-semibold text-text-muted">
                  Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => onSelectMessage(msg.id)}
                    className="p-3 hover:bg-elevated rounded-xl cursor-pointer transall flex flex-col gap-1 border border-transparent hover:border-border-divider/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-accent-default truncate">
                        {msg.sender_full_name || msg.sender_username}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted shrink-0">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
