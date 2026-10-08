# API — Moment Pakde

Mayoritas mutasi memakai **Next.js Server Actions** (`lib/actions/*`). Bacaan publik memakai Server Components yang query langsung ke Supabase. Route Handler (`app/api/*`) hanya untuk kebutuhan yang perlu URL, seperti infinite scroll dan gambar OG.

## Format Respons

Semua server action mengembalikan:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; message: string; fields?: Record<string, string> };

type ErrorCode =
  | "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION" | "RATE_LIMITED"
  | "CAPTCHA_FAILED" | "PII_DETECTED" | "BLOCKED" | "NOT_FOUND" | "INTERNAL";
```

## 1. Moment

### `requestUploadUrls`
| | |
|---|---|
| Auth | Login, tidak banned |
| Input | `{ files: { contentType: "image/webp" \| "image/jpeg" \| "image/png"; size: number }[] }` (1–5) |
| Output | `{ uploads: { path: string; signedUrl: string; token: string }[] }` |
| Rate limit | 20 permintaan / jam / user |

### `createMoment`
| | |
|---|---|
| Auth | Login |
| Input | lihat skema |
| Output | `{ id: string }` |

```ts
const CreateMoment = z.object({
  caption: z.string().max(2200).default(""),
  tags: z.array(z.string().regex(/^[a-z0-9_]{1,30}$/)).max(10).default([]),
  momentDate: z.coerce.date().max(new Date()),
  location: z.string().max(100).optional(),
  photos: z.array(z.object({
    path: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    blurhash: z.string().max(100),
    altText: z.string().max(300).optional(),
  })).min(1).max(5),
});
```

Server wajib memastikan setiap `path` diawali `moments/{userId}/` dan file benar-benar ada di storage.

### `updateMoment`
Input: `{ id, caption?, tags?, location?, momentDate? }`. Hanya pemilik.

### `deleteMoment`
Input: `{ id }`. Pemilik atau admin. Hapus file storage terkait.

### `toggleMomentReaction`
Input: `{ momentId, emoji }`. Jika emoji sama dengan reaksi sebelumnya → hapus; jika beda → ganti.
Output: `{ reaction: Emoji | null; count: number }`.

### `addComment` / `deleteComment`
- `addComment`: `{ momentId, body (1–500) }` → `{ id }`. Rate limit 30/jam.
- `deleteComment`: `{ id }`. Penulis komentar, pemilik moment, atau admin.

## 2. Confess

### `submitConfess`
| | |
|---|---|
| Auth | **Tidak ada.** Jangan baca session. |
| Rate limit | 3 / jam / `sender_hash`, 10 / hari |
| Output | `{ shortId: string; secretCode: string; status: "pending" \| "published" }` |

```ts
const SubmitConfess = z.object({
  body: z.string().trim().min(10).max(1000),
  recipient: z.string().trim().max(60).optional(),
  category: z.enum(["naksir", "terima_kasih", "curhat", "minta_maaf", "unek_unek", "lainnya"]),
  turnstileToken: z.string().min(1),
});
```

Urutan proses:
1. Jika `app_settings.confess_paused = true` → `FORBIDDEN` ("Confess sedang istirahat sebentar")
2. Verifikasi Turnstile → `CAPTCHA_FAILED`
3. Hitung `sender_hash` → cek `blocked_senders` → `BLOCKED`
4. Rate limit → `RATE_LIMITED`
5. Deteksi PII → `PII_DETECTED` (sertakan jenisnya: `phone` / `email` / `nik`), tidak ada yang disimpan
6. Jalankan filter lain dan isi `auto_flags`:
   - flag berat (`url`, `spam`, `selfharm`) → `status = 'pending'`
   - flag ringan (`profanity`, `mention`) atau tanpa flag → `status = 'published'`, `published_at = now()`
7. Buat `secretCode` acak 10 karakter, simpan hash-nya
8. `revalidateTag("confess-feed")` jika `published`

### `checkConfessStatus` (P1)
Input: `{ shortId, secretCode }` → `{ status, removalReason? }`

### `deleteOwnConfess` (P1)
Input: `{ shortId, secretCode }` → `{ ok }`. Mengubah status ke `removed`.

### `toggleConfessReaction`
Input: `{ confessionId, emoji, deviceId }`. Rate limit 60/jam per IP-hash.

### `submitConfessReply` (P1)
Sama seperti `submitConfess` tetapi `{ confessionId, body (1–500), turnstileToken }`. Balasan juga langsung tampil.

## 3. Laporan

### `reportContent`
| | |
|---|---|
| Auth | Opsional (pakai `user_id` jika login, `device_hash` jika tidak) |
| Input | `{ targetType, targetId, reason, note? }` |
| Rate limit | 10 / jam |

Jika laporan membuat konten auto-hide, kirim notifikasi ke admin (P1: webhook Telegram/email).

## 4. Profil

| Action | Input | Catatan |
|---|---|---|
| `updateProfile` | `{ username?, displayName?, bio? }` | Username unik, cek kata terlarang |
| `uploadAvatar` | file ≤ 2 MB | dikompres ke 256×256 |
| `deleteAccount` | `{ confirm: "HAPUS" }` | Hapus data + `auth.users` |

## 5. Admin

Semua action admin mengecek `profiles.role in ('admin','moderator')` dan menulis ke `moderation_logs`.

| Action | Input | Role |
|---|---|---|
| `listConfessionsForReview` | `{ tab: "perlu_dicek" \| "ditahan" \| "terbaru", cursor? }` | moderator |
| `moderateConfession` | `{ id, action: "review" \| "publish" \| "hide" \| "restore" \| "remove", reason? }` | moderator |
| `listReports` | `{ status, cursor? }` | moderator |
| `resolveReport` | `{ reportId, action: "dismiss" \| "hide" \| "remove" }` | moderator |
| `blockSender` | `{ confessionId, days? }` (ambil `sender_hash` dari confess) | moderator |
| `banUser` | `{ userId, reason }` | admin |
| `setRole` | `{ userId, role }` | admin |
| `updateSettings` | `{ autohideThreshold?, confessPaused?, wordlists? }` | admin |

## 6. Route Handlers

| Method & Path | Fungsi | Cache |
|---|---|---|
| `GET /api/feed/moments?cursor=` | 12 moment terbaru | `s-maxage=30` |
| `GET /api/feed/confessions?cursor=&category=` | 12 confess terbit | `s-maxage=30` |
| `GET /api/u/[username]/moments?cursor=` | Moment milik user | `s-maxage=60` |
| `GET /api/tag/[slug]?cursor=` | Moment per tag | `s-maxage=60` |
| `GET /api/og/moment/[id]` | Gambar OG 1200×630 | 1 hari |
| `GET /api/og/confess/[shortId]?format=story` | Kartu confess 1080×1920 untuk story | 1 hari |

Format cursor: base64 dari `"{created_at}|{id}"`.
