import { Suspense } from "react";
import Link from "next/link";
import { ConfessStatusChecker } from "@/components/confess/confess-status-checker";

export const metadata = {
  title: "Kelola Confess — Moment Pakde",
  description: "Cek status moderasi atau tarik confess anonim milikmu menggunakan kode rahasia.",
};

interface ManagePageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function ManageConfessPage(props: ManagePageProps) {
  const searchParams = await props.searchParams;
  const initialId = searchParams?.id ?? "";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/?tab=confess"
            className="text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors"
          >
            &larr; Balik ke Feed Confess
          </Link>
          <Link
            href="/confess/new"
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            Kirim Confess Baru
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Cek Status & Kelola Confess
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Punya kode rahasia dari confess yang pernah kamu kirim? Masukkan di bawah ini untuk melihat apakah confess kamu sudah terbit atau untuk menariknya kembali.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-48 rounded-3xl bg-[var(--surface)] animate-pulse" />
          }
        >
          <ConfessStatusChecker initialShortId={initialId} />
        </Suspense>
      </div>
    </main>
  );
}
