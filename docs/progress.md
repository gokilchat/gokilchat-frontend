# Progress Log

## Fitur Selesai
- Setup repository frontend (Next.js) & backend (Express)
- Setup database schema & Supabase RLS (via SQL manual)
- Setup Google OAuth keys di GCP & Supabase
- **Backend:** Endpoint `/auth/google` (verifikasi token Google, sync `auth.users` ke `public.users`, generate custom JWT)
- **Frontend:** Halaman login (`/`) dengan desain dark-mode warm sesuai spec, tombol GoogleLogin bawaan `@react-oauth/google`, fungsi api fetch terintegrasi.

## Fitur Selanjutnya (Pending)
- [ ] Setup Chat Shell (Halaman `/chat` kosong)
- [ ] Integrasi real-time Socket.io di frontend
- [ ] Fitur load profil (GET `/auth/me`) setelah redirect ke `/chat`
