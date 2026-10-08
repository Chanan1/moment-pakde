"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { SubmitConfessSchema, SubmitConfessInput } from "@/lib/validation/confess";
import { inspectConfess } from "@/lib/moderation/filter";
import { generateSenderHash, hashSecretCode } from "@/lib/fingerprint";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResult } from "@/lib/types/action";

/**
 * Buat kode unik acak yang mudah dibaca
 */
function generateRandomCode(length = 8): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 1. Kirim Confess Anonim
 * Aturan Wajib Anonimitas:
 * - Tidak boleh membaca session auth/cookie user.
 * - Tidak menyimpan IP mentah atau user_agent mentah.
 * - Tidak boleh me-log request body ke console.
 */
export async function submitConfess(
  input: SubmitConfessInput
): Promise<
  ActionResult<{
    shortId: string;
    secretCode: string;
    status: "pending" | "published";
  }>
> {
  try {
    // 1. Validasi skema input
    const parseResult = SubmitConfessSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parseResult.error.issues[0]?.message || "Input tidak valid",
      };
    }

    const { body, recipient, category } = parseResult.data;

    const supabaseAdmin = createAdminClient();

    // 2. Cek apakah confess sedang dijeda (saklar darurat)
    const { data: pausedSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "confess_paused")
      .maybeSingle();

    if (pausedSetting?.value === true) {
      return {
        ok: false,
        error: "FORBIDDEN",
        message: "Confess sedang istirahat sebentar. Coba lagi nanti ya!",
      };
    }

    // 3. Hash perangkat/IP pengirim untuk anti-spam & blokir (tanpa menyimpan IP asli)
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";
    const senderHash = generateSenderHash(realIp, userAgent);

    // Cek apakah senderHash diblokir
    const { data: blocked } = await supabaseAdmin
      .from("blocked_senders")
      .select("sender_hash, expires_at")
      .eq("sender_hash", senderHash)
      .maybeSingle();

    if (blocked) {
      if (!blocked.expires_at || new Date(blocked.expires_at) > new Date()) {
        return {
          ok: false,
          error: "BLOCKED",
          message: "Perangkat ini dibatasi dari mengirim confess.",
        };
      }
    }

    // 4. Filter otomatis: Deteksi PII (HP, Email, NIK)
    const modResult = inspectConfess(body);
    if (modResult.hasPII) {
      return {
        ok: false,
        error: "PII_DETECTED",
        message:
          "Sepertinya ada nomor HP, email, atau NIK di tulisanmu. Hapus dulu ya demi keamanan bersama!",
      };
    }

    // 5. Tentukan status tampil:
    // Jika ada flag berat (link/spam/selfharm) -> pending
    // Jika lolos/flag ringan -> langsung published
    const status: "pending" | "published" = modResult.shouldHold ? "pending" : "published";
    const publishedAt = status === "published" ? new Date().toISOString() : null;

    // 6. Buat shortId dan secretCode
    const shortId = generateRandomCode(8).toLowerCase();
    const rawSecretCode = `${generateRandomCode(4)}-${generateRandomCode(4)}`;
    const secretCodeHash = hashSecretCode(rawSecretCode);

    // 7. Simpan ke database via admin client
    const { error: insertError } = await supabaseAdmin.from("confessions").insert({
      short_id: shortId,
      body,
      recipient: recipient || null,
      category,
      status,
      sender_hash: senderHash,
      secret_code_hash: secretCodeHash,
      auto_flags: modResult.allFlags,
      published_at: publishedAt,
    });

    if (insertError) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menyimpan confess",
      };
    }

    if (status === "published") {
      revalidatePath("/");
    }

    return {
      ok: true,
      data: {
        shortId,
        secretCode: rawSecretCode,
        status,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan",
    };
  }
}

/**
 * 2. Reaksi Emoji Confess Anonim (tanpa login, dibatasi per perangkat)
 */
export async function toggleConfessReaction(
  confessionId: string,
  emoji: string,
  deviceId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    if (!confessionId || !emoji || !deviceId) {
      return { ok: false, error: "VALIDATION", message: "Data tidak lengkap" };
    }

    const deviceHash = generateSenderHash(deviceId, "reaction");
    const supabaseAdmin = createAdminClient();

    // Cek reaksi yang ada
    const { data: existing } = await supabaseAdmin
      .from("confession_reactions")
      .select("emoji")
      .eq("confession_id", confessionId)
      .eq("device_hash", deviceHash)
      .maybeSingle();

    if (existing) {
      if (existing.emoji === emoji) {
        // Hapus reaksi
        await supabaseAdmin
          .from("confession_reactions")
          .delete()
          .eq("confession_id", confessionId)
          .eq("device_hash", deviceHash);
      } else {
        // Ganti reaksi
        await supabaseAdmin
          .from("confession_reactions")
          .update({ emoji })
          .eq("confession_id", confessionId)
          .eq("device_hash", deviceHash);
      }
    } else {
      // Tambah reaksi
      await supabaseAdmin.from("confession_reactions").insert({
        confession_id: confessionId,
        device_hash: deviceHash,
        emoji,
      });
    }

    // Ambil hitungan terbaru
    const { data: confession } = await supabaseAdmin
      .from("confessions")
      .select("reaction_count")
      .eq("id", confessionId)
      .single();

    revalidatePath("/");

    return {
      ok: true,
      data: { count: confession?.reaction_count ?? 0 },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Gagal memberi reaksi",
    };
  }
}
