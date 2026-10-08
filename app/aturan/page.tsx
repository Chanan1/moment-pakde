import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function AturanPage() {
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
          <h1 className="text-sm font-semibold">Aturan Komunitas</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Aturan Seru-seruan MagangHub</h2>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Moment Pakde dibuat agar anak-anak magang punya tempat santai untuk mendokumentasikan momen dan menyampaikan unek-unek secara aman.
          </p>
        </div>

        {/* Yang Boleh */}
        <section className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hal yang Boleh & Sangat Dianjurkan</span>
          </div>
          <ul className="text-xs text-emerald-900 space-y-2 leading-relaxed">
            <li>• Berbagi foto keseruan magang, makan siang bareng, lembur santai, atau farewell.</li>
            <li>• Confess naksir, terima kasih ke mentor/kakak senior, atau curhat dinamika magang.</li>
            <li>• Memberi reaksi emoji dan komentar positif yang saling menyemangati.</li>
          </ul>
        </section>

        {/* Yang Dilarang */}
        <section className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-rose-800">
            <XCircle className="w-4 h-4" />
            <span>Hal yang Dilarang (Akan Dihapus & Diblokir)</span>
          </div>
          <ul className="text-xs text-rose-900 space-y-2 leading-relaxed">
            <li>• <strong>Doxxing:</strong> Menyebut nama lengkap orang lain, nomor HP, alamat, akun medsos pribadi, atau menempelkan foto untuk mempermalukan.</li>
            <li>• <strong>Menjelekkan Mentor / Perusahaan:</strong> Menyebut nama instansi atau atasan dengan nada menghina/fitnah.</li>
            <li>• <strong>Dokumen Rahasia:</strong> Mengunggah foto yang memperlihatkan kode komputer rahasia, layar kerja, atau dokumen internal kantor.</li>
            <li>• <strong>Bullying & Ujaran Kebencian:</strong> Ancaman, penghinaan SARA, dan konten seksual/tidak pantas.</li>
            <li>• <strong>Spam & Judi:</strong> Tautan situs web, promosi produk komersial, pinjol, judi, atau loker palsu.</li>
          </ul>
        </section>

        <div className="text-[11px] text-[var(--ink-muted)] text-center pt-4">
          Konten yang dilaporkan oleh 3 orang akan disembunyikan otomatis oleh sistem untuk ditinjau admin.
        </div>
      </main>
    </div>
  );
}
