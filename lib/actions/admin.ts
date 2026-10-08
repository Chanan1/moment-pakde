"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/types/action";
import {
  ModerateConfessSchema,
  ResolveReportSchema,
  BlockSenderSchema,
  TogglePauseSchema,
  type ModerateConfessInput,
  type ResolveReportInput,
  type BlockSenderInput,
} from "@/lib/validation/admin";

export interface AdminConfessionItem {
  id: string;
  short_id: string;
  body: string;
  recipient: string | null;
  category: string;
  status: "pending" | "published" | "hidden" | "removed";
  removal_reason: string | null;
  auto_flags: string[];
  reviewed_at: string | null;
  reaction_count: number;
  report_count: number;
  created_at: string;
  published_at: string | null;
}

export interface AdminReportItem {
  id: string;
  target_type: "moment" | "comment" | "confession" | "reply";
  target_id: string;
  reason: "spam" | "bullying" | "doxxing" | "company" | "sexual" | "other";
  note: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  target_preview?: string | null;
}

export interface AdminOverviewStats {
  perluDicekCount: number;
  ditahanCount: number;
  openReportsCount: number;
  totalConfessionsCount: number;
  confessPaused: boolean;
}

/**
 * Memverifikasi apakah session user yang aktif memiliki peran admin atau moderator.
 */
async function assertStaffRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, error: "UNAUTHORIZED" as const, message: "Silakan masuk terlebih dahulu." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_banned")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.is_banned) {
    return { ok: false as const, error: "FORBIDDEN" as const, message: "Akses ditolak atau akun dinonaktifkan." };
  }

  if (profile.role !== "admin" && profile.role !== "moderator") {
    return { ok: false as const, error: "FORBIDDEN" as const, message: "Akses terbatas untuk tim admin/moderator." };
  }

  return { ok: true as const, user, profile };
}

/**
 * Mengambil ringkasan metrik dashboard admin.
 */
export async function getAdminOverview(): Promise<ActionResult<AdminOverviewStats>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const adminClient = createAdminClient();

  try {
    // 1. Confess perlu dicek: status bukan removed, reviewed_at is null, dan (ada flag atau ada laporan)
    const { count: perluDicekCount, error: err1 } = await adminClient
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .is("reviewed_at", null)
      .neq("status", "removed")
      .or("report_count.gt.0,auto_flags.neq.{}");

    // 2. Confess ditahan: status = 'pending'
    const { count: ditahanCount, error: err2 } = await adminClient
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 3. Laporan terbuka
    const { count: openReportsCount, error: err3 } = await adminClient
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // 4. Total confess
    const { count: totalConfessionsCount, error: err4 } = await adminClient
      .from("confessions")
      .select("*", { count: "exact", head: true });

    // 5. Saklar confess_paused
    const { data: pausedSetting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "confess_paused")
      .single();

    if (err1 || err2 || err3 || err4) {
      return { ok: false, error: "INTERNAL", message: "Gagal memuat statistik moderasi." };
    }

    const confessPaused = pausedSetting ? Boolean(pausedSetting.value) : false;

    return {
      ok: true,
      data: {
        perluDicekCount: perluDicekCount ?? 0,
        ditahanCount: ditahanCount ?? 0,
        openReportsCount: openReportsCount ?? 0,
        totalConfessionsCount: totalConfessionsCount ?? 0,
        confessPaused,
      },
    };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Terjadi kesalahan server saat memuat statistik." };
  }
}

/**
 * Mengambil daftar confess untuk ditinjau berdasarkan tab.
 */
export async function listConfessionsForReview(
  tab: "perlu_dicek" | "ditahan" | "terbaru",
  limit = 30
): Promise<ActionResult<AdminConfessionItem[]>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const adminClient = createAdminClient();

  try {
    let query = adminClient
      .from("confessions")
      .select(
        "id, short_id, body, recipient, category, status, removal_reason, auto_flags, reviewed_at, reaction_count, report_count, created_at, published_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tab === "perlu_dicek") {
      query = query
        .is("reviewed_at", null)
        .neq("status", "removed")
        .or("report_count.gt.0,auto_flags.neq.{}");
    } else if (tab === "ditahan") {
      query = query.eq("status", "pending");
    } else {
      // tab terbaru
      query = query.neq("status", "removed");
    }

    const { data, error } = await query;

    if (error) {
      return { ok: false, error: "INTERNAL", message: error.message };
    }

    const items: AdminConfessionItem[] = (data ?? []).map((row) => ({
      id: row.id,
      short_id: row.short_id,
      body: row.body,
      recipient: row.recipient,
      category: row.category,
      status: row.status as AdminConfessionItem["status"],
      removal_reason: row.removal_reason,
      auto_flags: row.auto_flags ?? [],
      reviewed_at: row.reviewed_at,
      reaction_count: row.reaction_count,
      report_count: row.report_count,
      created_at: row.created_at,
      published_at: row.published_at,
    }));

    return { ok: true, data: items };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Gagal mengambil daftar confess." };
  }
}

/**
 * Melakukan moderasi pada sebuah confess (review, publish, hide, restore, remove).
 */
export async function moderateConfession(
  rawInput: ModerateConfessInput
): Promise<ActionResult<{ id: string; status: string }>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const parsed = ModerateConfessSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION",
      message: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { id, action, reason } = parsed.data;
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  try {
    const updatePayload: Database["public"]["Tables"]["confessions"]["Update"] = {
      reviewed_at: now,
    };

    if (action === "publish" || action === "restore") {
      updatePayload.status = "published";
      updatePayload.published_at = now;
      updatePayload.removal_reason = null;
    } else if (action === "hide") {
      updatePayload.status = "hidden";
      updatePayload.removal_reason = reason ?? "Disembunyikan oleh moderator";
    } else if (action === "remove") {
      updatePayload.status = "removed";
      updatePayload.removal_reason = reason ?? "Dihapus oleh moderator";
    }
    // jika action === "review", status tetap, hanya reviewed_at diperbarui

    const { data: updated, error: updateError } = await adminClient
      .from("confessions")
      .update(updatePayload)
      .eq("id", id)
      .select("id, status, short_id")
      .single();

    if (updateError || !updated) {
      return { ok: false, error: "INTERNAL", message: "Gagal memperbarui status confess." };
    }

    // Catat log moderasi
    await adminClient.from("moderation_logs").insert({
      admin_id: staffCheck.user.id,
      action,
      target_type: "confession",
      target_id: id,
      note: reason ?? null,
    });

    revalidatePath("/admin/confess");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/c/${updated.short_id}`);

    return {
      ok: true,
      data: { id: updated.id, status: updated.status },
    };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Terjadi kesalahan saat memoderasi confess." };
  }
}

/**
 * Mengambil daftar laporan pengguna.
 */
export async function listReports(
  status: "open" | "resolved" | "dismissed" = "open",
  limit = 30
): Promise<ActionResult<AdminReportItem[]>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const adminClient = createAdminClient();

  try {
    const { data: reportsData, error: reportsError } = await adminClient
      .from("reports")
      .select("id, target_type, target_id, reason, note, status, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (reportsError) {
      return { ok: false, error: "INTERNAL", message: reportsError.message };
    }

    const items: AdminReportItem[] = [];

    // Lengkapi pratinjau teks target jika ada
    for (const rep of reportsData ?? []) {
      let preview: string | null = null;
      if (rep.target_type === "confession") {
        const { data: conf } = await adminClient
          .from("confessions")
          .select("body, short_id")
          .eq("id", rep.target_id)
          .single();
        if (conf) {
          preview = `[#${conf.short_id}] ${conf.body.slice(0, 100)}`;
        }
      } else if (rep.target_type === "moment") {
        const { data: mom } = await adminClient
          .from("moments")
          .select("caption")
          .eq("id", rep.target_id)
          .single();
        if (mom) {
          preview = mom.caption ? mom.caption.slice(0, 100) : "(Tanpa caption)";
        }
      }

      items.push({
        id: rep.id,
        target_type: rep.target_type as AdminReportItem["target_type"],
        target_id: rep.target_id,
        reason: rep.reason as AdminReportItem["reason"],
        note: rep.note,
        status: rep.status as AdminReportItem["status"],
        created_at: rep.created_at,
        target_preview: preview,
      });
    }

    return { ok: true, data: items };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Gagal memuat daftar laporan." };
  }
}

/**
 * Menyelesaikan laporan pengguna (dismiss, hide, remove target).
 */
export async function resolveReport(
  rawInput: ResolveReportInput
): Promise<ActionResult<{ reportId: string }>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const parsed = ResolveReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION",
      message: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { reportId, action, note } = parsed.data;
  const adminClient = createAdminClient();

  try {
    const { data: report, error: getErr } = await adminClient
      .from("reports")
      .select("id, target_type, target_id")
      .eq("id", reportId)
      .single();

    if (getErr || !report) {
      return { ok: false, error: "NOT_FOUND", message: "Laporan tidak ditemukan." };
    }

    const nextReportStatus = action === "dismiss" ? "dismissed" : "resolved";

    // 1. Update status laporan
    await adminClient
      .from("reports")
      .update({ status: nextReportStatus })
      .eq("id", reportId);

    // 2. Tindakan ke konten target
    if (action === "hide" || action === "remove") {
      const targetStatus = action === "hide" ? "hidden" : "removed";
      const targetReason = note ?? "Disembunyikan via laporan pengguna";

      if (report.target_type === "confession") {
        await adminClient
          .from("confessions")
          .update({
            status: targetStatus,
            removal_reason: targetReason,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", report.target_id);
      } else if (report.target_type === "moment") {
        await adminClient
          .from("moments")
          .update({
            status: targetStatus,
          })
          .eq("id", report.target_id);
      }
    }

    // 3. Catat ke moderation_logs
    await adminClient.from("moderation_logs").insert({
      admin_id: staffCheck.user.id,
      action,
      target_type: report.target_type,
      target_id: report.target_id,
      note: note ?? `Penyelesaian laporan #${reportId}`,
    });

    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: { reportId } };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Gagal menyelesaikan laporan." };
  }
}

/**
 * Memblokir pengirim confess (berdasarkan sender_hash di tabel confessions).
 */
export async function blockSender(
  rawInput: BlockSenderInput
): Promise<ActionResult<{ success: boolean }>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const parsed = BlockSenderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION",
      message: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { confessionId, days, reason } = parsed.data;
  const adminClient = createAdminClient();

  try {
    // Ambil sender_hash dari confession terkait (hanya di server)
    const { data: conf, error: confErr } = await adminClient
      .from("confessions")
      .select("id, sender_hash, short_id")
      .eq("id", confessionId)
      .single();

    if (confErr || !conf) {
      return { ok: false, error: "NOT_FOUND", message: "Confess tidak ditemukan." };
    }

    const expiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Masukkan ke blocked_senders
    const { error: blockErr } = await adminClient.from("blocked_senders").upsert({
      sender_hash: conf.sender_hash,
      reason: reason ?? "Diblokir oleh moderator",
      blocked_by: staffCheck.user.id,
      expires_at: expiresAt,
    });

    if (blockErr) {
      return { ok: false, error: "INTERNAL", message: "Gagal memblokir pengirim." };
    }

    // Hapus atau sembunyikan confess tersebut
    await adminClient
      .from("confessions")
      .update({
        status: "removed",
        removal_reason: "Pengirim diblokir",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", confessionId);

    // Catat log audit
    await adminClient.from("moderation_logs").insert({
      admin_id: staffCheck.user.id,
      action: "block",
      target_type: "sender",
      target_id: conf.sender_hash,
      note: reason ?? `Blokir ${days ?? "permanen"} hari dari confess #${conf.short_id}`,
    });

    revalidatePath("/admin/confess");
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: { success: true } };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Terjadi kesalahan saat memproses blokir." };
  }
}

/**
 * Mengubah status saklar darurat jeda confess (confess_paused).
 */
export async function toggleConfessPause(
  paused: boolean
): Promise<ActionResult<{ paused: boolean }>> {
  const staffCheck = await assertStaffRole();
  if (!staffCheck.ok) return staffCheck;

  const parsed = TogglePauseSchema.safeParse({ paused });
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION", message: "Input status jeda tidak valid" };
  }

  const adminClient = createAdminClient();

  try {
    const { error } = await adminClient
      .from("app_settings")
      .upsert({
        key: "confess_paused",
        value: parsed.data.paused,
      });

    if (error) {
      return { ok: false, error: "INTERNAL", message: "Gagal memperbarui saklar jeda." };
    }

    await adminClient.from("moderation_logs").insert({
      admin_id: staffCheck.user.id,
      action: "settings",
      target_type: "settings",
      target_id: "confess_paused",
      note: parsed.data.paused ? "Confess dijeda sementara" : "Confess diaktifkan kembali",
    });

    revalidatePath("/admin");
    revalidatePath("/confess/new");

    return { ok: true, data: { paused: parsed.data.paused } };
  } catch {
    return { ok: false, error: "INTERNAL", message: "Terjadi kesalahan saat mengubah saklar jeda." };
  }
}
