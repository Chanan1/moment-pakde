import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Masuk — Moment Pakde",
  description: "Masuk dengan akun Google untuk berbagi momen magang di Moment Pakde.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center p-4 selection:bg-[var(--accent)] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-[var(--accent)] hover:opacity-90 transition-opacity"
          >
            <span>Moment Pakde</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-secondary)] font-medium border border-[var(--border)]">
              MagangHub
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--ink)]">
            Masuk ke Akun Kamu
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Simpan foto kenangan dan ceritakan keseruan magangmu bersama teman-teman.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-5">
          <Suspense
            fallback={
              <div className="h-12 w-full animate-pulse bg-[var(--surface-hover)] rounded-2xl" />
            }
          >
            <LoginForm />
          </Suspense>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[var(--border)]" />
            <span className="shrink mx-4 text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wider">
              atau
            </span>
            <div className="flex-grow border-t border-[var(--border)]" />
          </div>

          {/* Confess Disclaimer / Shortcut */}
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
              <span>Mau kirim confess rahasia?</span>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Kamu <strong>tidak perlu login</strong> sama sekali. Confess 100% anonim, identitasmu tidak tersimpan, dan pesanmu langsung terbit.
            </p>
            <Link
              href="/confess/new"
              className="inline-block text-xs font-semibold text-[var(--accent)] hover:underline pt-1"
            >
              Kirim Diam-diam Sekarang &rarr;
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          >
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
