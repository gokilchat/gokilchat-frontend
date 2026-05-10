"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { loginWithGoogle, setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError("");
      
      const idToken = credentialResponse.credential;
      if (!idToken) throw new Error("Gagal mendapatkan ID token dari Google");

      const response = await loginWithGoogle(idToken);
      
      if (response.success && response.data?.token) {
        setAuthToken(response.data.token);
        router.push("/chat");
      } else {
        throw new Error(response.error || "Login gagal dari server");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-secondary border border-accent-subtle rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-default/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-default/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-accent-subtle rounded-2xl flex items-center justify-center mb-6 border border-accent-default/30">
            <MessageSquare className="w-8 h-8 text-text-on-accent" />
          </div>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">GokilChat</h1>
          <p className="text-text-secondary text-center mb-10">
            Sistem chat realtime terdistribusi untuk kolaborasi tanpa batas.
          </p>

          {error && (
            <div className="w-full bg-red-900/30 border border-red-900/50 text-red-200 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <div className="w-full flex justify-center h-11 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary z-20 rounded-md">
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
