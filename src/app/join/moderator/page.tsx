"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { loginModeratorWithGoogle, setAuthToken } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/Toast";

function JoinModeratorContent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const { toast } = useToast();
  
  const { user, token, setAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already logged in and has moderator system role
  useEffect(() => {
    if (isHydrated && user && token && !hasRedirected.current) {
      if (user.system_role === 'moderator' || user.system_role === 'super_admin') {
        hasRedirected.current = true;
        router.push("/chat");
      }
    }
  }, [isHydrated, user, token, router]);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("Kredensial Google tidak ditemukan");
      }

      if (!inviteToken) {
        throw new Error("Token undangan moderator tidak ditemukan di URL");
      }

      const response = await loginModeratorWithGoogle(
        credentialResponse.credential,
        inviteToken
      );

      if (response.success && response.data?.token) {
        setAuthToken(response.data.token);
        
        hasRedirected.current = true;
        setSuccess(true);
        toast("Akun Moderator berhasil diaktifkan! Menuju Panel Admin...", "success");

        // Set auth state
        setAuth(response.data.user, response.data.token);
        
        // Set cookie
        document.cookie = `supabase_jwt=${response.data.token}; path=/; max-age=604800; SameSite=Lax; Secure`;
        
        setTimeout(() => {
          router.push("/chat");
        }, 1500);
      } else {
        throw new Error(response.error || "Aktivasi moderator gagal");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal mengaktifkan akun moderator";
      setError(errorMessage);
      console.error(err);
    }
  };

  if (!inviteToken) {
    return (
      <div className="min-h-screen w-full flexcc p-4 bg-[#0A0E17]">
        <div className="w-full max-w-md p-8 md:p-10 rounded-3xl relative z-10 bg-secondary/40 backdrop-blur-xl border border-white/5 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flexcc mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Undangan Tidak Valid</h1>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Token undangan moderator tidak ditemukan di URL. Pastikan link undangan yang kamu gunakan sudah benar.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 w-full bg-elevated hover:bg-elevated/80 text-white rounded-xl font-bold transition-all"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flexcc p-4 bg-[#0A0E17]">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-125 bg-accent-default/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-6 md:p-10 rounded-3xl relative z-10 bg-secondary/40 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 rounded-3xl border border-accent-default/20 pointer-events-none" />

        <div className="flexcc gap-6 text-center">
          {success ? (
            <div className="py-6 flexcc flex-col gap-4 animate-bounce">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flexcc">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-white">Aktivasi Sukses!</h2>
              <p className="text-text-secondary text-sm">Menghubungkan ke server staff...</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-accent-default blur-2xl opacity-20" />
                <div className="w-24 h-24 bg-accent-default/10 rounded-full flexcc border border-accent-default/30">
                  <ShieldAlert className="w-12 h-12 text-accent-default drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-2">
                  Aktivasi <span className="text-accent-default">Moderator</span>
                </h1>
                <p className="text-text-secondary text-xs font-medium leading-relaxed max-w-64 mx-auto">
                  Silakan login menggunakan Google dengan email yang diundang untuk mengaktifkan akun moderator GokilChat kamu. 🛡️
                </p>
              </div>

              <div className="w-full h-px bg-linear-to-r from-transparent via-border-divider to-transparent" />

              {error && (
                <div className="text-red-400 text-xs font-medium bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20 w-full">
                  {error}
                </div>
              )}

              <div className="w-full flex justify-center py-2">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError("Aktivasi dibatalkan atau gagal")}
                  useOneTap
                  theme="outline"
                  shape="pill"
                />
              </div>

              <p className="text-[10px] text-text-muted mt-2">
                Hak akses moderator diatur penuh oleh peraturan keamanan GokilChat.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinModeratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flexcc p-4 bg-[#0A0E17]">
          {/* Loading */}
        </div>
      }
    >
      <JoinModeratorContent />
    </Suspense>
  );
}
