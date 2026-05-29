export type FontSizeOption = "small" | "medium" | "large";

export const FONT_SIZE_CONFIGS = {
  small: { mobile: "13px", desktop: "15px" },
  medium: { mobile: "14px", desktop: "16px" }, // Default
  large: { mobile: "16px", desktop: "18px" },
};

export const getStoredFontSize = (): FontSizeOption => {
  if (typeof window === "undefined") return "medium";
  return (localStorage.getItem("gokilchat-font-size") as FontSizeOption) || "medium";
};

export const applyFontSize = (size: FontSizeOption) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("gokilchat-font-size", size);

  const config = FONT_SIZE_CONFIGS[size] || FONT_SIZE_CONFIGS.medium;

  let styleEl = document.getElementById("gokilchat-root-font-size");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "gokilchat-root-font-size";
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    html { font-size: ${config.mobile} !important; }
    @media (min-width: 768px) {
      html { font-size: ${config.desktop} !important; }
    }
  `;
};
