import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MomentCard } from "@/components/moment/moment-card";

interface MomentTagItem {
  tags?: {
    slug: string;
  } | null;
}

interface CommentAuthor {
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface CommentItem {
  id: string;
  body: string;
  created_at: string;
  profiles?: CommentAuthor | CommentAuthor[] | null;
}

interface MomentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MomentDetailPageProps) {
  const { id } = await params;
  return {
    title: "Momen Magang — Moment Pakde",
    description: "Cerita dan kenangan magang seru di komunitas MagangHub.",
    openGraph: {
      title: "Momen Magang — Moment Pakde",
      description: "Cerita dan kenangan magang seru di komunitas MagangHub.",
      images: [`/api/og/moment/${id}`],
    },
  };
}

export default async function MomentDetailPage({ params }: MomentDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Ambil data moment beserta relasi profiles, photos, tags
  const { data: moment, error } = await supabase
    .from("moments")
    .select(
      `
      id,
      caption,
      moment_date,
      location,
      reaction_count,
      comment_count,
      status,
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
    .eq("id", id)
    .single();

  if (error || !moment || moment.status === "removed") {
    notFound();
  }

  // Ambil komentar untuk momen ini
  const { data: rawComments } = await supabase
    .from("comments")
    .select(
      `
      id,
      body,
      created_at,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("moment_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  const comments = (rawComments || []) as unknown as CommentItem[];

  // Urutkan foto berdasarkan posisi
  const sortedPhotos = (moment.moment_photos || []).sort(
    (a, b) => a.position - b.position
  );

  // Ambil list tags
  const momentTags = (moment.moment_tags || []) as unknown as MomentTagItem[];
  const tagList = momentTags
    .map((mt) => mt.tags?.slug)
    .filter((slug): slug is string => Boolean(slug));

  const authorProfile = Array.isArray(moment.profiles)
    ? moment.profiles[0]
    : moment.profiles;

  const publicUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

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
          <span className="text-sm font-semibold">Momen</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-stone-200 text-[var(--ink-muted)] transition-colors"
              title="Laporkan"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-stone-200 text-[var(--ink-muted)] transition-colors"
              title="Bagikan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Moment Card */}
        <MomentCard
          id={moment.id}
          author={{
            username: authorProfile?.username || "anon",
            display_name: authorProfile?.display_name,
            avatar_url: authorProfile?.avatar_url,
          }}
          caption={moment.caption}
          momentDate={moment.moment_date}
          location={moment.location}
          photos={sortedPhotos}
          tags={tagList}
          reactionCount={moment.reaction_count}
          commentCount={moment.comment_count}
          publicUrlPrefix={publicUrlPrefix}
        />

        {/* Section Komentar */}
        <section id="comments" className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Komentar ({comments?.length || 0})
          </h2>

          {/* Daftar Komentar */}
          {comments && comments.length > 0 ? (
            <div className="divide-y divide-[var(--line)]/50">
              {comments.map((comment: CommentItem) => {
                const commentUser = Array.isArray(comment.profiles)
                  ? comment.profiles[0]
                  : comment.profiles;

                return (
                  <div key={comment.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--ink)]">
                        {commentUser?.display_name || `@${commentUser?.username || "user"}`}
                      </span>
                      <span className="text-[10px] text-[var(--ink-muted)]">
                        {new Date(comment.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink)] whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[var(--ink-muted)]">
              Belum ada komentar. Jadilah yang pertama berkomentar!
            </div>
          )}

          {/* Form Tambah Komentar */}
          <form className="pt-2 border-t border-[var(--line)]/50 flex gap-2">
            <input
              type="text"
              placeholder="Tulis komentar kamu..."
              maxLength={500}
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
            >
              Kirim
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
