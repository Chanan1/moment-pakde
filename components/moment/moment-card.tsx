"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, MapPin, Calendar } from "lucide-react";
import { toggleMomentReaction } from "@/lib/actions/moment";
import { MomentEmoji } from "@/lib/supabase/types";

interface Photo {
  id: string;
  storage_path: string;
  width: number;
  height: number;
  alt_text?: string | null;
}

interface MomentCardProps {
  id: string;
  author: {
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  caption: string;
  momentDate: string;
  location?: string | null;
  photos: Photo[];
  tags?: string[];
  reactionCount: number;
  commentCount: number;
  userReaction?: MomentEmoji | null;
  publicUrlPrefix?: string;
}

export function MomentCard({
  id,
  author,
  caption,
  momentDate,
  location,
  photos,
  tags = [],
  reactionCount: initialCount,
  commentCount,
  userReaction: initialReaction = null,
  publicUrlPrefix = "",
}: MomentCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reaction, setReaction] = useState<MomentEmoji | null>(initialReaction);
  const [count, setCount] = useState(initialCount);
  const [isReacting, setIsReacting] = useState(false);

  const activePhoto = photos[currentPhotoIndex];
  const photoUrl = activePhoto?.storage_path.startsWith("http")
    ? activePhoto.storage_path
    : `${publicUrlPrefix}/${activePhoto?.storage_path}`;

  async function handleQuickLove() {
    if (isReacting) return;
    setIsReacting(true);

    // Optimistic update
    const previousReaction = reaction;
    const previousCount = count;
    const isLoved = reaction === "love";

    setReaction(isLoved ? null : "love");
    setCount(isLoved ? Math.max(0, count - 1) : count + (previousReaction ? 0 : 1));

    try {
      const res = await toggleMomentReaction(id, "love");
      if (res.ok) {
        setReaction(res.data.reaction);
        setCount(res.data.count);
      } else {
        // Rollback
        setReaction(previousReaction);
        setCount(previousCount);
      }
    } catch {
      setReaction(previousReaction);
      setCount(previousCount);
    } finally {
      setIsReacting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      {/* Header Pengunggah */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--line)]/50">
        <Link href={`/u/${author.username}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden relative border border-[var(--line)]">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.display_name || author.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-stone-600 text-sm">
                {(author.display_name || author.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-sm group-hover:underline text-[var(--ink)]">
              {author.display_name || `@${author.username}`}
            </div>
            {location && (
              <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--accent)]" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </Link>
        <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>{momentDate}</span>
        </div>
      </div>

      {/* Foto Carousel */}
      {photos.length > 0 && (
        <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
          {activePhoto && (
            <Image
              src={photoUrl}
              alt={activePhoto.alt_text || caption || "Foto momen"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 600px"
              priority={currentPhotoIndex === 0}
            />
          )}

          {/* Indikator dan tombol navigasi foto jika lebih dari 1 */}
          {photos.length > 1 && (
            <>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {currentPhotoIndex + 1}/{photos.length}
              </div>

              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity">
                {currentPhotoIndex > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPhotoIndex((i) => i - 1);
                    }}
                    className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Foto sebelumnya"
                  >
                    ‹
                  </button>
                )}
                {currentPhotoIndex < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPhotoIndex((i) => i + 1);
                    }}
                    className="ml-auto p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Foto berikutnya"
                  >
                    ›
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Konten & Aksi */}
      <div className="p-4 space-y-3">
        {/* Tombol Reaksi & Komentar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleQuickLove}
            disabled={isReacting}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              reaction === "love" ? "text-red-500 font-bold" : "text-[var(--ink-muted)] hover:text-red-500"
            }`}
            aria-label="Suka"
          >
            <Heart className={`w-5 h-5 ${reaction === "love" ? "fill-red-500" : ""}`} />
            <span>{count}</span>
          </button>

          <Link
            href={`/m/${id}#comments`}
            className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentCount}</span>
          </Link>
        </div>

        {/* Caption */}
        {caption && (
          <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
            <span className="font-semibold mr-1.5">{author.username}</span>
            {caption}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-[var(--accent)] hover:bg-orange-100 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
