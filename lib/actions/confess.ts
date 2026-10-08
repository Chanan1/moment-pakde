"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  SubmitConfessSchema,
  SubmitConfessInput,
  ManageConfessSchema,
  ManageConfessInput,
  SubmitConfessReplySchema,
  SubmitConfessReplyInput,
} from "@/lib/validation/confess";
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

export interface ConfessStatusResult {
  shortId: string;
  status: "pending" | "published" | "hidden" | "removed";
  removalReason: string | null;
  body: string;
  category: string;
  recipient: string | null;
  createdAt: string;
}

/**
 * 3. Periksa Status Moderasi Confess Milik Sendiri (menggunakan Kode Rahasia)
 */
export async function checkConfessStatus(
  input: ManageConfessInput
): Promise<ActionResult<ConfessStatusResult>> {
  try {
    const parsed = ManageConfessSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parsed.error.issues[0]?.message || "Input tidak valid",
      };
    }

    const { shortId, secretCode } = parsed.data;
    const cleanSecret = secretCode.trim().toUpperCase();
    const hashed = hashSecretCode(cleanSecret);

    const supabaseAdmin = createAdminClient();
    const { data: conf, error } = await supabaseAdmin
      .from("confessions")
      .select("id, short_id, body, category, recipient, status, removal_reason, created_at, secret_code_hash")
      .eq("short_id", shortId.toLowerCase())
      .single();

    if (error || !conf || conf.secret_code_hash !== hashed) {
      return {
        ok: false,
        error: "UNAUTHORIZED",
        message: "ID confess atau kode rahasia tidak cocok.",
      };
    }

    return {
      ok: true,
      data: {
        shortId: conf.short_id,
        status: conf.status as ConfessStatusResult["status"],
        removalReason: conf.removal_reason,
        body: conf.body,
        category: conf.category,
        recipient: conf.recipient,
        createdAt: conf.created_at,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memeriksa status",
    };
  }
}

/**
 * 4. Hapus / Tarik Kembali Confess Sendiri (menggunakan Kode Rahasia)
 */
export async function deleteOwnConfess(
  input: ManageConfessInput
): Promise<ActionResult<{ ok: true }>> {
  try {
    const parsed = ManageConfessSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parsed.error.issues[0]?.message || "Input tidak valid",
      };
    }

    const { shortId, secretCode } = parsed.data;
    const cleanSecret = secretCode.trim().toUpperCase();
    const hashed = hashSecretCode(cleanSecret);

    const supabaseAdmin = createAdminClient();
    const { data: conf, error } = await supabaseAdmin
      .from("confessions")
      .select("id, short_id, secret_code_hash")
      .eq("short_id", shortId.toLowerCase())
      .single();

    if (error || !conf || conf.secret_code_hash !== hashed) {
      return {
        ok: false,
        error: "UNAUTHORIZED",
        message: "ID confess atau kode rahasia tidak cocok.",
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from("confessions")
      .update({
        status: "removed",
        removal_reason: "Dihapus oleh pengirim sendiri",
      })
      .eq("id", conf.id);

    if (updateError) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menghapus confess",
      };
    }

    revalidatePath("/");
    revalidatePath(`/c/${shortId.toLowerCase()}`);

    return { ok: true, data: { ok: true } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus confess",
    };
  }
}

/**
 * 5. Kirim Balasan Anonim ke Confess
 * Anonimitas mutlak: tidak membaca auth, tidak menyimpan IP mentah.
 */
export async function submitConfessReply(
  input: SubmitConfessReplyInput
): Promise<
  ActionResult<{
    id: string;
    status: "pending" | "published";
  }>
> {
  try {
    const parseResult = SubmitConfessReplySchema.safeParse(input);
    if (!parseResult.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parseResult.error.issues[0]?.message || "Input tidak valid",
      };
    }

    const { confessionId, body } = parseResult.data;

    const supabaseAdmin = createAdminClient();

    // Cek saklar darurat jeda confess
    const { data: pausedSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "confess_paused")
      .single();

    if (pausedSetting && pausedSetting.value === true) {
      return {
        ok: false,
        error: "FORBIDDEN",
        message: "Pengiriman balasan confess sedang diistirahatkan sementara.",
      };
    }

    // Ambil header untuk kalkulasi fingerprint terlindungi (tanpa me-log IP)
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headerList.get("user-agent") || "unknown";
    const senderHash = generateSenderHash(ip, userAgent);

    // Cek apakah sender diblokir
    const { data: blocked } = await supabaseAdmin
      .from("blocked_senders")
      .select("expires_at")
      .eq("sender_hash", senderHash)
      .single();

    if (blocked) {
      const now = new Date();
      if (!blocked.expires_at || new Date(blocked.expires_at) > now) {
        return {
          ok: false,
          error: "BLOCKED",
          message: "Perangkat ini dibatasi dari pengiriman pesan.",
        };
      }
    }

    // Cek apakah target confess ada dan masih terbit
    const { data: targetConfess, error: confError } = await supabaseAdmin
      .from("confessions")
      .select("id, short_id, status")
      .eq("id", confessionId)
      .single();

    if (confError || !targetConfess || targetConfess.status === "removed") {
      return {
        ok: false,
        error: "NOT_FOUND",
        message: "Confess tidak ditemukan atau sudah dihapus.",
      };
    }

    // Moderasi otomatis pada balasan
    const modResult = inspectConfess(body);
    if (modResult.hasPII) {
      return {
        ok: false,
        error: "PII_DETECTED",
        message:
          "Sepertinya ada data pribadi (HP/NIK/Email) pada balasanmu. Demi keamanan, harap hapus terlebih dahulu ya.",
      };
    }

    const status: "pending" | "published" = modResult.shouldHold
      ? "pending"
      : "published";

    const { data: reply, error: insertError } = await supabaseAdmin
      .from("confession_replies")
      .insert({
        confession_id: confessionId,
        body,
        status,
        sender_hash: senderHash,
        auto_flags: modResult.allFlags,
      })
      .select("id")
      .single();

    if (insertError || !reply) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal mengirim balasan.",
      };
    }

    revalidatePath(`/c/${targetConfess.short_id}`);

    return {
      ok: true,
      data: {
        id: reply.id,
        status,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses balasan",
    };
  }
}


