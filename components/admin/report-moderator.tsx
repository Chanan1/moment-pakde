"use client";

import { useState } from "react";
import Link from "next/link";
import { resolveReport, type AdminReportItem } from "@/lib/actions/admin";

interface ReportModeratorProps {
  initialItems: AdminReportItem[];
  activeStatus: "open" | "resolved" | "dismissed";
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  bullying: "Perundungan",
  doxxing: "Sebar Data Pribadi",
  company: "Menjelekkan Mentor/Perusahaan",
  sexual: "Konten Asusila",
  other: "Lainnya",
};

export function ReportModerator({
  initialItems,
  activeStatus,
}: ReportModeratorProps) {
  const [items, setItems] = useState<AdminReportItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleResolve = async (
    reportId: string,
    action: "dismiss" | "hide" | "remove"
  ) => {
    const actionName =
      action === "dismiss"
        ? "mengabaikan laporan ini"
        : action === "hide"
        ? "menyembunyikan konten ini"
        : "menghapus permanen konten ini";

    if (!window.confirm(`Yakin ingin ${actionName}?`)) return;

    try {
      setLoadingId(reportId);
      const res = await resolveReport({
        reportId,
        action,
      });

      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        alert(`Gagal: ${res.message}`);
      }
    } catch {
      alert("Terjadi kesalahan saat memproses laporan.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Link
          href="/admin/reports?status=open"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeStatus === "open"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Laporan Terbuka
        </Link>
        <Link
          href="/admin/reports?status=resolved"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeStatus === "resolved"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Selesai Ditindak
        </Link>
        <Link
          href="/admin/reports?status=dismissed"
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeStatus === "dismissed"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Diabaikan
        </Link>
      </div>

      {/* Reports List */}
      {items.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
          <div className="text-3xl">🛡️</div>
          <h2 className="text-lg font-bold text-[var(--ink)]">
            Tidak ada laporan di kategori ini
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
            Semua laporan pengguna sudah diproses atau belum ada keluhan baru dari komunitas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {new Date(report.created_at).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="text-xs text-[var(--ink-secondary)] space-y-1">
                  <div>
                    Target:{" "}
                    <strong className="text-[var(--ink)] capitalize">
                      {report.target_type}
                    </strong>
                  </div>
                  {report.target_preview && (
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-sans line-clamp-3 italic">
                      &ldquo;{report.target_preview}&rdquo;
                    </div>
                  )}
                  {report.note && (
                    <div className="pt-1">
                      <span className="text-[var(--ink-muted)]">Catatan pelapor:</span>{" "}
                      <span className="text-[var(--ink)]">&quot;{report.note}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons if open */}
              {activeStatus === "open" && (
                <div className="pt-2 flex items-center gap-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleResolve(report.id, "dismiss")}
                    disabled={loadingId === report.id}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-hover)] text-[var(--ink)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                  >
                    Abaikan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(report.id, "hide")}
                    disabled={loadingId === report.id}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    Sembunyikan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(report.id, "remove")}
                    disabled={loadingId === report.id}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
