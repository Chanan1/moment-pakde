"use client";

import { useState } from "react";
import Link from "next/link";
import {
  checkConfessStatus,
  deleteOwnConfess,
  type ConfessStatusResult,
} from "@/lib/actions/confess";

interface ConfessStatusCheckerProps {
  initialShortId?: string;
}

export function ConfessStatusChecker({
  initialShortId = "",
}: ConfessStatusCheckerProps) {
  const [shortId, setShortId] = useState(initialShortId);
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ConfessStatusResult | null>(null);
  const [deleted, setDeleted] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResult(null);
    setDeleted(false);

    if (!shortId.trim() || !secretCode.trim()) {
      setErrorMessage("Harap masukkan ID confess dan kode rahasia.");
      return;
    }

    try {
      setLoading(true);
      const res = await checkConfessStatus({
        shortId: shortId.trim(),
        secretCode: secretCode.trim(),
      });

      if (res.ok) {
        setResult(res.data);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memeriksa confess.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!result) return;
    const confirmDelete = window.confirm(
      "Yakin ingin menarik dan menghapus confess ini? Pesan akan langsung ditarik dari feed publik."
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const res = await deleteOwnConfess({
        shortId: result.shortId,
        secretCode: secretCode.trim(),
      });

      if (res.ok) {
        setDeleted(true);
        setResult(null);
      } else {
        alert(res.message);
      }
    } catch {
      alert("Gagal menghapus confess.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCheck}
        className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[var(--ink-secondary)] block mb-1">
              ID Confess
            </label>
            <input
              type="text"
              value={shortId}
              onChange={(e) => setShortId(e.target.value)}
              placeholder="Contoh: a8k2m9px"
              className="w-full px-4 py-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--ink)] font-mono placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink-secondary)] block mb-1">
              Kode Rahasia Penulis
            </label>
            <input
              type="text"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              placeholder="Contoh: K7Q2-MX9P"
              className="w-full px-4 py-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--ink)] font-mono uppercase tracking-wider placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Memeriksa..." : "Periksa Status Confess"}
        </button>
      </form>

      {/* Tampilan Konfirmasi Hapus Berhasil */}
      {deleted && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center space-y-2">
          <p className="font-bold text-sm">Confess Berhasil Ditarik & Dihapus</p>
          <p className="text-xs text-emerald-400/80">
            Pesan anonim kamu sudah tidak lagi ditampilkan di feed publik.
          </p>
        </div>
      )}

      {/* Hasil Pemeriksaan */}
      {result && (
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              #{result.shortId}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                result.status === "published"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : result.status === "pending"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {result.status === "published"
                ? "Sudah Terbit"
                : result.status === "pending"
                ? "Menunggu Tinjauan"
                : result.status === "hidden"
                ? "Disembunyikan"
                : "Telah Dihapus"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
            {result.body}
          </div>

          {result.status === "pending" && (
            <div className="p-3 text-xs rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Confess kamu perlu dicek dulu sebentar oleh moderator karena terdeteksi indikasi tautan atau kata khusus. Biasanya nggak lama kok!
            </div>
          )}

          {result.removalReason && (
            <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              Keterangan: {result.removalReason}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            {result.status === "published" && (
              <Link
                href={`/c/${result.shortId}`}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Lihat di Feed &rarr;
              </Link>
            )}

            {result.status !== "removed" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="ml-auto text-xs px-4 py-2.5 rounded-xl font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                Tarik / Hapus Confess
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
