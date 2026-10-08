# AGENTS.md

Panduan untuk AI coding agent yang bekerja di repo ini.

## Sumber Kebenaran
Baca dokumen di `docs/` sebelum menulis kode. Jika kode dan dokumen bertentangan, tanyakan ke user, jangan menebak.

## Aturan Wajib

### Anonimitas confess (jangan dilanggar)
- Kode di jalur confess (`lib/actions/confess*.ts`, `app/(public)/confess/**`) **tidak boleh** memanggil `auth.getUser()`, `getSession()`, atau membaca cookie auth.
- Jangan pernah menambah kolom `user_id`, `ip`, `email`, atau `user_agent` mentah ke tabel `confessions`, `confession_reactions`, atau `confession_replies`.
- Jangan `console.log` request body atau header di jalur confess.
- Kolom `sender_hash` dan `secret_code_hash` tidak boleh dikirim ke klien. Selalu baca dari view `public_confessions`.

### Keamanan
- Setiap tabel baru wajib punya RLS aktif + kebijakan di migrasi yang sama.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di file `lib/supabase/admin.ts` dan hanya di-import dari kode server (`import "server-only"`).
- Semua input divalidasi Zod di server, walaupun sudah divalidasi di klien.
- Jangan render HTML dari input user.

### Konvensi Kode
- TypeScript strict. Hindari `any`.
- Server Components secara default; `"use client"` hanya jika perlu interaksi.
- Server Action mengembalikan `ActionResult<T>` (lihat `docs/API.md`), jangan throw ke klien.
- Nama file: `kebab-case.tsx`; komponen: `PascalCase`.
- Teks UI dalam Bahasa Indonesia, mengikuti microcopy di `docs/UI_UX.md`.
- Warna, font, dan radius dari design tokens; jangan hardcode hex di komponen.

### Database
- Perubahan skema hanya lewat file migrasi baru di `supabase/migrations/`. Jangan edit migrasi yang sudah ada.
- Perbarui `docs/DATABASE.md` jika skema berubah.

### Testing
- Fungsi di `lib/moderation/` wajib punya unit test.
- Kebijakan RLS baru wajib punya tes integrasi.
- Jalankan `pnpm lint && pnpm typecheck && pnpm test` sebelum menyatakan tugas selesai.

## Perintah

```bash
pnpm dev            # dev server
pnpm lint
pnpm typecheck
pnpm test           # vitest
pnpm test:e2e       # playwright
pnpm supabase migration new <nama>
pnpm supabase gen types typescript --local > lib/supabase/types.ts
```
