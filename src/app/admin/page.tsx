"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import AdminPanel from "../chat/_components/AdminPanel";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => setIsHydrated(true);
    hydrate();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isHydrated) return;
      
      if (!user) {
        router.push("/");
        return;
      }

      if (user.system_role === "super_admin" || user.system_role === "moderator") {
        setIsAuthorized(true);
      } else {
        router.push("/chat");
      }
    };
    checkAuth();
  }, [user, isHydrated, router]);

  if (!isHydrated || !isAuthorized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary">
        <Loader2 className="w-8 h-8 text-accent-default animate-spin" />
      </div>
    );
  }

  return <AdminPanel user={user} logout={logout} />;
}
