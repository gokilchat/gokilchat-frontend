import Image from "next/image";

export default function EmptyState() {
  return (
    <main className="flex-1 flexcc bg-primary relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('/images/chat-bg.png')] bg-fixed opacity-5" />
      <div className="relative text-center p-12">
        <div className="size-52 mx-auto mb-4 relative">
          <Image
            src="/images/logo-light.png"
            alt="logo"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">
          Selamat Datang di GokilChat!
        </h2>
        <p className="text-text-secondary text-base max-w-sm mx-auto leading-relaxed font-medium">
          Pilih ruangan di sebelah kiri buat mulai ngobrol gokil bareng
          temen-temen lu. Nggak ada temen? Ya nasib. 🗿
        </p>
      </div>
    </main>
  );
}
