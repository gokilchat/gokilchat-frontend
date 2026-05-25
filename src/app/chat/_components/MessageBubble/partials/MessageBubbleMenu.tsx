import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface MessageBubbleMenuProps {
  isMe: boolean;
  onInfoClick: () => void;
}

export default function MessageBubbleMenu({
  isMe,
  onInfoClick,
}: MessageBubbleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opensUp: false,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Kalau mepet bawah, buka popup-nya ke arah atas biar nggak kependem 🗿
      const opensUp = rect.bottom > windowHeight - 180;

      setMenuCoords({
        top: rect.bottom + 4,
        bottom: windowHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
        left: rect.left,
        opensUp,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="absolute top-1.5 right-1.5 z-20">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={clsx(
          "p-1 rounded-full hover:bg-black/10 transall backdrop-blur-sm",
          isMe ? "text-text-on-accent" : "text-text-secondary",
          isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            {/* Overlay buat nangkep klik di luar menu */}
            <div
              className="fixed inset-0 z-9998"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              style={{
                position: "fixed",
                ...(menuCoords.opensUp
                  ? { bottom: menuCoords.bottom }
                  : { top: menuCoords.top }),
                ...(isMe
                  ? { right: menuCoords.right }
                  : { left: menuCoords.left }),
              }}
              className={clsx(
                "bg-elevated border border-border-divider rounded-xl shadow-2xl py-1 z-9999 w-36 overflow-hidden",
                isMe
                  ? menuCoords.opensUp
                    ? "origin-bottom-right"
                    : "origin-top-right"
                  : menuCoords.opensUp
                    ? "origin-bottom-left"
                    : "origin-top-left",
              )}
            >
              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInfoClick();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-secondary transall"
                >
                  Info Pesan
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  alert("Fitur Balas coming soon 🗿");
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-secondary transall"
              >
                Balas
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  alert("Fitur Teruskan coming soon 🗿");
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-secondary transall"
              >
                Teruskan
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  alert("Fitur Hapus coming soon 🗿");
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-secondary transall"
              >
                Hapus
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
