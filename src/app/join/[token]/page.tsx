"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Users, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";

export default function JoinGroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const router = useRouter();
  const { user } = useAuthStore();
  const { setActiveRoomId } = useChatStore();

  const [isHydrated, setIsHydrated] = useState(false);

  const [room, setRoom] = useState<import("@/types/chat").Room & { member_count?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      // Belum login, arahin ke home (login) terus abis login redirect ke sini
      // Untuk MVP, kita set local storage buat nangkep callback
      sessionStorage.setItem("redirect_after_login", `/join/${token}`);
      router.push("/");
      return;
    }

    // Fetch room preview
    apiFetch(`/rooms/invite/${token}`)
      .then((res) => {
        if (res.success) {
          setRoom(res.data);
        } else {
          setError(res.error || "Undangan tidak valid.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat info grup.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user, isHydrated, router]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await apiFetch("/rooms/join", {
        method: "POST",
        body: JSON.stringify({ invite_token: token }),
      });

      if (res.success) {
        // Gabung sukses, arahin ke chat dan set active room
        setActiveRoomId(res.data.room_id);
        router.push("/chat");
      } else {
        setError(res.error || "Gagal bergabung ke grup.");
        setIsJoining(false);
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem.");
      setIsJoining(false);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="h-screen w-full bg-primary flexcc">
        <div className="animate-pulse flexcc flex-col gap-4">
          <div className="w-20 h-20 bg-elevated rounded-full" />
          <div className="w-40 h-6 bg-elevated rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="h-screen w-full bg-primary flexcc p-6">
        <div className="w-full max-w-md bg-secondary border border-border-divider rounded-3xl p-8 flexcc flex-col text-center shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flexcc mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Waduh!</h2>
          <p className="text-text-secondary text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/chat")}
            className="px-6 py-3 bg-elevated hover:bg-elevated/80 text-white rounded-xl font-bold transall"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-primary flexcc p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-accent-default/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-secondary border border-border-divider rounded-4xl p-8 flexcc flex-col text-center shadow-2xl z-10"
      >
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-elevated overflow-hidden border border-border-divider/50 shadow-inner flexcc">
            {room.avatar_url ? (
              <Image
                src={room.avatar_url}
                alt={room.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-accent-default">
                {room.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-default text-white rounded-full flexcc shadow-lg border-2 border-secondary">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
          {room.name}
        </h1>

        <p className="text-sm font-medium text-text-muted mb-8 flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{room.member_count} Anggota</span>
        </p>

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full py-4 bg-accent-default hover:bg-accent-hover active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-accent-default/20 transall disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isJoining ? "Bergabung..." : "Gabung ke Grup"}
        </button>

        <button
          onClick={() => router.push("/chat")}
          className="w-full mt-4 py-3 text-text-muted hover:text-white font-bold rounded-xl transall text-sm"
        >
          Batal
        </button>
      </motion.div>
    </div>
  );
}
