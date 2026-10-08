import Link from "next/link";
import { ArrowLeft, ShieldCheck, EyeOff, Lock } from "lucide-react";

export default function PrivasiPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <h1 className="text-sm font-semibold">Kebijakan Privasi</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Transparansi Privasi & Anonimitas</h2>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Kami menganggap serius privasi kamu, terutama pada jalur Confess Anonim. Berikut penjelasan jujur mengenai apa yang disimpan dan tidak disimpan.
          </p>
        </div>

        {/* Yang Tidak Disimpan */}
        <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <EyeOff className="w-4 h-4 text-emerald-600" />
            <span>Yang TIDAK Pernah Disimpan di Jalur Confess</span>
          </div>
          <ul className="text-xs text-[var(--ink-muted)] space-y-2 leading-relaxed">
            <li>• <strong>Identitas Akun:</strong> Walaupun kamu sedang login saat mengirim confess, sistem kami secara mutlak tidak menautkan ID akunmu ke confess tersebut.</li>
            <li>• <strong>Alamat IP Mentah:</strong> Kami tidak menyimpan alamat IP asli kamu di basis data.</li>
          </ul>
        </div>

        {/* Yang Disimpan */}
        <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Yang Disimpan di Basis Data</span>
          </div>
          <ul className="text-xs text-[var(--ink-muted)] space-y-2 leading-relaxed">
            <li>• Isi teks confess, kategori, dan waktu pengiriman.</li>
            <li>• <strong>Hash Acak (HMAC) Pengirim:</strong> Kode acak yang dienkripsi dengan salt bulanan hanya untuk mendeteksi spam/bot dan memblokir perangkat yang melanggar aturan. Hash ini dirotasi setiap 30 hari.</li>
            <li>• <strong>Hash Kode Rahasia:</strong> Digunakan agar kamu dapat menghapus pesanmu sendiri di masa mendatang.</li>
          </ul>
        </div>

        {/* Pengingat untuk Pengguna */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Catatan untuk Penulis Confess</span>
          </div>
          <p className="leading-relaxed">
            Gaya bahasa atau lelucon internal yang terlalu spesifik bisa membuat teman magangmu menebak siapa penulisnya. Harap berhati-hati dalam menuliskan detail yang terlalu khas jika kamu ingin tetap anonim sepenuhnya.
          </p>
        </div>
      </main>
    </div>
  );
}
