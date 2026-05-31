"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import AdminPanel from "../chat/_components/AdminPanel";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, setAuth, logout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => setIsHydrated(true);
    hydrate();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isHydrated) return;
      
      if (!user || !token) {
        router.push("/");
        return;
      }

      try {
        // Fetch fresh profile from server to check for demotion, suspension, or ban
        const res = await apiFetch("/auth/me");
        if (res.success && res.data) {
          const freshUser = res.data;
          
          // Update client-side session store with latest data from DB
          setAuth(freshUser, token);

          if (freshUser.status === "suspended" || freshUser.status === "banned") {
            logout();
            router.push(`/?error=${encodeURIComponent(
              freshUser.status === "banned"
                ? "Akun Anda telah dibanned permanen 🗿"
                : "Akun Anda ditangguhkan (Suspended) 🗿"
            )}`);
            return;
          }

          if (freshUser.system_role === "super_admin" || freshUser.system_role === "moderator") {
            setIsAuthorized(true);
          } else {
            // User was demoted, push them out of admin panel to regular chat area
            router.push("/chat");
          }
        } else {
          logout();
          router.push("/");
        }
      } catch {
        // In case token is invalid, expired, or server rejects it, kick user to login
        logout();
        router.push("/");
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, router]);

  if (!isHydrated || !isAuthorized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary">
        <Loader2 className="w-8 h-8 text-accent-default animate-spin" />
      </div>
    );
  }

  return <AdminPanel user={user} logout={logout} />;
}
