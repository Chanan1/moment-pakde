"use server";

import { headers } from "next/headers";
import { ReportContentSchema, ReportContentInput } from "@/lib/validation/report";
import { generateSenderHash } from "@/lib/fingerprint";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResult } from "@/lib/types/action";
import { revalidatePath } from "next/cache";

export async function reportContent(
  input: ReportContentInput
): Promise<ActionResult<{ ok: true }>> {
  try {
    const parseResult = ReportContentSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parseResult.error.issues[0]?.message || "Input laporan tidak valid",
      };
    }

    const { targetType, targetId, reason, note } = parseResult.data;

    // Gunakan hash pengenal reporter
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";
    const reporterKey = generateSenderHash(realIp, userAgent);

    const supabaseAdmin = createAdminClient();

    // Simpan laporan (unique constraint per target & reporter mencegah duplikasi)
    const { error } = await supabaseAdmin.from("reports").insert({
      target_type: targetType,
      target_id: targetId,
      reason,
      note: note || null,
      reporter_key: reporterKey,
      status: "open",
    });

    if (error) {
      // Jika error duplicate key (sudah pernah melapor)
      if (error.code === "23505") {
        return {
          ok: false,
          error: "VALIDATION",
          message: "Kamu sudah pernah melaporkan konten ini sebelumnya.",
        };
      }

      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal mengirim laporan: " + error.message,
      };
    }

    revalidatePath("/");

    return { ok: true, data: { ok: true } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan",
    };
  }
}
