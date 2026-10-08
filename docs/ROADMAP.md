# Roadmap — Moment Pakde

Estimasi untuk 1 developer full-stack. Sesuaikan dengan kapasitas tim.

```mermaid
flowchart LR
    F0["Fase 0: Setup (3 hari)"] --> F1["Fase 1: Moment (1,5 minggu)"]
    F1 --> F2["Fase 2: Confess (1 minggu)"]
    F2 --> F3["Fase 3: Moderasi & Polish (1 minggu)"]
    F3 --> L(["Rilis MVP"])
    L --> F4["Fase 4: Pasca-MVP (P1)"]
```

## Fase 0: Setup
- [x] Init Next.js 15 + TypeScript + Tailwind + design tokens
- [x] ESLint, Vitest unit test runner
- [x] Project Supabase, Supabase CLI, migrasi awal (profiles, citext, triggers)
- [x] Auth Google handler + callback route
- [x] Layout dasar, design tokens (--bg, --surface, --ink, --accent)

## Fase 1: Moment
- [x] Tabel `moments`, `moment_photos`, `tags`, `moment_tags` + RLS
- [x] Bucket storage `moments` & `avatars` + kebijakan akses
- [x] Halaman `/upload`: upload foto, kompresi, input caption, tag, tanggal momen
- [x] Server actions: `requestUploadUrls`, `createMoment`, `deleteMoment`
- [x] Feed moment dengan interaksi reaksi emoji & komentar
- [x] Detail moment `/m/[id]` + carousel foto + thread komentar

## Fase 2: Confess
- [x] Tabel `confessions`, `confession_reactions`, `blocked_senders`, `reports`, `app_settings` + view `public_confessions`
- [x] `lib/moderation`: filter PII (tolak), spam/link/selfharm (tahan), kata kasar/mention (flag) + unit test
- [x] Form `/confess/new` + konfirmasi auto-publish + banner sukses dengan secret code
- [x] Feed confess + tab switcher (Momen Bersama vs Confess Anonim)
- [x] Detail confess `/c/[shortId]`
- [x] Reaksi anonim (berbasis device ID hash)
- [x] Dialog & server action pelaporan konten (`reportContent`) + auto-hide trigger (≥ 3 laporan)
- [x] Saklar darurat `confess_paused` di database

## Fase 3: Moderasi & Polish
- [x] Tabel `moderation_logs` + RLS kebijakan admin
- [x] Dashboard `/admin`: metrik ringkasan, saklar darurat jeda confess di header
- [x] Moderasi Confess `/admin/confess`: tata letak 2 kolom, tab Perlu Dicek / Ditahan / Terbaru, pintasan keyboard (K, P, H, D, P), auto-advance, blokir pengirim
- [x] Pengelolaan Laporan `/admin/reports`: tab status (open, resolved, dismissed), aksi abaikan / sembunyikan / hapus target
- [x] Halaman `/aturan` dan `/privasi`
- [x] Halaman `/login` dan route handler callback OAuth
- [x] Verifikasi kode: 23 unit test lolos, tsc zero errors, eslint zero warnings

## Rilis MVP
- [ ] Domain + SSL
- [ ] Seed konten awal (10–20 moment dari tim) agar feed tidak kosong
- [ ] Tunjuk 2–3 moderator dengan jadwal cek minimal 2x sehari
- [ ] Soft launch ke 1–2 batch/grup MagangHub selama 1 minggu, lalu sebar ke seluruh komunitas

## Fase 4: Pasca-MVP (P1)
- [ ] Kode rahasia: cek status & hapus confess sendiri
- [ ] Balasan anonim di confess
- [ ] Kartu confess untuk story IG
- [ ] Pencarian
- [ ] Notifikasi in-app
- [ ] Tandai user di moment, lokasi
- [ ] Urutan "Populer minggu ini"
- [ ] Mode gelap
- [ ] Login magic link

## Nanti (P2)
- Album/koleksi, "Hari ini di tahun lalu", web push, deteksi NSFW otomatis.
