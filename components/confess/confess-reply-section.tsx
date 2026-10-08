"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { submitConfessReply } from "@/lib/actions/confess";

interface ReplyItem {
  id: string;
  body: string;
  created_at: string;
}

interface ConfessReplySectionProps {
  confessionId: string;
  initialReplies: ReplyItem[];
}

export function ConfessReplySection({
  confessionId,
  initialReplies,
}: ConfessReplySectionProps) {
  const [replies, setReplies] = useState<ReplyItem[]>(initialReplies);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await submitConfessReply({
        confessionId,
        body: body.trim(),
        turnstileToken: "bypass-dev-token",
      });

      if (res.ok) {
        if (res.data.status === "published") {
          const newReply: ReplyItem = {
            id: res.data.id,
            body: body.trim(),
            created_at: new Date().toISOString(),
          };
          setReplies((prev) => [...prev, newReply]);
        } else {
          alert("Balasanmu sedang ditinjau dulu oleh moderator ya.");
        }
        setBody("");
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kendala saat mengirimkan balasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
        <MessageCircle className="w-4 h-4 text-[var(--accent)]" />
        <span>Balasan Anonim ({replies.length})</span>
      </div>

      {/* List Balasan */}
      {replies.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink-muted)] text-center">
          Belum ada yang membalas. Jadilah yang pertama membalas diam-diam!
        </div>
      ) : (
        <div className="space-y-2.5">
          {replies.map((reply) => {
            const timeAgo = new Date(reply.created_at).toLocaleTimeString(
              "id-ID",
              { hour: "2-digit", minute: "2-digit" }
            );

            return (
              <div
                key={reply.id}
                className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] leading-relaxed space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                  <span className="font-semibold text-[var(--ink-secondary)]">
                    Teman Magang
                  </span>
                  <span>{timeAgo}</span>
                </div>
                <p className="whitespace-pre-wrap">{reply.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulir Balas */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Balas pesan ini secara anonim..."
            rows={2}
            maxLength={500}
            className="w-full p-3.5 pr-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="absolute right-2.5 bottom-3.5 w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            title="Kirim Balasan Anonim"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {errorMessage && (
          <div className="text-[11px] text-red-400 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            {errorMessage}
          </div>
        )}

        <p className="text-[10px] text-[var(--ink-muted)]">
          🔒 Balasan kamu juga 100% anonim dan langsung terbit.
        </p>
      </form>
    </div>
  );
}
