import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfessCard } from "@/components/confess/confess-card";

interface ConfessDetailPageProps {
  params: Promise<{ shortId: string }>;
}

export default async function ConfessDetailPage({
  params,
}: ConfessDetailPageProps) {
  const { shortId } = await params;
  const supabase = await createClient();

  // Selalu baca dari view publik public_confessions untuk menjaga anonimitas
  const { data: confess, error } = await supabase
    .from("public_confessions")
    .select(
      `
      id,
      short_id,
      body,
      recipient,
      category,
      reaction_count,
      created_at
    `
    )
    .eq("short_id", shortId)
    .single();

  if (error || !confess) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Semua Confess</span>
          </Link>
          <span className="text-sm font-semibold">Kartu Confess</span>
          <div className="w-8" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <ConfessCard
          id={confess.id}
          shortId={confess.short_id}
          body={confess.body}
          recipient={confess.recipient}
          category={confess.category}
          reactionCount={confess.reaction_count}
          createdAt={confess.created_at}
        />

        <div className="flex justify-center">
          <Link
            href="/confess/new"
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            Tulis Confess Kamu Sendiri
          </Link>
        </div>
      </main>
    </div>
  );
}
