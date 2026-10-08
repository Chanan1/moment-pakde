"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Send, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { submitConfess } from "@/lib/actions/confess";
import { CONFESS_CATEGORIES, ConfessCategory } from "@/lib/validation/confess";

const CATEGORY_LABELS: Record<ConfessCategory, string> = {
  naksir: "Naksir",
  terima_kasih: "Terima Kasih",
  curhat: "Curhat",
  minta_maaf: "Minta Maaf",
  unek_unek: "Unek-unek",
  lainnya: "Lainnya",
};

export default function NewConfessPage() {
  const [category, setCategory] = useState<ConfessCategory>("curhat");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [turnstileToken] = useState("bypass-dev-token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    shortId: string;
    secretCode: string;
    status: "pending" | "published";
  } | null>(null);

  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 10) {
      setErrorMessage("Confess minimal 10 karakter ya");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitConfess({
        category,
        recipient: recipient.trim() || undefined,
        body: body.trim(),
        turnstileToken,
      });

      if (!res.ok) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessData(res.data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim confess"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCode() {
    if (!successData?.secretCode) return;
    navigator.clipboard.writeText(successData.secretCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <h1 className="text-sm font-semibold">Tulis Confess</h1>
          <Link
            href="/confess/manage"
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            Cek Kode
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Layar Sukses */}
        {successData ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-5 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                {successData.status === "published"
                  ? "Confess Kamu Sudah Tayang! 🤫"
                  : "Confess Kamu Sedang Dicek Sebentar"}
              </h2>
              <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-sm mx-auto">
                {successData.status === "published"
                  ? "Pesanmu sudah langsung muncul di papan feed komunitas anak magang."
                  : "Karena mengandung link atau kata khusus, tim admin akan memastikan kontenmu aman sebelum tampil."}
              </p>
            </div>

            {/* Kode Rahasia */}
            <div className="p-4 rounded-xl bg-stone-50 border border-[var(--line)] space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--ink)]">Kode Rahasiamu:</span>
                <span className="text-[11px] text-[var(--ink-muted)]">Simpan kode ini</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[var(--line)] font-mono text-sm tracking-wider font-bold">
                <span>{successData.secretCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                Kode ini bisa kamu gunakan jika di kemudian hari ingin menghapus confess ini sendiri.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/c/${successData.shortId}`}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
              >
                Lihat Kartu Confess
              </Link>
              <Link
                href="/"
                className="w-full py-2.5 rounded-xl font-medium text-xs border border-[var(--line)] bg-[var(--surface)] hover:bg-stone-50 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* Formulir Confess */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Jaminan Anonimitas */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">100% Bebas Identitas</p>
                <p className="text-amber-800 text-[11px]">
                  Nama, email, atau akunmu tidak pernah disimpan. Confess langsung tampil di feed begitu dikirim.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pilihan Kategori */}
            <div>
              <label className="block text-xs font-semibold mb-2">Pilih Kategori</label>
              <div className="flex flex-wrap gap-2">
                {CONFESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      category === cat
                        ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                        : "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Untuk (Opsional) */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Untuk Siapa? (Opsional)
              </label>
              <input
                type="text"
                value={recipient}
                maxLength={60}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Mis. intern IT yang suka bawa tumbler hijau"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              />
            </div>

            {/* Isi Confess */}
            <div>
              <label className="block text-xs font-semibold mb-1">Isi Confess</label>
              <div className="relative">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Tulis yang selama ini kamu pendam..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all resize-none"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-[var(--ink-muted)]">
                  {body.length}/1000
                </span>
              </div>
            </div>

            {/* Pengingat Anti-Doxxing */}
            <div className="text-[11px] text-[var(--ink-muted)] leading-relaxed space-y-1">
              <p className="font-semibold text-[var(--ink)]">🔒 Aturan Kenyamanan Bersama:</p>
              <p>• Dilarang menyebutkan nama lengkap, nomor telepon, alamat, atau akun medsos pribadi.</p>
              <p>• Dilarang menjelek-jelekkan nama kantor magang atau mentor dengan maksud menghina.</p>
            </div>

            {/* Tombol Kirim */}
            <button
              type="submit"
              disabled={isSubmitting || body.trim().length < 10}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Mengirimkan..." : "Kirim Diam-diam"}</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
