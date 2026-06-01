import {
  ChevronDown,
  Info,
  Reply,
  Forward,
  Flag,
  Trash,
  Trash2,
} from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";

export interface MessageBubbleMenuHandle {
  openAt: (x: number, y: number) => void;
}

interface MessageBubbleMenuProps {
  isMe: boolean;
  onInfoClick: () => void;
  onReplyClick?: () => void;
  onForwardClick?: () => void;
  onDeleteClick?: () => void;
  onHideClick?: () => void;
  onReportClick?: () => void;
  canDelete?: boolean;
  isDeleted?: boolean;
}

const MessageBubbleMenu = forwardRef<
  MessageBubbleMenuHandle,
  MessageBubbleMenuProps
>(function MessageBubbleMenu(
  {
    isMe,
    onInfoClick,
    onReplyClick,
    onForwardClick,
    onDeleteClick,
    onHideClick,
    onReportClick,
    canDelete = false,
    isDeleted = false,
  },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opensUp: false,
    alignRight: false,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // ID unik per instance — biar event "tutup semua menu" gak nutup menu yang BARU dibuka
  const instanceId = useRef(Symbol("bubble-menu"));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hanya boleh ADA SATU menu kebuka di seluruh chat. Pas satu menu buka, ia broadcast
  // event ini; instance lain yang denger langsung nutup diri. Tanpa ini, buka menu chat A
  // lalu chat B tanpa nutup A bikin DUA menu kebuka & klik bisa nyasar ke chat A. 🗿
  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const opener = (e as CustomEvent<symbol>).detail;
      if (opener !== instanceId.current) setIsOpen(false);
    };
    window.addEventListener("gokilchat:bubble-menu-open", handleCloseOthers);
    return () =>
      window.removeEventListener("gokilchat:bubble-menu-open", handleCloseOthers);
  }, []);

  // Tutup menu secara global pas klik di luar area menu 🗿
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("contextmenu", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("contextmenu", handleOutsideClick);
    };
  }, [isOpen]);

  // Umumkan ke semua instance lain: "gua kebuka, lu semua tutup"
  const broadcastOpen = () => {
    window.dispatchEvent(
      new CustomEvent("gokilchat:bubble-menu-open", { detail: instanceId.current }),
    );
  };

  // Buka menu di koordinat bebas (dipakai buat klik kanan di bubble) 🗿
  const openAt = useCallback((x: number, y: number) => {
    broadcastOpen();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const opensUp = y > windowHeight - 200;
    const alignRight = x > windowWidth - 160;
    setMenuCoords({
      top: y,
      bottom: windowHeight - y,
      left: x,
      right: windowWidth - x,
      opensUp,
      alignRight,
    });
    setIsOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openAt }), [openAt]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    broadcastOpen();
    if (buttonRef.current) {
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
        alignRight: isMe,
      });
      setIsOpen(true);
    }
  };

  return (
    <div className="absolute top-1.5 right-1.5 z-20">
      {!isDeleted && (
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
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: menuCoords.opensUp ? 8 : -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: menuCoords.opensUp ? 8 : -8 }}
                transition={{ type: "spring", duration: 0.15, bounce: 0 }}
                style={{
                  position: "fixed",
                  ...(menuCoords.opensUp
                    ? { bottom: menuCoords.bottom }
                    : { top: menuCoords.top }),
                  ...(menuCoords.alignRight
                    ? { right: menuCoords.right }
                    : { left: menuCoords.left }),
                }}
                className={clsx(
                  "bg-elevated border border-border-subtle rounded-xl shadow-2xl py-1 z-9996 w-48 overflow-hidden",
                  menuCoords.alignRight
                    ? menuCoords.opensUp
                      ? "origin-bottom-right"
                      : "origin-top-right"
                    : menuCoords.opensUp
                      ? "origin-bottom-left"
                      : "origin-top-left",
                )}
              >
                  {isDeleted ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        onHideClick?.();
                      }}
                      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-secondary transall"
                    >
                      <Trash className="w-4 h-4 text-text-secondary shrink-0" />
                      Hapus untuk saya
                    </button>
                  ) : (
                    <>
                      {isMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInfoClick();
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-secondary transall"
                        >
                          <Info className="w-4 h-4 text-white/80 shrink-0" />
                          Info Pesan
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onReplyClick?.();
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-secondary transall"
                      >
                        <Reply className="w-4 h-4 text-text-secondary shrink-0" />
                        Balas
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onForwardClick?.();
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-secondary transall"
                      >
                        <Forward className="w-4 h-4 text-text-secondary shrink-0" />
                        Teruskan
                      </button>
                      {!isMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onReportClick?.();
                          }}
                          className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-yellow-400 hover:bg-secondary transall"
                        >
                          <Flag className="w-4 h-4 text-yellow-400/80 shrink-0" />
                          Laporkan
                        </button>
                      )}
                      {/* Hapus untuk saya — selalu ada, cuma ngaruh ke view sendiri */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onHideClick?.();
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-secondary transall"
                      >
                        <Trash className="w-4 h-4 text-text-secondary shrink-0" />
                        Hapus untuk saya
                      </button>
                      {/* Hapus untuk semua — cuma pemilik pesan / admin-owner */}
                      {(isMe || canDelete) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onDeleteClick?.();
                          }}
                          className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-secondary transall"
                        >
                          <Trash2 className="w-4 h-4 text-red-400/80 shrink-0" />
                          Hapus untuk semua
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
});

export default MessageBubbleMenu;
