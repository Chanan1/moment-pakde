import Link from "next/link";
import { Camera, Send, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              Moment Pakde
            </h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Kumpulan momen & confess anak magang
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] transition-colors"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[var(--surface)] p-1 border border-[var(--line)] mb-6 shadow-xs">
          <button
            type="button"
            className="flex-1 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white shadow-xs text-center transition-all"
          >
            Momen Bersama
          </button>
          <button
            type="button"
            className="flex-1 py-2 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] text-center transition-all"
          >
            Confess Anonim
          </button>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/upload"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors group text-center shadow-xs"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[var(--accent)] mb-2 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">Bagikan Momen</span>
            <span className="text-xs text-[var(--ink-muted)] mt-0.5">
              Upload foto & cerita
            </span>
          </Link>

          <Link
            href="/confess/new"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors group text-center shadow-xs"
          >
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-2 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">Kirim Diam-diam</span>
            <span className="text-xs text-[var(--ink-muted)] mt-0.5">
              Curhat & confess anonim
            </span>
          </Link>
        </div>

        {/* Empty state feed */}
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)]/50">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Belum ada momen yang diunggah
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-xs mt-1 mb-4">
            Jadilah yang pertama mengabadikan keseruan magang hari ini bersama teman-teman!
          </p>
          <Link
            href="/upload"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            Bagikan Momen Pertama
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--ink-muted)]">
        <p>Dibuat untuk seru-seruan komunitas MagangHub.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/aturan" className="hover:underline">
            Aturan Komunitas
          </Link>
          <span>•</span>
          <Link href="/privasi" className="hover:underline">
            Kebijakan Privasi
          </Link>
        </div>
      </footer>
    </div>
  );
}
