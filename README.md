# Moment Pakde

Website seru-seruan komunitas **MagangHub** untuk **berbagi momen** (foto + caption) dan **confess anonim** yang langsung tampil. Terbuka untuk semua orang.

## Dokumen

| File | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Kebutuhan produk, fitur, user story, metrik |
| [docs/TECH_SPEC.md](docs/TECH_SPEC.md) | Stack, arsitektur, alur teknis, keamanan |
| [docs/DATABASE.md](docs/DATABASE.md) | Skema tabel, ERD, RLS, storage |
| [docs/API.md](docs/API.md) | Server actions & route API |
| [docs/UI_UX.md](docs/UI_UX.md) | Halaman, wireframe, design tokens, microcopy |
| [docs/MODERATION.md](docs/MODERATION.md) | Aturan komunitas, moderasi, privasi confess |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fase pengerjaan & checklist |
| [AGENTS.md](AGENTS.md) | Panduan untuk AI coding agent |

## Stack

Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Cloudflare Turnstile · Upstash Redis · Vercel

## Menjalankan Lokal

```bash
pnpm install
cp .env.example .env.local   # isi variabel, lihat docs/TECH_SPEC.md §6
pnpm supabase start
pnpm supabase db reset       # jalankan migrasi + seed
pnpm dev
```

Buka http://localhost:3000
