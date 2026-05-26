"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  ReactNode,
  CSSProperties,
} from "react";
import { createPortal } from "react-dom";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface TooltipProps {
  /** Content yang ditampilkan di dalam tooltip */
  content: string;
  /** Elemen yang di-trigger */
  children: ReactNode;
  /** Posisi preferensi. Tooltip akan flip otomatis kalau kepotong layar. */
  placement?: "top" | "bottom" | "left" | "right";
  /** Delay sebelum tooltip muncul (ms) */
  delay?: number;
  /** Class tambahan untuk override styling */
  className?: string;
  /** Class tambahan untuk trigger span */
  triggerClassName?: string;
}

/**
 * Tooltip premium dengan:
 * - Portal render (tidak pernah ketutupan oleh parent overflow/stacking)
 * - Smart flip (kalau top kepotong → otomatis pakai bottom, dst.)
 * - z-index z-9998 (di bawah Toast, di atas semua modal/sidebar)
 * - Gap 8px dari elemen agar tidak overlap
 */
export default function Tooltip({
  content,
  children,
  placement = "top",
  delay = 400,
  className = "",
  triggerClassName = "inline-flex",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const GAP = 8;
    const VIEWPORT_MARGIN = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Estimasi ukuran tooltip — kita pakai approx, nanti adjust setelah render
    const tooltipEl = tooltipRef.current;
    const tw = tooltipEl?.offsetWidth || 160;
    const th = tooltipEl?.offsetHeight || 32;

    // Center positions
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let finalPlacement = placement;

    // Cek apakah placement pilihan muat, kalau tidak flip
    const fits = {
      top: rect.top - th - GAP >= VIEWPORT_MARGIN,
      bottom: rect.bottom + th + GAP <= vh - VIEWPORT_MARGIN,
      left: rect.left - tw - GAP >= VIEWPORT_MARGIN,
      right: rect.right + tw + GAP <= vw - VIEWPORT_MARGIN,
    };

    if (!fits[placement]) {
      // Cari alternatif — urutan prioritas flip
      const opposites: Record<string, string> = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      };
      const opp = opposites[placement] as keyof typeof fits;
      if (fits[opp]) {
        finalPlacement = opp;
      } else {
        // Cari yang muat apapun
        const fallback = (Object.keys(fits) as (keyof typeof fits)[]).find(
          (k) => fits[k]
        );
        if (fallback) finalPlacement = fallback;
      }
    }

    setActualPlacement(finalPlacement);

    const style: CSSProperties = { position: "fixed" };

    switch (finalPlacement) {
      case "top":
        style.bottom = vh - rect.top + GAP;
        style.left = Math.min(
          Math.max(centerX - tw / 2, VIEWPORT_MARGIN),
          vw - tw - VIEWPORT_MARGIN
        );
        break;
      case "bottom":
        style.top = rect.bottom + GAP;
        style.left = Math.min(
          Math.max(centerX - tw / 2, VIEWPORT_MARGIN),
          vw - tw - VIEWPORT_MARGIN
        );
        break;
      case "left":
        style.right = vw - rect.left + GAP;
        style.top = Math.min(
          Math.max(centerY - th / 2, VIEWPORT_MARGIN),
          vh - th - VIEWPORT_MARGIN
        );
        break;
      case "right":
        style.left = rect.right + GAP;
        style.top = Math.min(
          Math.max(centerY - th / 2, VIEWPORT_MARGIN),
          vh - th - VIEWPORT_MARGIN
        );
        break;
    }

    setPos(style);
  }, [placement]);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setIsPositioned(false);
  }, []);

  // Hitung posisi secara synchronous sebelum browser menggambar (paint)
  useIsomorphicLayoutEffect(() => {
    if (!visible) return;
    computePosition();
    setIsPositioned(true);
  }, [visible, content, computePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!visible) return;
    const update = () => computePosition();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [visible, computePosition]);

  // Arrow style inline — lebih reliable dari CSS border trick di Tailwind v4
  const ARROW_SIZE = 5;
  const BORDER_COLOR = "#3d2a18";
  const arrowStyle: Record<string, React.CSSProperties> = {
    top: {
      bottom: -ARROW_SIZE,
      left: "50%",
      transform: "translateX(-50%)",
      borderLeft: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid transparent`,
      borderTop: `${ARROW_SIZE}px solid ${BORDER_COLOR}`,
    },
    bottom: {
      top: -ARROW_SIZE,
      left: "50%",
      transform: "translateX(-50%)",
      borderLeft: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid ${BORDER_COLOR}`,
    },
    left: {
      right: -ARROW_SIZE,
      top: "50%",
      transform: "translateY(-50%)",
      borderTop: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid transparent`,
      borderLeft: `${ARROW_SIZE}px solid ${BORDER_COLOR}`,
    },
    right: {
      left: -ARROW_SIZE,
      top: "50%",
      transform: "translateY(-50%)",
      borderTop: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid ${BORDER_COLOR}`,
    },
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={triggerClassName}
      >
        {children}
      </span>

      {mounted &&
        visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              ...pos,
              visibility: isPositioned ? "visible" : "hidden",
            }}
            // z-9998: di atas semua modal (z-50~z-60), di bawah Toast (z-9999)
            className={[
              "fixed z-9998 pointer-events-none select-none",
              "px-2.5 py-1.5 rounded-xl",
              "bg-elevated border border-border-divider",
              "text-xs font-semibold text-text-primary",
              "shadow-xl backdrop-blur-sm whitespace-nowrap",
              "transition duration-150 ease-in-out",
              visible && isPositioned ? "opacity-100 scale-100" : "opacity-0 scale-95",
              className,
            ].join(" ")}
            role="tooltip"
          >
            {content}
            {/* Arrow — inline style biar tidak bergantung Tailwind border-trick */}
            <span
              style={{
                position: "absolute",
                width: 0,
                height: 0,
                ...arrowStyle[actualPlacement],
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
