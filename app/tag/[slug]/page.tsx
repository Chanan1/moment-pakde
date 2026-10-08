import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MomentCard } from "@/components/moment/moment-card";

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: TagPageProps) {
  const { slug } = await props.params;
  return {
    title: `#${slug} — Moment Pakde`,
    description: `Kumpulan momen anak magang dengan tag #${slug} di Moment Pakde.`,
  };
}

export default async function TagMomentsPage(props: TagPageProps) {
  const { slug } = await props.params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().replace(/^#/, "");

  const supabase = await createClient();

  // 1. Ambil data tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, slug")
    .eq("slug", cleanSlug)
    .single();

  if (tagError || !tag) {
    notFound();
  }

  // 2. Ambil ID momen yang memiliki tag ini
  const { data: momentTagRows } = await supabase
    .from("moment_tags")
    .select("moment_id")
    .eq("tag_id", tag.id);

  const momentIds = (momentTagRows || []).map((row) => row.moment_id);

  // 3. Ambil data momen
  let moments: Array<{
    id: string;
    caption: string;
    moment_date: string;
    location: string | null;
    reaction_count: number;
    comment_count: number;
    created_at: string;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | Array<{
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    }> | null;
    moment_photos?: Array<{
      id: string;
      storage_path: string;
      width: number;
      height: number;
      alt_text: string | null;
      position: number;
    }>;
    moment_tags?: Array<{
      tags: {
        slug: string;
      } | null;
    }>;
  }> = [];

  if (momentIds.length > 0) {
    const { data: rawMoments } = await supabase
      .from("moments")
      .select(
        `
        id,
        caption,
        moment_date,
        location,
        reaction_count,
        comment_count,
        created_at,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        moment_photos (
          id,
          storage_path,
          width,
          height,
          alt_text,
          position
        ),
        moment_tags (
          tags:tag_id (
            slug
          )
        )
      `
      )
      .in("id", momentIds)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    moments = rawMoments || [];
  }

  const publicUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <div className="flex items-center gap-1 font-bold text-sm">
            <Hash className="w-4 h-4 text-[var(--accent)]" />
            <span>{tag.slug}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[var(--accent)] flex items-center justify-center font-black text-xl">
              #
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">#{tag.slug}</h1>
              <p className="text-xs text-[var(--ink-secondary)]">
                {moments.length} momen dengan tag ini
              </p>
            </div>
          </div>

          <Link
            href="/upload"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            Tambah Momen
          </Link>
        </div>

        {moments.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
            <p className="text-sm text-[var(--ink-secondary)]">
              Belum ada momen dengan tag #{tag.slug}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {moments.map((moment) => {
              const author = Array.isArray(moment.profiles)
                ? moment.profiles[0]
                : moment.profiles;
              const photos = (moment.moment_photos || []).sort(
                (a, b) => a.position - b.position
              );
              const tags = (moment.moment_tags || [])
                .map((t) => t.tags?.slug)
                .filter((s): s is string => Boolean(s));

              return (
                <MomentCard
                  key={moment.id}
                  id={moment.id}
                  author={{
                    username: author?.username || "magang",
                    display_name: author?.display_name,
                    avatar_url: author?.avatar_url,
                  }}
                  caption={moment.caption}
                  momentDate={moment.moment_date}
                  location={moment.location ?? undefined}
                  photos={photos}
                  tags={tags}
                  reactionCount={moment.reaction_count}
                  commentCount={moment.comment_count}
                  publicUrlPrefix={publicUrlPrefix}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
