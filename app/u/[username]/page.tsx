import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MomentCard } from "@/components/moment/moment-card";
import { ProfileEditor } from "@/components/profile/profile-editor";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata(props: ProfilePageProps) {
  const { username } = await props.params;
  return {
    title: `@${username} — Moment Pakde`,
    description: `Profil dan kumpulan momen magang dari @${username} di Moment Pakde.`,
  };
}

export default async function UserProfilePage(props: ProfilePageProps) {
  const { username } = await props.params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, "");

  const supabase = await createClient();

  // 1. Ambil data profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, role, created_at")
    .eq("username", cleanUsername)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // 2. Ambil user login saat ini (jika ada) untuk cek kepemilikan
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwner = currentUser?.id === profile.id;

  // 3. Ambil momen yang diunggah profil ini
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
    .eq("user_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const moments = rawMoments || [];
  const publicUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  const joinDate = new Date(profile.created_at).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <span className="text-sm font-bold text-[var(--ink)]">
            @{profile.username}
          </span>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Info Card */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-bold border border-amber-500/30">
                {profile.display_name
                  ? profile.display_name.charAt(0).toUpperCase()
                  : profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--ink)]">
                  {profile.display_name || `@${profile.username}`}
                </h1>
                <p className="text-xs text-[var(--ink-secondary)]">
                  @{profile.username}
                </p>
                {profile.role !== "user" && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {profile.role}
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <ProfileEditor
                initialDisplayName={profile.display_name}
                initialBio={profile.bio}
              />
            )}
          </div>

          {profile.bio && (
            <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Bergabung {joinDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>{moments.length} Momen</span>
            </div>
          </div>
        </div>

        {/* Moments Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[var(--ink)]">
            Momen dari @{profile.username}
          </h2>

          {moments.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
              <p className="text-sm text-[var(--ink-secondary)]">
                @{profile.username} belum upload momen
              </p>
              {isOwner && (
                <Link
                  href="/upload"
                  className="inline-block text-xs font-semibold text-[var(--accent)] hover:underline pt-2"
                >
                  Bagikan momen pertamamu &rarr;
                </Link>
              )}
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
        </div>
      </main>
    </div>
  );
}
