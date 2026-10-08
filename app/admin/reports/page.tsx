import { listReports } from "@/lib/actions/admin";
import { ReportModerator } from "@/components/admin/report-moderator";

export const metadata = {
  title: "Laporan Konten — Moment Pakde",
};

interface AdminReportsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminReportsPage(props: AdminReportsPageProps) {
  const searchParams = await props.searchParams;
  const rawStatus = searchParams?.status;

  const activeStatus: "open" | "resolved" | "dismissed" =
    rawStatus === "resolved" || rawStatus === "dismissed" ? rawStatus : "open";

  const result = await listReports(activeStatus);
  const items = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          Laporan Pengguna
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] mt-1">
          Daftar konten yang dilaporkan oleh komunitas karena dugaan pelanggaran aturan.
        </p>
      </div>

      <ReportModerator
        key={activeStatus}
        initialItems={items}
        activeStatus={activeStatus}
      />
    </div>
  );
}
