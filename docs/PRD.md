# PRD — Moment Pakde

| | |
|---|---|
| **Versi** | 0.1 (draft) |
| **Tanggal** | 8 Oktober 2026 |
| **Status** | Menunggu review |
| **Pemilik** | _(isi nama)_ |

---

## 1. Ringkasan

**Moment Pakde** adalah website seru-seruan untuk **komunitas MagangHub**: anak magang, alumni magang, dan siapa pun yang mampir. Di sini orang bisa:

1. **Berbagi momen**: upload foto, caption, tag, dan tanggal momen (hari pertama magang, makan siang bareng, lembur, farewell, dll.). Orang lain bisa kasih reaksi dan komentar.
2. **Confess anonim**: menulis pengakuan, curhat, atau pesan untuk seseorang tanpa identitas penulis ditampilkan ke publik. Confess **langsung tampil** begitu dikirim.

Tujuannya jadi "papan kenangan" anak magang yang santai, akrab, dan tetap aman.

**Akses:** terbuka untuk semua orang. Siapa pun bisa melihat feed tanpa login; upload moment dan komentar butuh login; confess dan reaksi confess tidak butuh login.

## 2. Masalah

- Foto momen magang tercecer di grup WhatsApp per divisi/batch, story 24 jam, dan galeri pribadi. Setelah periode magang selesai, susah dicari lagi.
- Anak magang punya hal yang ingin disampaikan (terima kasih ke mentor, naksir sesama intern, curhat deadline, unek-unek) tapi sungkan kalau ketahuan namanya.
- Akun confess di Instagram/X bergantung pada admin yang repost manual, lambat, dan tidak ada moderasi yang konsisten.

## 3. Tujuan & Non-Tujuan

### Tujuan (MVP)
- User bisa upload momen (1–5 foto + caption) dalam waktu kurang dari 1 menit.
- Siapa pun bisa mengirim confess anonim tanpa login, dan confess langsung muncul di feed.
- Admin bisa memoderasi konten (moment & confess) dari satu dashboard.
- Website mobile-first; mayoritas pengguna diasumsikan dari HP.

### Non-Tujuan (belum di MVP)
- Chat / DM antar user.
- Video dan story.
- Aplikasi native Android/iOS (cukup PWA).
- Monetisasi / iklan.
- Fitur lowongan magang atau integrasi dengan sistem MagangHub resmi.
- Membuka identitas penulis confess ke siapa pun, termasuk admin, melalui UI.

## 4. Target Pengguna

| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Si Dokumenter** | Anak magang yang rajin foto di kantor, acara divisi, atau nongkrong bareng batch | Upload cepat, foto tampil bagus, bisa ditandai tanggal & tag (mis. `#batch3`, `#farewell`) |
| **Si Pemalu** | Punya unek-unek soal magang atau naksir sesama intern, tapi tidak mau ketahuan | Kirim confess tanpa login, langsung tampil, yakin identitasnya aman |
| **Si Penonton** | Jarang posting, sering scroll buat hiburan di sela kerja | Feed enak dibaca, bisa reaksi tanpa ribet |
| **Alumni Magang** | Sudah selesai magang, mampir untuk nostalgia | Bisa cari momen lama per tag/tanggal |
| **Admin / Pakde** | Pengelola komunitas | Menurunkan konten jahat, spam, dan doxxing dengan cepat setelah tampil |

## 5. Fitur

Prioritas: **P0** = wajib di MVP, **P1** = setelah MVP, **P2** = nanti.

### 5.1 Akun & Autentikasi
| ID | Fitur | Prioritas |
|---|---|---|
| AUTH-1 | Login dengan Google | P0 |
| AUTH-2 | Login dengan magic link email | P1 |
| AUTH-3 | Profil: nama tampilan, username, foto profil, bio singkat | P0 |
| AUTH-4 | Hapus akun beserta semua momen milik user | P0 |

### 5.2 Moment (Foto + Caption)
| ID | Fitur | Prioritas |
|---|---|---|
| MOM-1 | Upload 1–5 foto per moment (JPG/PNG/WEBP/HEIC, maks. 10 MB per foto) | P0 |
| MOM-2 | Caption maks. 2.200 karakter, mendukung emoji dan baris baru | P0 |
| MOM-3 | Tag/hashtag (maks. 10) | P0 |
| MOM-4 | Tanggal momen (default hari ini, bisa diubah ke masa lalu) | P0 |
| MOM-5 | Lokasi teks bebas (opsional, mis. "Pantry lantai 7", "Kantin kantor") | P1 |
| MOM-6 | Tandai user lain di moment | P1 |
| MOM-7 | Edit caption/tag; hapus moment | P0 |
| MOM-8 | Reaksi emoji (❤️ 😂 😭 🔥 🙏), satu reaksi per user per moment | P0 |
| MOM-9 | Komentar (maks. 500 karakter), hapus komentar sendiri | P0 |
| MOM-10 | Album / koleksi (mis. "Batch 3 – Farewell") | P2 |
| MOM-11 | "Hari ini di tahun lalu", menampilkan momen dengan tanggal yang sama | P2 |

### 5.3 Confess Anonim
| ID | Fitur | Prioritas |
|---|---|---|
| CON-1 | Kirim confess tanpa login | P0 |
| CON-2 | Isi teks 10–1.000 karakter | P0 |
| CON-3 | Field "Untuk" opsional (mis. "Untuk: intern divisi marketing yang suka bawa tumbler hijau") | P0 |
| CON-4 | Kategori: Naksir, Terima Kasih, Curhat, Minta Maaf, Unek-unek, Lainnya | P0 |
| CON-5 | Captcha (Cloudflare Turnstile) + rate limit | P0 |
| CON-6 | Filter otomatis: data pribadi (nomor HP, email, NIK) **ditolak** di form; link & kata kunci judi/promosi **ditahan**; kata kasar & `@username` **di-flag** untuk dicek admin | P0 |
| CON-7 | Confess yang lolos filter **langsung tampil** di feed (auto-publish) | P0 |
| CON-8 | Reaksi emoji pada confess (tanpa login, dibatasi per perangkat) | P0 |
| CON-9 | Balasan anonim pada confess | P1 |
| CON-10 | Kode rahasia untuk penulis: hapus confess sendiri dan cek status jika ditahan | P1 |
| CON-11 | Bagikan confess sebagai gambar (kartu siap story IG) | P1 |

### 5.4 Feed & Penemuan
| ID | Fitur | Prioritas |
|---|---|---|
| FEED-1 | Beranda: tab **Moment** dan **Confess** | P0 |
| FEED-2 | Urutan terbaru, infinite scroll | P0 |
| FEED-3 | Halaman detail moment & confess dengan URL yang bisa dibagikan | P0 |
| FEED-4 | Halaman profil user (grid momen) | P0 |
| FEED-5 | Halaman tag (`/tag/farewell`) | P0 |
| FEED-6 | Pencarian caption, tag, dan isi confess | P1 |
| FEED-7 | Urutan "Populer minggu ini" | P1 |

### 5.5 Keamanan & Moderasi
| ID | Fitur | Prioritas |
|---|---|---|
| MOD-1 | Tombol laporkan untuk moment, komentar, dan confess | P0 |
| MOD-2 | Konten dengan ≥ 3 laporan otomatis disembunyikan sampai ditinjau | P0 |
| MOD-3 | Dashboard admin: daftar confess perlu dicek, confess ditahan, laporan; aksi sembunyikan/hapus/terbitkan | P0 |
| MOD-4 | Ban user (login) & blokir perangkat/IP-hash (anonim) | P0 |
| MOD-5 | Log aksi admin | P1 |
| MOD-6 | Deteksi gambar NSFW otomatis | P2 |

Detail kebijakan: lihat [MODERATION.md](./MODERATION.md).

### 5.6 Notifikasi
| ID | Fitur | Prioritas |
|---|---|---|
| NOT-1 | Notifikasi in-app: ada reaksi, komentar, atau tag di moment saya | P1 |
| NOT-2 | Web push notification | P2 |

## 6. User Story & Acceptance Criteria (P0)

### US-1 — Upload moment
> Sebagai user yang sudah login, saya ingin upload beberapa foto dengan caption agar momen tersimpan dan bisa dilihat teman.

- [ ] Tombol "+" selalu terlihat di navigasi bawah (mobile) / header (desktop).
- [ ] Bisa memilih 1–5 foto; urutan bisa diubah dengan drag sebelum upload.
- [ ] Foto dikompres di browser ke maks. 2048px sisi terpanjang sebelum dikirim.
- [ ] Metadata EXIF (termasuk GPS) dihapus.
- [ ] Ada progress bar; jika gagal, ada tombol coba lagi tanpa kehilangan caption.
- [ ] Setelah berhasil, user diarahkan ke halaman detail moment.

### US-2 — Kirim confess anonim
> Sebagai pengunjung, saya ingin mengirim confess tanpa login agar bisa menyampaikan perasaan tanpa ketahuan.

- [ ] Form bisa diakses dari `/confess/new` tanpa login.
- [ ] Tidak ada nama, email, atau user ID yang disimpan bersama confess, walaupun pengirim sedang login.
- [ ] Captcha wajib lolos sebelum kirim.
- [ ] Maks. 3 confess per perangkat per jam.
- [ ] Jika terdeteksi nomor HP/email/NIK, user diperingatkan dan confess tidak bisa dikirim sampai data tersebut dihapus.
- [ ] Confess tanpa tanda spam (link, kata kunci judi/promosi) **langsung tampil** di feed, dan user diarahkan ke halaman detail confess-nya.
- [ ] Confess dengan tanda spam ditahan sebagai `pending`, dan user melihat pesan "Confess kamu perlu dicek dulu sebentar".
- [ ] Setelah kirim, tampil kode rahasia untuk menghapus confess sendiri (P1).

### US-3 — Reaksi & komentar
- [ ] Reaksi tampil instan (optimistic update), angka diperbarui.
- [ ] Tap reaksi yang sama sekali lagi untuk membatalkan.
- [ ] Komentar butuh login; confess reaction tidak.

### US-4 — Moderasi
> Sebagai admin, saya ingin cepat menurunkan confess bermasalah yang sudah tampil.

- [ ] `/admin` hanya bisa diakses user dengan role `admin` atau `moderator`.
- [ ] Tab **Perlu Dicek**: confess yang sudah tampil tapi punya flag otomatis (kata kasar, `@username`) atau ada laporan, diurutkan dari yang paling banyak dilaporkan.
- [ ] Tab **Ditahan**: confess `pending` karena tanda spam.
- [ ] Tab **Terbaru**: semua confess yang baru tampil, untuk dipantau sekilas.
- [ ] Aksi: Biarkan (tandai sudah dicek), Sembunyikan, Hapus, Terbitkan (untuk yang ditahan), Blokir pengirim.
- [ ] Shortcut keyboard: `K` biarkan, `H` sembunyikan, `D` hapus, `J`/`↓` berikutnya.
- [ ] Admin mendapat notifikasi (email/Telegram, P1) saat ada konten yang auto-hide karena laporan.

### US-5 — Laporkan konten
- [ ] Pilihan alasan: Spam, Kasar/Bullying, Menyebut identitas orang/perusahaan, Konten seksual, Lainnya.
- [ ] Satu pelapor hanya bisa melapor satu kali per konten.
- [ ] Konten yang sudah dilaporkan ≥ 3 kali otomatis disembunyikan dari feed.

## 7. Kebutuhan Non-Fungsional

| Area | Target |
|---|---|
| Performa | LCP < 2,5 detik di 4G; halaman feed < 200 KB JS |
| Gambar | Disajikan dalam WebP/AVIF lewat CDN, ukuran responsif |
| Ketersediaan | 99,5% / bulan |
| Privasi | Confess tidak menyimpan IP mentah; hanya hash ber-salt yang dirotasi tiap 30 hari |
| Keamanan | Row Level Security di semua tabel; upload divalidasi tipe & ukuran di server |
| Aksesibilitas | WCAG 2.1 AA; semua foto wajib punya alt text (default dari caption) |
| Bahasa | Bahasa Indonesia (UI), siap i18n |
| Perangkat | Mobile-first, mendukung Chrome/Safari/Firefox 2 versi terakhir |

## 8. Metrik Keberhasilan (3 bulan setelah rilis)

| Metrik | Target |
|---|---|
| User terdaftar | 500 |
| Moment diupload / minggu | 100 |
| Confess dikirim / minggu | 200 |
| Persentase confess yang diturunkan (hidden/removed) | < 5% |
| Waktu rata-rata dari laporan sampai ditindak admin | < 6 jam |
| Retensi minggu ke-4 | ≥ 25% |

## 9. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Confess langsung tampil lalu dipakai untuk bullying/doxxing | Tinggi | Filter PII menolak di form, spam ditahan otomatis, auto-hide setelah 3 laporan, notifikasi laporan ke admin, blokir pengirim |
| Confess menjelekkan mentor/perusahaan tempat magang dengan nama jelas | Tinggi | Aturan komunitas melarang menyebut nama orang/perusahaan secara negatif; laporan dengan alasan "Menyebut identitas" |
| Spam bot | Sedang | Turnstile, rate limit, hash perangkat |
| Foto tidak pantas atau berisi dokumen internal kantor | Tinggi | Laporan + auto-hide, peringatan di form upload, deteksi NSFW (P2) |
| Biaya storage membengkak | Sedang | Kompresi di klien, batas 5 foto, kuota per user |
| User takut identitas confess bocor | Tinggi | Jelaskan di halaman privasi apa yang disimpan & tidak |
| Dikira situs resmi MagangHub | Sedang | Footer & halaman tentang: "Komunitas independen, bukan layanan resmi MagangHub" (sesuaikan bila memang resmi) |

## 10. Keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Komunitas | MagangHub, untuk seru-seruan |
| 2 | Akses | Terbuka untuk semua orang |
| 3 | Mode confess | Langsung tampil (auto-publish) + filter otomatis + laporan |

### Pertanyaan Terbuka
1. Apakah Moment Pakde dikelola resmi oleh MagangHub, atau komunitas independen? (berpengaruh ke penggunaan nama/logo)
2. Apakah butuh domain khusus? (mis. `momentpakde.id`)
3. Siapa saja yang jadi admin/moderator di awal?

## 11. Dokumen Terkait

- [TECH_SPEC.md](./TECH_SPEC.md): arsitektur & stack
- [DATABASE.md](./DATABASE.md): skema database
- [API.md](./API.md): endpoint & server actions
- [UI_UX.md](./UI_UX.md): halaman, alur, dan design system
- [MODERATION.md](./MODERATION.md): kebijakan konten & privasi confess
- [ROADMAP.md](./ROADMAP.md): fase pengerjaan
