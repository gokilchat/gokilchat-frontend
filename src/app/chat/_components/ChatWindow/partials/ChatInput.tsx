import { Paperclip, Smile, Send, X } from "lucide-react";
import { Message } from "@/types/chat";
import clsx from "clsx";
import { FormEvent, RefObject, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export default function ChatInput({
  onSendMessage,
  onTyping,
  inputRef,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const [localInput, setLocalInput] = useState("");
  const shouldIgnoreFocus = useRef(true);

  // Cegah keyboard HP/mobile otomatis muncul saat masuk room dengan me-blur textarea 📱
  useEffect(() => {
    shouldIgnoreFocus.current = true;

    // Reset abaikan focus setelah 500ms (cukup buat ngelewatin transisi/hiding sidebar)
    const timer = setTimeout(() => {
      shouldIgnoreFocus.current = false;
    }, 500);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }

    return () => clearTimeout(timer);
  }, [inputRef]);

  // Autofocus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo, inputRef]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (
      shouldIgnoreFocus.current &&
      typeof window !== "undefined" &&
      window.innerWidth < 768
    ) {
      e.currentTarget.blur();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    onSendMessage(localInput);
    setLocalInput("");
  };

  const handleInputChange = (val: string) => {
    setLocalInput(val);
    onTyping();
  };

  return (
    <div className="px-6 sm:px-3 pb-4 mb-4 sm:mb-0 pt-0 md:px-6 md:pb-6 lg:px-24 lg:pb-8 bg-primary">
      <form
        onSubmit={handleSubmit}
        className="relative bg-secondary border border-border-divider rounded-3xl md:rounded-4xl p-1.5 pr-2.5 md:p-2 md:pr-4 flex flex-col focus-within:border-accent-default/50 transall"
      >
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0 }}
              className="overflow-hidden flex items-center justify-between bg-elevated/40 border-l-4 border-accent-default px-4 py-2.5 rounded-xl mb-2 mx-1 text-xs"
            >
              <div className="flex-1 min-w-0 pr-4 text-left">
                <span className="font-black text-accent-default block mb-0.5 tracking-wide">
                  Membalas{" "}
                  {replyingTo.sender_full_name || replyingTo.sender_username}
                </span>
                <span className="text-text-secondary truncate block font-medium">
                  {replyingTo.content}
                </span>
              </div>
              <button
                type="button"
                onClick={onCancelReply}
                className="text-text-muted hover:text-white p-1 rounded-full hover:bg-white/5 transall shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-1.5 md:gap-2 w-full">
          <div className="flex items-center gap-0.5 md:gap-1 pl-1 md:pl-2 mb-1.5">
            <button
              type="button"
              className="hidden sm:block p-2 text-text-muted hover:text-accent-default transall"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-text-muted hover:text-accent-default transall"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={localInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onFocus={handleFocus}
            placeholder="Tulis pesan gokil lu..."
            rows={1}
            className="flex-1 bg-secondary border-none outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/50 py-3 resize-none max-h-40 custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!localInput.trim()}
            className={clsx(
              "w-10 h-10 md:w-11 md:h-11 rounded-full flexcc transall mb-0.5 shadow-lg shrink-0",
              localInput.trim()
                ? "bg-accent-default text-text-on-accent scale-100 rotate-0 hover:bg-accent-hover"
                : "bg-elevated text-text-muted scale-90 -rotate-12 opacity-50",
            )}
          >
            <Send className="w-4.5 h-4.5 md:w-5 md:h-5 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
