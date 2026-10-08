import { listConfessionsForReview, getAdminOverview } from "@/lib/actions/admin";
import { ConfessModerator } from "@/components/admin/confess-moderator";

export const metadata = {
  title: "Moderasi Confess — Moment Pakde",
};

interface AdminConfessPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AdminConfessPage(props: AdminConfessPageProps) {
  const searchParams = await props.searchParams;
  const rawTab = searchParams?.tab;

  const activeTab: "perlu_dicek" | "ditahan" | "terbaru" =
    rawTab === "ditahan" || rawTab === "terbaru" ? rawTab : "perlu_dicek";

  const [confessionsRes, overviewRes] = await Promise.all([
    listConfessionsForReview(activeTab),
    getAdminOverview(),
  ]);

  const items = confessionsRes.ok ? confessionsRes.data : [];
  const perluDicekCount = overviewRes.ok ? overviewRes.data.perluDicekCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          Moderasi Confess Anonim
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] mt-1">
          Tinjau kiriman confess ber-flag, loloskan yang ditahan, atau bersihkan konten berbahaya.
        </p>
      </div>

      <ConfessModerator
        key={activeTab}
        initialItems={items}
        activeTab={activeTab}
        perluDicekCount={perluDicekCount}
      />
    </div>
  );
}
