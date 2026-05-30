import { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  User as UserIcon,
  Shield,
  Loader2,
  Check,
  Bell,
} from "lucide-react";
import { apiFetch, CHAT_SERVER_URL } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import clsx from "clsx";
import ImageCropModal from "@/components/ImageCropModal";
import {
  getStoredFontSize,
  applyFontSize,
  FontSizeOption,
} from "@/lib/font-size";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, setAuth, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "privacy">("profile");
  const [fontSize, setFontSize] = useState<FontSizeOption>("medium");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [privacy, setPrivacy] = useState<"anyone" | "confirmation_required">(
    "anyone",
  );

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setFontSize(getStoredFontSize());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFontSizeChange = (size: FontSizeOption) => {
    setFontSize(size);
    applyFontSize(size);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const res = await apiFetch(`/users/${user.id}`);
        if (res.success && res.data) {
          setUsername(res.data.username || "");
          setFullName(res.data.full_name || "");
          setPrivacy(res.data.settings?.group_invite_privacy || "anyone");
        }
      } catch (err: unknown) {
        setMessage({
          text: err instanceof Error ? err.message : "Gagal memuat profil",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ username, full_name: fullName }),
      });
      if (res.success) {
        showMessage("Profil berhasil diperbarui", "success");
        setAuth(
          {
            ...user,
            username: res.data.username,
            full_name: res.data.full_name,
          },
          token as string,
        );
      }
    } catch (err: unknown) {
      showMessage(
        err instanceof Error ? err.message : "Gagal menyimpan profil",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async (
    newPrivacy: "anyone" | "confirmation_required",
  ) => {
    if (!user) return;
    setPrivacy(newPrivacy);
    try {
      const res = await apiFetch(`/users/${user.id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ group_invite_privacy: newPrivacy }),
      });
      if (res.success) {
        showMessage("Privasi berhasil diperbarui", "success");
      }
    } catch (err: unknown) {
      showMessage(
        err instanceof Error ? err.message : "Gagal menyimpan privasi",
        "error",
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Maksimal ukuran file 5MB", "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setShowCropModal(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", croppedBlob, "avatar.jpg");

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(
        `${CHAT_SERVER_URL}/users/${user.id}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");

      if (data.success) {
        showMessage("Foto profil berhasil diupdate", "success");
        setAuth({ ...user, avatar_url: data.data.avatar_url }, token as string);
      }
    } catch (err: unknown) {
      showMessage(
        err instanceof Error ? err.message : "Gagal upload foto profil",
        "error",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flexcc bg-black/60 backdrop-blur-sm md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-primary border border-border-divider md:rounded-3xl w-full h-full md:h-auto md:max-w-md overflow-hidden shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-divider bg-secondary/50">
          <h2 className="text-xl font-black text-white tracking-tight">
            Pengaturan
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 text-text-muted hover:text-white bg-elevated hover:bg-border-divider rounded-full transall"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={clsx(
              "px-4 py-2 text-xs font-bold text-center",
              message.type === "success"
                ? "bg-status-online text-white"
                : "bg-red-500 text-white",
            )}
          >
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="flexcc p-20">
            <Loader2 className="w-8 h-8 text-accent-default animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-border-divider">
              <button
                onClick={() => setActiveTab("profile")}
                className={clsx(
                  "cursor-pointer flex-1 py-3 text-sm font-bold flexcc gap-2 transall border-b-2",
                  activeTab === "profile"
                    ? "border-accent-default text-accent-default bg-accent-default/5"
                    : "border-transparent text-text-secondary hover:text-white hover:bg-elevated/50",
                )}
              >
                <UserIcon className="w-4 h-4" /> Profil
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={clsx(
                  "cursor-pointer flex-1 py-3 text-sm font-bold flexcc gap-2 transall border-b-2",
                  activeTab === "privacy"
                    ? "border-accent-default text-accent-default bg-accent-default/5"
                    : "border-transparent text-text-secondary hover:text-white hover:bg-elevated/50",
                )}
              >
                <Shield className="w-4 h-4" /> Privasi
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {activeTab === "profile" ? (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flexcc flex-col gap-3">
                    <div className="relative group">
                      <div className="size-24 rounded-full bg-elevated flexcc border-2 border-border-divider overflow-hidden shadow-inner relative">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="font-black text-accent-default text-3xl">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flexcc">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 p-2 bg-accent-default text-white rounded-full border-2 border-primary shadow-lg hover:scale-110 transall cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-text-muted">
                      JPG, PNG, GIF, max 5MB
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama asli lu..."
                        className="w-full bg-secondary border border-border-divider rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username_gokil"
                        className="w-full bg-secondary border border-border-divider rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-default transall"
                      />
                    </div>

                    {/* Font Size Settings */}
                    <div className="space-y-2 pt-4 border-t border-border-divider/50">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1 flex items-center gap-1.5">
                        Ukuran Teks (Local)
                      </label>
                      <div className="flex gap-2 bg-secondary p-1 rounded-2xl border border-border-divider">
                        {(["small", "medium", "large"] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleFontSizeChange(sz)}
                            className={clsx(
                              "cursor-pointer flex-1 py-2 text-xs font-bold rounded-xl transall capitalize",
                              fontSize === sz
                                ? "bg-accent-default text-white shadow-md"
                                : "text-text-secondary hover:text-white hover:bg-elevated/40",
                            )}
                          >
                            {sz === "small"
                              ? "Kecil"
                              : sz === "medium"
                                ? "Sedang"
                                : "Besar"}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted pl-1 leading-relaxed">
                        Mengubah ukuran teks seluruh aplikasi secara langsung
                        (hanya di perangkat ini).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={
                      isSaving || (!username.trim() && !fullName.trim())
                    }
                    className="cursor-pointer w-full py-3 bg-accent-default hover:bg-accent-hover text-white rounded-xl font-bold flexcc gap-2 transall disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Simpan Profil
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">
                        Undangan Grup
                      </h3>
                      <p className="text-xs text-text-muted mb-4 leading-relaxed">
                        Pilih siapa aja yang bisa langsung masukin lu ke grup
                        atau ngirim link undangan.
                      </p>
                    </div>

                    <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transall group hover:bg-secondary/50 border-border-divider">
                      <div>
                        <p className="text-sm font-bold text-text-primary group-hover:text-white transall">
                          Langsung Masuk (Anyone)
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Siapa aja bisa narik lu ke grup.
                        </p>
                      </div>
                      <div
                        className={clsx(
                          "w-5 h-5 rounded-full border-[1.5px] flexcc transall",
                          privacy === "anyone"
                            ? "border-accent-default bg-accent-default"
                            : "border-text-muted bg-transparent",
                        )}
                      >
                        {privacy === "anyone" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="privacy"
                        value="anyone"
                        checked={privacy === "anyone"}
                        onChange={() => handleSavePrivacy("anyone")}
                        className="hidden"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transall group hover:bg-secondary/50 border-border-divider">
                      <div>
                        <p className="text-sm font-bold text-text-primary group-hover:text-white transall">
                          Butuh Konfirmasi
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Lu bakal dapet DM undangan dulu buat di-acc.
                        </p>
                      </div>
                      <div
                        className={clsx(
                          "w-5 h-5 rounded-full border-[1.5px] flexcc transall",
                          privacy === "confirmation_required"
                            ? "border-accent-default bg-accent-default"
                            : "border-text-muted bg-transparent",
                        )}
                      >
                        {privacy === "confirmation_required" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="privacy"
                        value="confirmation_required"
                        checked={privacy === "confirmation_required"}
                        onChange={() =>
                          handleSavePrivacy("confirmation_required")
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {typeof window !== "undefined" &&
                    "Notification" in window &&
                    Notification.permission !== "granted" && (
                      <NotificationPermissionSection
                        showMessage={showMessage}
                      />
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {cropImageSrc && (
        <ImageCropModal
          isOpen={showCropModal}
          imageSrc={cropImageSrc}
          onClose={() => {
            setShowCropModal(false);
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }}
          onCropComplete={async (croppedBlob) => {
            setShowCropModal(false);
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
            await uploadCroppedImage(croppedBlob);
          }}
        />
      )}
    </div>
  );
}

function NotificationPermissionSection({
  showMessage,
}: {
  showMessage: (text: string, type: "success" | "error") => void;
}) {
  const [isGranted, setIsGranted] = useState(false);

  if (isGranted) return null;

  return (
    <div className="mt-8 space-y-4 pt-6 border-t border-border-divider">
      <div>
        <h3 className="text-sm font-bold text-white mb-1">
          Notifikasi Mobile & Desktop
        </h3>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Izinkan notifikasi buat dapetin update chat terbaru pas aplikasi
          di-minimize.
        </p>
      </div>
      <button
        onClick={() => {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              showMessage("Notifikasi diizinkan!", "success");
              setIsGranted(true);
            } else {
              showMessage("Notifikasi ditolak.", "error");
            }
          });
        }}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent-default/10 text-accent-default hover:bg-accent-default/20 font-bold rounded-xl transall cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        Nyalain Notifikasi
      </button>
    </div>
  );
}
