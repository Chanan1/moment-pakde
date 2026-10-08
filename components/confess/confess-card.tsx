"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Share2, Flag, Lock } from "lucide-react";
import { toggleConfessReaction } from "@/lib/actions/confess";
import { reportContent } from "@/lib/actions/report";

import { ReportReason } from "@/lib/validation/report";

export interface ConfessCardProps {
  id: string;
  shortId: string;
  body: string;
  recipient?: string | null;
  category: string;
  reactionCount: number;
  createdAt: string;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let stored = localStorage.getItem("confess_device_id");
  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem("confess_device_id", stored);
  }
  return stored;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; bg: string; badge: string; border: string }
> = {
  naksir: {
    label: "Naksir",
    bg: "bg-[var(--cat-naksir)]",
    badge: "bg-pink-200 text-pink-800",
    border: "border-pink-200",
  },
  terima_kasih: {
    label: "Terima Kasih",
    bg: "bg-[var(--cat-terima-kasih)]",
    badge: "bg-emerald-200 text-emerald-800",
    border: "border-emerald-200",
  },
  curhat: {
    label: "Curhat",
    bg: "bg-[var(--cat-curhat)]",
    badge: "bg-indigo-200 text-indigo-800",
    border: "border-indigo-200",
  },
  minta_maaf: {
    label: "Minta Maaf",
    bg: "bg-[var(--cat-minta-maaf)]",
    badge: "bg-amber-200 text-amber-800",
    border: "border-amber-200",
  },
  unek_unek: {
    label: "Unek-unek",
    bg: "bg-[var(--cat-unek-unek)]",
    badge: "bg-rose-200 text-rose-800",
    border: "border-rose-200",
  },
  lainnya: {
    label: "Lainnya",
    bg: "bg-[var(--cat-lainnya)]",
    badge: "bg-stone-200 text-stone-800",
    border: "border-stone-200",
  },
};

export function ConfessCard({
  id,
  shortId,
  body,
  recipient,
  category,
  reactionCount: initialCount,
  createdAt,
}: ConfessCardProps) {
  const [count, setCount] = useState(initialCount);
  const [hasReacted, setHasReacted] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("bullying");
  const [reportSuccess, setReportSuccess] = useState(false);

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.lainnya;

  async function handleReaction() {
    const devId = getDeviceId();
    if (isReacting || !devId) return;
    setIsReacting(true);

    const prevCount = count;
    const nextReacted = !hasReacted;
    setHasReacted(nextReacted);
    setCount(nextReacted ? count + 1 : Math.max(0, count - 1));

    try {
      const res = await toggleConfessReaction(id, "heart", devId);
      if (res.ok) {
        setCount(res.data.count);
      } else {
        setHasReacted(!nextReacted);
        setCount(prevCount);
      }
    } catch {
      setHasReacted(!nextReacted);
      setCount(prevCount);
    } finally {
      setIsReacting(false);
    }
  }

  async function handleReport() {
    await reportContent({
      targetType: "confession",
      targetId: id,
      reason: reportReason,
    });
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportDialog(false);
      setReportSuccess(false);
    }, 1500);
  }

  return (
    <article
      className={`rounded-2xl p-5 border ${style.border} ${style.bg} shadow-xs transition-all relative overflow-hidden`}
    >
      {/* Header Kartu: Kategori, Icon Anonim, Tanggal */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${style.badge}`}>
            {style.label}
          </span>
          <span className="flex items-center gap-1 text-[var(--ink-muted)] text-[10px]">
            <Lock className="w-3 h-3" />
            <span>Anonim</span>
          </span>
        </div>
        <span className="text-[10px] text-[var(--ink-muted)]">
          {new Date(createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      {/* Baris Penerima (jika diisi) */}
      {recipient && (
        <div className="text-xs font-semibold text-[var(--ink)] mb-2 flex items-baseline gap-1">
          <span className="text-[var(--ink-muted)] font-normal">Untuk:</span>
          <span>{recipient}</span>
        </div>
      )}

      {/* Isi Confess */}
      <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap font-sans mb-4">
        {body}
      </p>

      {/* Footer Kartu: Reaksi & Aksi */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
        <button
          type="button"
          onClick={handleReaction}
          disabled={isReacting}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-colors ${
            hasReacted
              ? "bg-rose-500 text-white font-semibold"
              : "bg-white/80 hover:bg-white text-[var(--ink-muted)] hover:text-rose-600"
          }`}
          aria-label="Kirim hati"
        >
          <Heart className={`w-4 h-4 ${hasReacted ? "fill-white" : ""}`} />
          <span>{count}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReportDialog(true)}
            className="p-1.5 rounded-full text-[var(--ink-muted)] hover:text-rose-600 hover:bg-white/60 transition-colors"
            title="Laporkan"
            aria-label="Laporkan confess"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>

          <Link
            href={`/c/${shortId}`}
            className="p-1.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-white/60 transition-colors"
            title="Bagikan"
            aria-label="Bagikan tautan confess"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Modal Laporan Sederhana */}
      {showReportDialog && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xs p-4 flex flex-col justify-center items-center text-center z-10">
          {reportSuccess ? (
            <p className="text-xs font-semibold text-emerald-600">
              Laporan terkirim. Terima kasih sudah menjaga kenyamanan komunitas!
            </p>
          ) : (
            <div className="w-full space-y-3">
              <h4 className="text-xs font-bold text-[var(--ink)]">Laporkan Confess</h4>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="w-full text-xs p-2 rounded-xl border border-[var(--line)] bg-white"
              >
                <option value="bullying">Kasar / Bullying</option>
                <option value="doxxing">Membuka Identitas Orang</option>
                <option value="company">Menjelekkan Mentor/Perusahaan</option>
                <option value="spam">Spam / Promosi / Judi</option>
                <option value="sexual">Konten Tidak Pantas</option>
                <option value="other">Lainnya</option>
              </select>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportDialog(false)}
                  className="px-3 py-1 rounded-full text-xs text-[var(--ink-muted)] hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="px-3 py-1 rounded-full text-xs bg-rose-600 text-white font-medium hover:bg-rose-700 shadow-xs"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
