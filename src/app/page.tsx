"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { loginWithGoogle, setAuthToken } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import AppealModal from "@/app/chat/_components/modals/AppealModal";

function LoginPageContent() {
  const [error, setError] = useState<string | null>(null);
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
  const [appealUserId, setAppealUserId] = useState<string | null>(null);
  const [appealStatus, setAppealStatus] = useState<
    "suspended" | "banned" | null
  >(null);
  const [punishmentReason, setPunishmentReason] = useState<string>("");
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const { user, token, setAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      const handleErr = async () => {
        setError(decodeURIComponent(err));
        // Remove query param from url to avoid showing on refresh
        router.replace("/");
      };
      handleErr();
    }
  }, [searchParams, router]);

  // Hanya handle kasus: user SUDAH login saat hydration (misal refresh di halaman login)
  useEffect(() => {
    if (isHydrated && user && token && !hasRedirected.current) {
      hasRedirected.current = true;
      document.cookie = `supabase_jwt=${token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      const redirect =
        redirectParam || sessionStorage.getItem("redirect_after_login");
      if (redirect) {
        sessionStorage.removeItem("redirect_after_login");
        router.push(redirect);
      } else {
        router.push("/chat");
      }
    }
  }, [isHydrated, user, token, router, redirectParam]);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError("Kredensial Google tidak ditemukan");
        return;
      }

      const response = await loginWithGoogle(credentialResponse.credential);

      if (response.success && response.data?.token) {
        setAuthToken(response.data.token);

        // Baca redirect SEBELUM setAuth agar useEffect tidak race condition
        const redirect =
          redirectParam || sessionStorage.getItem("redirect_after_login");
        if (sessionStorage.getItem("redirect_after_login")) {
          sessionStorage.removeItem("redirect_after_login");
        }

        // Tandai bahwa redirect sudah di-handle di sini
        hasRedirected.current = true;

        // Set auth state (ini trigger useEffect, tapi hasRedirected sudah true)
        setAuth(response.data.user, response.data.token);

        // Set cookie
        document.cookie = `supabase_jwt=${response.data.token}; path=/; max-age=604800; SameSite=Lax; Secure`;

        // Redirect ke tujuan
        router.push(redirect || "/chat");
      } else {
        setError(response.error || "Login gagal dari server");
        if (response.status === "suspended" || response.status === "banned") {
          setGoogleIdToken(credentialResponse.credential || null);
          setAppealUserId(response.userId || null);
          setAppealStatus(response.status || null);
          setPunishmentReason(response.reason || "");
        } else {
          setGoogleIdToken(null);
          setAppealUserId(null);
          setAppealStatus(null);
          setPunishmentReason("");
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal masuk dengan Google";
      setError(errorMessage);
      console.warn("Auth warning:", err);
    }
  };

  if (isHydrated && user && token) {
    return null;
  }

  return (
    <div className={clsx("min-h-screen w-full flexcc p-4", "bg-primary")}>
      <div
        className={clsx(
          "w-full max-w-md p-6 md:p-10 rounded-3xl relative z-10",
          "bg-secondary/40 backdrop-blur-xl border border-white/5",
          "shadow-2xl shadow-black/50",
        )}
      >
        {/* Accent Border Glow */}
        <div className="absolute inset-0 rounded-3xl border border-accent-default/20 pointer-events-none" />

        <div className="flexcc gap-6 text-center">
          <div className="relative">
            <Image
              src="/images/logo-light.png"
              alt="GokilChat Logo"
              width={120}
              height={120}
              className="relative"
              priority
            />
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
              Gokil<span className="text-accent-default">Chat</span>
            </h1>
            <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-60 mx-auto">
              Ngobrol gokil, tanpa batas, <br />
              desain premium buat lu yang gokil. 🗿
            </p>
          </div>

          <div className="w-full mt-4 h-px bg-linear-to-r from-transparent via-border-divider to-transparent" />

          {error && (
            <div className="flex flex-col gap-3 w-full">
              <div className="text-red-400 text-xs font-medium bg-red-400/10 py-3 px-4 rounded-lg border border-red-400/20 w-full text-center">
                <div>{error}</div>
                {!googleIdToken &&
                  (error.includes("ditangguhkan") ||
                    error.includes("Suspended") ||
                    error.includes("banned") ||
                    error.includes("dibanned")) && (
                    <div className="mt-2 text-[10px] text-red-400/60 font-normal">
                      Silakan klik &apos;Login dengan Google&apos; kembali di
                      bawah untuk memverifikasi akun Anda dan menampilkan tombol
                      banding.
                    </div>
                  )}
              </div>
              {appealUserId && googleIdToken && (
                <button
                  type="button"
                  onClick={() => setIsAppealOpen(true)}
                  className="w-full py-2.5 px-4 bg-accent-default/10 hover:bg-accent-default/20 text-text-secondary border border-accent-default/25 rounded-xl text-xs font-bold transition-all duration-150 active:scale-98 cursor-pointer text-center"
                >
                  Ajukan Banding 🗿
                </button>
              )}
            </div>
          )}

          <div className="w-full flex justify-center py-2">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Login dibatalkan atau gagal")}
              useOneTap
              theme="outline"
              shape="pill"
            />
          </div>

          <p className="text-[10px] text-text-muted mt-4">
            Dengan masuk, lu setuju buat jadi{" "}
            <span className="text-text-secondary">anak gokil</span> selamanya.
          </p>
        </div>
      </div>

      {isAppealOpen && googleIdToken && appealUserId && appealStatus && (
        <AppealModal
          isOpen={isAppealOpen}
          onClose={() => setIsAppealOpen(false)}
          googleIdToken={googleIdToken}
          status={appealStatus}
          punishmentReason={punishmentReason}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flexcc p-4 bg-primary">
          {/* Loading minimal */}
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
