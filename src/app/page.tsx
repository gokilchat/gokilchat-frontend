"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
import { loginWithGoogle, setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      setError("");
      
      const idToken = credentialResponse.credential;
      if (!idToken) throw new Error("Gagal mendapatkan ID token dari Google");

      const response = await loginWithGoogle(idToken);
      
      if (response.success && response.data?.token) {
        setAuthToken(response.data.token);
        setAuth(response.data.user, response.data.token);
        router.push("/chat");
      } else {
        throw new Error(response.error || "Login gagal dari server");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Terjadi kesalahan saat login");
      } else {
        setError("Terjadi kesalahan saat login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(
      "min-h-screen flexc p-4",
      "bg-primary"
    )}>
      <div className={clsx(
        "w-full max-w-md p-8 relative overflow-hidden",
        "bg-secondary border border-accent-subtle rounded-2xl shadow-2xl",
        "max-sm:p-6"
      )}>
        {/* Glow effect */}
        <div className={clsx(
          "w-48 h-48 absolute -top-24 -right-24 pointer-events-none",
          "bg-accent-default/20 rounded-full blur-3xl"
        )} />
        <div className={clsx(
          "w-48 h-48 absolute -bottom-24 -left-24 pointer-events-none",
          "bg-accent-default/20 rounded-full blur-3xl"
        )} />

        <div className="relative z-10 flexcc">
          <div className={clsx(
            "w-16 h-16 flexcc mb-6",
            "bg-accent-subtle border border-accent-default/30 rounded-2xl"
          )}>
            <MessageSquare className="w-8 h-8 text-text-on-accent" />
          </div>
          
          <h1 className={clsx("text-3xl font-bold mb-2", "text-text-primary")}>GokilChat</h1>
          <p className={clsx("text-center mb-10", "text-text-secondary")}>
            Sistem chat realtime terdistribusi untuk kolaborasi tanpa batas.
          </p>

          {error && (
            <div className={clsx(
              "w-full p-3 mb-6 text-sm text-center",
              "bg-red-900/30 border border-red-900/50 text-red-200 rounded-lg"
            )}>
              {error}
            </div>
          )}

          <div className="w-full flexc h-11 relative">
            {loading && (
              <div className={clsx(
                "absolute inset-0 flexc z-20",
                "bg-secondary rounded-md"
              )}>
                <div className="w-5 h-5 border-2 border-accent-default border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Login dibatalkan atau gagal")}
              useOneTap
              theme="outline"
              shape="rectangular"
              size="large"
              text="signin_with"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
