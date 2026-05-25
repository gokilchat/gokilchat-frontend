import { Paperclip, Smile, Send } from "lucide-react";
import clsx from "clsx";
import { FormEvent, RefObject } from "react";

interface ChatInputProps {
  messageInput: string;
  onMessageInputChange: (val: string) => void;
  onSendMessage: (e: FormEvent) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInput({
  messageInput,
  onMessageInputChange,
  onSendMessage,
  inputRef,
}: ChatInputProps) {
  return (
    <div className="p-6 md:px-12 lg:px-24 pb-8 pt-0 bg-primary">
      <form
        onSubmit={onSendMessage}
        className="relative bg-secondary border border-border-divider rounded-4xl p-2 pr-4 flex items-end gap-2 focus-within:border-accent-default/50 transall"
      >
        <div className="flex items-center gap-1 pl-2 mb-1.5">
          <button
            type="button"
            className="p-2 text-text-muted hover:text-accent-default transall"
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
          value={messageInput}
          onChange={(e) => onMessageInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(e);
            }
          }}
          placeholder="Tulis pesan gokil lu di sini..."
          rows={1}
          className="flex-1 bg-secondary border-none outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/50 py-3 resize-none max-h-40 custom-scrollbar"
        />
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className={clsx(
            "w-11 h-11 rounded-full flexcc transall mb-0.5 shadow-lg",
            messageInput.trim()
              ? "bg-accent-default text-text-on-accent scale-100 rotate-0 hover:bg-accent-hover"
              : "bg-elevated text-text-muted scale-90 -rotate-12 opacity-50",
          )}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
