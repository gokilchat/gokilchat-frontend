import { Search } from "lucide-react";

export default function SidebarSearch() {
  return (
    <div className="p-4">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-accent-default transall" />
        <input
          type="text"
          placeholder="Cari obrolan..."
          className="w-full bg-elevated/50 border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-primary focus:outline-none focus:border-accent-default/50 transall placeholder:text-text-muted/50"
        />
      </div>
    </div>
  );
}
