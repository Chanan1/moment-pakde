"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  moderateConfession,
  blockSender,
  type AdminConfessionItem,
} from "@/lib/actions/admin";

interface ConfessModeratorProps {
  initialItems: AdminConfessionItem[];
  activeTab: "perlu_dicek" | "ditahan" | "terbaru";
  perluDicekCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  naksir: "Naksir",
  terima_kasih: "Terima Kasih",
  curhat: "Curhat",
  minta_maaf: "Minta Maaf",
  unek_unek: "Unek-unek",
  lainnya: "Lainnya",
};

export function ConfessModerator({
  initialItems,
  activeTab,
  perluDicekCount,
}: ConfessModeratorProps) {
  const [items, setItems] = useState<AdminConfessionItem[]>(initialItems);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("Spam atau pelanggaran berulang");
  const [blockDays, setBlockDays] = useState<number>(30);


  const currentItem = items[selectedIndex] ?? null;

  const advanceToNext = useCallback((currentLength: number, index: number) => {
    if (currentLength <= 1) {
      setSelectedIndex(0);
    } else if (index >= currentLength - 1) {
      setSelectedIndex(currentLength - 2);
    } else {
      setSelectedIndex(index);
    }
  }, []);

  const handleAction = useCallback(
    async (
      action: "review" | "publish" | "hide" | "restore" | "remove",
      reason?: string
    ) => {
      if (!currentItem || actionLoading) return;

      try {
        setActionLoading(true);
        const res = await moderateConfession({
          id: currentItem.id,
          action,
          reason,
        });

        if (res.ok) {
          // Hapus item dari daftar jika berada di tab perlu_dicek atau ditahan
          const nextItems = items.filter((it) => it.id !== currentItem.id);
          advanceToNext(items.length, selectedIndex);
          setItems(nextItems);
        } else {
          alert(`Gagal memproses aksi: ${res.message}`);
        }
      } catch {
        alert("Terjadi kesalahan saat menghubungi server.");
      } finally {
        setActionLoading(false);
      }
    },
    [currentItem, actionLoading, items, selectedIndex, advanceToNext]
  );

  const handleBlockConfirm = async () => {
    if (!currentItem || actionLoading) return;

    try {
      setActionLoading(true);
      const res = await blockSender({
        confessionId: currentItem.id,
        days: blockDays,
        reason: blockReason,
      });

      if (res.ok) {
        setShowBlockModal(false);
        const nextItems = items.filter((it) => it.id !== currentItem.id);
        advanceToNext(items.length, selectedIndex);
        setItems(nextItems);
      } else {
        alert(`Gagal memblokir pengirim: ${res.message}`);
      }
    } catch {
      alert("Terjadi kesalahan saat memproses pemblokiran.");
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard shortcut listener (K, P, H, D, ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika fokus di input / textarea / modal terbuka
      const target = e.target as HTMLElement | null;
      if (
        showBlockModal ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "arrowdown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (key === "arrowup") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (key === "k" && activeTab !== "ditahan") {
        e.preventDefault();
        handleAction("review");
      } else if (key === "p" && activeTab === "ditahan") {
        e.preventDefault();
        handleAction("publish");
      } else if (key === "h") {
        e.preventDefault();
        handleAction("hide");
      } else if (key === "d") {
        e.preventDefault();
        handleAction("remove");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, activeTab, handleAction, showBlockModal]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Link
          href="/admin/confess?tab=perlu_dicek"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "perlu_dicek"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <span>Perlu Dicek</span>
          {perluDicekCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "perlu_dicek"
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {perluDicekCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/confess?tab=ditahan"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeTab === "ditahan"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Ditahan
        </Link>

        <Link
          href="/admin/confess?tab=terbaru"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeTab === "terbaru"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Terbaru
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      {items.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
          <div className="text-3xl">🎉</div>
          <h2 className="text-lg font-bold text-[var(--ink)]">
            Aman terkendali. Nggak ada yang perlu dicek.
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
            Semua kiriman confess dalam antrean ini sudah diproses atau belum ada kiriman baru yang terdeteksi mencurigakan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Daftar Ringkas */}
          <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const timeAgo = new Date(item.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-[var(--surface)] border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]"
                      : "bg-[var(--surface)]/60 border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--ink-muted)]/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="font-semibold text-[var(--ink-secondary)]">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="text-[var(--ink-muted)]">{timeAgo}</span>
                  </div>

                  <p className="text-sm text-[var(--ink)] line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    {item.report_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/20">
                        🚩 {item.report_count} Laporan
                      </span>
                    )}

                    {item.auto_flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20"
                      >
                        ⚠️ {flag}
                      </span>
                    ))}

                    <span className="ml-auto font-mono text-[11px] text-[var(--ink-muted)]">
                      #{item.short_id}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Pratinjau Penuh & Aksi */}
          {currentItem && (
            <div className="lg:col-span-7 sticky top-24 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)]">
                    {CATEGORY_LABELS[currentItem.category] ?? currentItem.category}
                  </span>
                  {currentItem.recipient && (
                    <span className="ml-2 text-xs text-[var(--ink-secondary)]">
                      Untuk: <strong>@{currentItem.recipient}</strong>
                    </span>
                  )}
                </div>

                <div className="text-right text-xs text-[var(--ink-muted)]">
                  <span>Kode: #{currentItem.short_id}</span>
                  <div className="text-[11px]">
                    {new Date(currentItem.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Status & Flags Badge Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    currentItem.status === "published"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : currentItem.status === "pending"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  Status: {currentItem.status}
                </span>

                {currentItem.report_count > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                    {currentItem.report_count} Laporan Pengguna
                  </span>
                )}

                {currentItem.auto_flags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20"
                  >
                    Flag Sistem: {flag}
                  </span>
                ))}
              </div>

              {/* Isi Confess Lengkap */}
              <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-base text-[var(--ink)] leading-relaxed whitespace-pre-wrap font-sans">
                {currentItem.body}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {activeTab === "ditahan" ? (
                  /* Di tab ditahan: Terbitkan (P) */
                  <button
                    type="button"
                    onClick={() => handleAction("publish")}
                    disabled={actionLoading}
                    className="flex-1 min-w-[120px] px-4 py-3 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    title="Terbitkan confess ini (P)"
                  >
                    <span>Terbitkan</span>
                    <kbd className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">P</kbd>
                  </button>
                ) : (
                  /* Di tab lain: Biarkan (K) */
                  <button
                    type="button"
                    onClick={() => handleAction("review")}
                    disabled={actionLoading}
                    className="flex-1 min-w-[120px] px-4 py-3 rounded-2xl font-bold bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--ink)] border border-[var(--border)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    title="Tandai aman dan biarkan terbit (K)"
                  >
                    <span>Biarkan</span>
                    <kbd className="text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded font-mono">K</kbd>
                  </button>
                )}

                {/* Sembunyikan (H) */}
                <button
                  type="button"
                  onClick={() => handleAction("hide")}
                  disabled={actionLoading}
                  className="flex-1 min-w-[120px] px-4 py-3 rounded-2xl font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  title="Sembunyikan dari feed publik (H)"
                >
                  <span>Sembunyikan</span>
                  <kbd className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">H</kbd>
                </button>

                {/* Hapus (D) */}
                <button
                  type="button"
                  onClick={() => handleAction("remove")}
                  disabled={actionLoading}
                  className="flex-1 min-w-[100px] px-4 py-3 rounded-2xl font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  title="Hapus permanen status removed (D)"
                >
                  <span>Hapus</span>
                  <kbd className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded font-mono">D</kbd>
                </button>

                {/* Blokir Pengirim */}
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors text-xs disabled:opacity-50"
                  title="Blokir perangkat pengirim"
                >
                  Blokir Pengirim
                </button>
              </div>

              {/* Petunjuk Pintasan */}
              <div className="text-[11px] text-[var(--ink-muted)] text-center">
                Pintasan keyboard: <span className="font-mono">K</span> Biarkan &bull;{" "}
                <span className="font-mono">P</span> Terbitkan &bull;{" "}
                <span className="font-mono">H</span> Sembunyikan &bull;{" "}
                <span className="font-mono">D</span> Hapus &bull;{" "}
                <span className="font-mono">&uarr;&darr;</span> Navigasi
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Blokir Pengirim */}
      {showBlockModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--ink)]">
              Blokir Pengirim Confess #{currentItem?.short_id}
            </h3>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Perangkat pengirim ini (berdasarkan hash terlindungi) tidak akan dapat mengirim confess baru selama masa blokir.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--ink-secondary)] block mb-1">
                  Durasi Pemblokiran
                </label>
                <select
                  value={blockDays}
                  onChange={(e) => setBlockDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--ink)]"
                >
                  <option value={7}>7 Hari</option>
                  <option value={30}>30 Hari</option>
                  <option value={90}>90 Hari</option>
                  <option value={365}>1 Tahun</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink-secondary)] block mb-1">
                  Alasan Blokir
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Contoh: Spam berulang, pelecehan"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--ink)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBlockConfirm}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi Blokir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
