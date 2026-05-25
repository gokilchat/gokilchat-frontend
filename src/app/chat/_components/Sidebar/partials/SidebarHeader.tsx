import { Edit } from "lucide-react";
import Image from "next/image";

interface SidebarHeaderProps {
  onCreateRoom: () => void;
}

export default function SidebarHeader({ onCreateRoom }: SidebarHeaderProps) {
  return (
    <div className="h-16 px-3.5 flex items-center justify-between border-b border-border-divider bg-secondary/50 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <Image
          src="/images/logo-light.png"
          alt="Lion"
          width={40}
          height={40}
          className="drop-shadow-lg"
        />
        <span className="text-xl font-black text-white tracking-tighter">
          GokilChat
        </span>
      </div>
      <button
        onClick={onCreateRoom}
        className="size-8.5 cursor-pointer rounded-full bg-elevated border border-border-divider flexcc hover:border-accent-default transall text-text-secondary hover:text-accent-default"
      >
        <Edit className="w-4 h-4" />
      </button>
    </div>
  );
}
