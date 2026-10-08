import Link from "next/link";
import { getAdminOverview } from "@/lib/actions/admin";

export default async function AdminDashboardPage() {
  const result = await getAdminOverview();

  const stats = result.ok
    ? result.data
    : {
        perluDicekCount: 0,
        ditahanCount: 0,
        openReportsCount: 0,
        totalConfessionsCount: 0,
        confessPaused: false,
      };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          Ringkasan Moderasi
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] mt-1">
          Pantau kesehatan konten, confess yang mencurigakan, dan laporan dari komunitas MagangHub.
        </p>
      </div>

      {/* Warning banner if paused */}
      {stats.confessPaused && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div>
              <p className="font-semibold text-sm">Saklar Jeda Confess Sedang Aktif</p>
              <p className="text-xs text-red-400/80">
                Pengguna saat ini tidak dapat mengirimkan confess baru.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20">
            Darurat
          </span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Perlu Dicek */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Perlu Dicek
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                stats.perluDicekCount > 0 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[var(--ink)]">
              {stats.perluDicekCount}
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">
              Confess ber-flag atau dilaporkan yang belum ditinjau
            </p>
          </div>
          <Link
            href="/admin/confess?tab=perlu_dicek"
            className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            Tinjau Sekarang &rarr;
          </Link>
        </div>

        {/* Card 2: Ditahan */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Ditahan (Pending)
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                stats.ditahanCount > 0 ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[var(--ink)]">
              {stats.ditahanCount}
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">
              Tersaring filter berat (tautan / spam / self-harm)
            </p>
          </div>
          <Link
            href="/admin/confess?tab=ditahan"
            className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            Lihat Yang Ditahan &rarr;
          </Link>
        </div>

        {/* Card 3: Laporan Masuk */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Laporan Terbuka
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                stats.openReportsCount > 0 ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[var(--ink)]">
              {stats.openReportsCount}
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">
              Laporan pengguna yang menunggu tindak lanjut
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            Kelola Laporan &rarr;
          </Link>
        </div>

        {/* Card 4: Total Confess */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Total Confess
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[var(--ink)]">
              {stats.totalConfessionsCount}
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">
              Pesan anonim yang pernah dikirimkan komunitas
            </p>
          </div>
          <Link
            href="/admin/confess?tab=terbaru"
            className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            Lihat Semua Confess &rarr;
          </Link>
        </div>
      </div>

      {/* Guidelines & Quick Moderation Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <h2 className="text-base font-bold text-[var(--ink)]">
            Panduan Moderasi Confess
          </h2>
          <ul className="text-xs text-[var(--ink-secondary)] space-y-2 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Prinsip Utama:</strong> Confess langsung terbit secara default agar interaktif. Kita hanya menyaring hal-hal yang berbahaya atau merugikan.
            </li>
            <li>
              <strong>Tindakan Biarkan (K):</strong> Tekan &quot;Biarkan&quot; jika isi pesan masih dalam batas wajar candaan/curhat anak magang, meski ada kata kasar ringan.
            </li>
            <li>
              <strong>Tindakan Sembunyikan (H):</strong> Gunakan jika isi pesan memicu kegaduhan atau dilaporkan banyak pengguna, namun belum tentu perlu diblokir permanen.
            </li>
            <li>
              <strong>Tindakan Hapus (D):</strong> Gunakan untuk konten doxxing, pelecehan, pencemaran nama baik mentor/instansi, atau spam komersial.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <h2 className="text-base font-bold text-[var(--ink)]">
            Pintasan Keyboard di Halaman Confess
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-secondary)]">Biarkan / Setujui</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono font-bold text-[var(--ink)]">
                K
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-secondary)]">Terbitkan (Ditahan)</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono font-bold text-[var(--ink)]">
                P
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-secondary)]">Sembunyikan</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono font-bold text-[var(--ink)]">
                H
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-secondary)]">Hapus Konten</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono font-bold text-[var(--ink)]">
                D
              </kbd>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Setelah memilih aksi, sistem akan secara otomatis melompat ke confess berikutnya dalam daftar.
          </p>
        </div>
      </div>
    </div>
  );
}
