"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, User as UserIcon, Settings, MessageCircle } from "lucide-react";
import clsx from "clsx";

export default function ChatPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className={clsx("flex h-screen overflow-hidden", "bg-primary text-text-primary")}>
      {/* Sidebar Placeholder */}
      <aside className={clsx(
        "w-80 flex flex-col h-full border-r",
        "bg-secondary border-border-divider",
        "max-md:hidden"
      )}>
        <div className="p-6 border-b border-border-divider flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="text-accent-default" />
            GokilChat
          </h2>
          <Settings className="w-5 h-5 text-text-secondary cursor-pointer hover:text-text-primary transall" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Rooms</p>
          <div className="p-3 bg-elevated rounded-xl border border-accent-default/20 text-sm">
            # General
          </div>
          <div className="p-3 hover:bg-elevated/50 rounded-xl text-sm transall cursor-pointer text-text-secondary">
            # Random
          </div>
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-border-divider bg-elevated/30">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar_url} 
              alt={user.username} 
              className="w-10 h-10 rounded-full border border-accent-default/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
            <LogOut 
              className="w-5 h-5 text-text-secondary cursor-pointer hover:text-red-400 transall" 
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* Main Chat Area Placeholder */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-border-divider flex items-center px-6 bg-secondary/50 backdrop-blur-md">
          <h3 className="font-semibold"># General</h3>
        </header>

        <div className="flex-1 flexcc text-center p-10">
          <div className="w-20 h-20 bg-elevated rounded-full flexcc mb-4 border border-accent-default/20">
            <MessageCircle className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Selamat Datang di GokilChat!</h2>
          <p className="text-text-secondary max-w-md">
            Pilih ruangan di sebelah kiri untuk mulai ngobrol gokil sama temen-temen lu.
          </p>
        </div>
      </main>
    </div>
  );
}
