import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPauseSwitch } from "@/components/admin/pause-switch";

export const metadata = {
  title: "Admin Moderasi — Moment Pakde",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, is_banned")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned || (profile.role !== "admin" && profile.role !== "moderator")) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold">Akses Terbatas</h1>
          <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
            Halaman ini khusus untuk tim moderator dan administrator komunitas Moment Pakde. Akun kamu tidak memiliki izin moderasi.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-full text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Ambil status saklar darurat confess_paused
  const adminClient = createAdminClient();
  const { data: pausedSetting } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", "confess_paused")
    .single();

  const isPaused = pausedSetting ? Boolean(pausedSetting.value) : false;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-bold tracking-tight text-lg text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center text-xs font-black">
                MP
              </span>
              <span>Moderasi Pakde</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {profile.role}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors"
              >
                Ringkasan
              </Link>
              <Link
                href="/admin/confess"
                className="px-3 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors"
              >
                Confess
              </Link>
              <Link
                href="/admin/reports"
                className="px-3 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors"
              >
                Laporan
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Saklar Darurat Jeda Confess */}
            <AdminPauseSwitch initialPaused={isPaused} />

            {/* Link ke situs utama */}
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Lihat Web &rarr;
            </Link>

            {/* Form Logout */}
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                title={`Masuk sebagai @${profile.username}`}
              >
                Keluar
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Submenu */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-t border-[var(--border)] text-xs font-medium overflow-x-auto">
          <Link
            href="/admin"
            className="px-3 py-1 rounded-lg bg-[var(--surface-hover)] text-[var(--ink)] whitespace-nowrap"
          >
            Ringkasan
          </Link>
          <Link
            href="/admin/confess"
            className="px-3 py-1 rounded-lg bg-[var(--surface-hover)] text-[var(--ink)] whitespace-nowrap"
          >
            Confess
          </Link>
          <Link
            href="/admin/reports"
            className="px-3 py-1 rounded-lg bg-[var(--surface-hover)] text-[var(--ink)] whitespace-nowrap"
          >
            Laporan
          </Link>
        </div>
      </header>

      {/* Admin Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
