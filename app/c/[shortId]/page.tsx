import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfessCard } from "@/components/confess/confess-card";
import { ConfessReplySection } from "@/components/confess/confess-reply-section";

interface ConfessDetailPageProps {
  params: Promise<{ shortId: string }>;
}

export async function generateMetadata({
  params,
}: ConfessDetailPageProps) {
  const { shortId } = await params;
  return {
    title: `Confess #${shortId} — Moment Pakde`,
    description: "Kumpulan confess dan pesan anonim anak magang MagangHub.",
    openGraph: {
      title: `Confess #${shortId} — Moment Pakde`,
      description: "Kumpulan confess dan pesan anonim anak magang MagangHub.",
      images: [`/api/og/confess/${shortId}`],
    },
  };
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

  // Ambil balasan yang berstatus published
  const { data: rawReplies } = await supabase
    .from("public_confession_replies")
    .select("id, body, created_at")
    .eq("confession_id", confess.id)
    .order("created_at", { ascending: true });

  const replies = rawReplies || [];

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

        {/* Bagian Balasan Anonim */}
        <ConfessReplySection
          confessionId={confess.id}
          initialReplies={replies}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={`/api/og/confess/${confess.short_id}?format=story`}
            target="_blank"
            rel="noopener noreferrer"
            download={`confess-${confess.short_id}-story.png`}
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] transition-colors"
          >
            📸 Buka Kartu Story IG (9:16)
          </a>
          <Link
            href="/confess/new"
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity shadow-xs"
          >
            Tulis Confess Sendiri
          </Link>
        </div>
      </main>
    </div>
  );
}
