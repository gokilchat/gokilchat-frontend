# Progress Log

## Fitur Selesai
- Setup repository frontend (Next.js) & backend (Express)
- Setup database schema & Supabase RLS (via SQL manual)
- Setup Google OAuth keys di GCP & Supabase
- **Backend:** Endpoint `/auth/google` (verifikasi token Google, sync `auth.users` ke `public.users`, generate custom JWT)
- **Frontend:** Halaman login (`/`) dengan desain dark-mode warm sesuai spec, tombol GoogleLogin bawaan `@react-oauth/google`, fungsi api fetch terintegrasi.

- Setup Chat Shell (Halaman `/chat` dengan desain premium)
- Integrasi real-time Socket.io (Message send/receive, room join)
- Persistensi Pesan (Database binding, message history fetch)
- Sistem Presence On-Demand (Status Online/Offline hemat resource via polling)
- UI/UX Polishing (Circular avatars, premium online indicator with cut-out, auto-scroll fix)
- Privacy & Data Flow (Perbaikan kebocoran data DM room, injeksi `full_name` dari database ke socket payload)
- Telegram-style Messaging UX (Teks nama asli pengirim di dalam gelembung pesan)
- Micro-interactions & Polish (Chat skeleton loading, resizer tipis tapi lebar hitbox-nya, custom scrollbar gemoy 16px, efek gradient fade di dasar list chat, dan perampingan tombol Header DM)

## Fitur Selanjutnya (Pending)
- [ ] Group Chat functionality
- [ ] Image/File sharing
- [ ] Message status (Read receipts)
- [ ] User settings (Privacy, profile update)
