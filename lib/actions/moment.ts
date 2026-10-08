"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateMomentSchema, CreateMomentInput } from "@/lib/validation/moment";
import { ActionResult } from "@/lib/types/action";
import { MomentEmoji } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

interface RequestUploadUrlsInput {
  files: {
    contentType: "image/webp" | "image/jpeg" | "image/png";
    size: number;
  }[];
}

interface UploadUrlResult {
  path: string;
  signedUrl: string;
  token: string;
}

/**
 * 1. Request Signed Upload URLs
 */
export async function requestUploadUrls(
  input: RequestUploadUrlsInput
): Promise<ActionResult<{ uploads: UploadUrlResult[] }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login terlebih dahulu" };
    }

    if (!input.files || input.files.length === 0 || input.files.length > 5) {
      return {
        ok: false,
        error: "VALIDATION",
        message: "Pilih antara 1 sampai 5 foto",
      };
    }

    const uploads: UploadUrlResult[] = [];

    for (const file of input.files) {
      if (file.size > 10 * 1024 * 1024) {
        return {
          ok: false,
          error: "VALIDATION",
          message: "Ukuran tiap foto maksimal 10 MB",
        };
      }

      const fileId = crypto.randomUUID();
      const ext = file.contentType === "image/png" ? "png" : file.contentType === "image/webp" ? "webp" : "jpg";
      const filePath = `moments/${user.id}/${fileId}.${ext}`;

      const { data, error } = await supabase.storage
        .from("moments")
        .createSignedUploadUrl(filePath);

      if (error || !data) {
        return {
          ok: false,
          error: "INTERNAL",
          message: "Gagal membuat URL upload: " + (error?.message || "Storage error"),
        };
      }

      uploads.push({
        path: filePath,
        signedUrl: data.signedUrl,
        token: data.token,
      });
    }

    return { ok: true, data: { uploads } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan server",
    };
  }
}

/**
 * 2. Create Moment (Simpan data setelah foto berhasil diupload)
 */
export async function createMoment(
  input: CreateMomentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const parseResult = CreateMomentSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        ok: false,
        error: "VALIDATION",
        message: parseResult.error.issues[0]?.message || "Input tidak valid",
      };
    }

    const validData = parseResult.data;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login terlebih dahulu" };
    }

    // Pastikan path foto diawali folder milik user
    for (const photo of validData.photos) {
      if (!photo.path.startsWith(`moments/${user.id}/`)) {
        return {
          ok: false,
          error: "FORBIDDEN",
          message: "Path foto tidak valid",
        };
      }
    }

    // 1. Simpan baris moments
    const { data: moment, error: momentError } = await supabase
      .from("moments")
      .insert({
        user_id: user.id,
        caption: validData.caption,
        moment_date: validData.momentDate.toISOString().split("T")[0],
        location: validData.location || null,
        status: "published",
      })
      .select("id")
      .single();

    if (momentError || !moment) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menyimpan momen: " + momentError?.message,
      };
    }

    // 2. Simpan foto-foto
    const photoRows = validData.photos.map((p, index) => ({
      moment_id: moment.id,
      storage_path: p.path,
      width: p.width,
      height: p.height,
      blurhash: p.blurhash || null,
      alt_text: p.altText || null,
      position: index,
    }));

    const { error: photosError } = await supabase
      .from("moment_photos")
      .insert(photoRows);

    if (photosError) {
      // rollback moment jika gagal
      await supabase.from("moments").delete().eq("id", moment.id);
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menyimpan foto momen",
      };
    }

    // 3. Simpan tag bila ada
    if (validData.tags && validData.tags.length > 0) {
      for (const tagSlug of validData.tags) {
        // Upsert tag
        const { data: tagData } = await supabase
          .from("tags")
          .upsert({ slug: tagSlug }, { onConflict: "slug" })
          .select("id")
          .single();

        if (tagData) {
          await supabase
            .from("moment_tags")
            .insert({ moment_id: moment.id, tag_id: tagData.id });
        }
      }
    }

    revalidatePath("/");
    revalidatePath(`/m/${moment.id}`);

    return { ok: true, data: { id: moment.id } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan server",
    };
  }
}

/**
 * 3. Toggle Reaksi Emoji Moment
 */
export async function toggleMomentReaction(
  momentId: string,
  emoji: MomentEmoji
): Promise<ActionResult<{ reaction: MomentEmoji | null; count: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login untuk memberi reaksi" };
    }

    // Cek apakah user sudah bereaksi sebelumnya
    const { data: existing } = await supabase
      .from("moment_reactions")
      .select("emoji")
      .eq("moment_id", momentId)
      .eq("user_id", user.id)
      .maybeSingle();

    let newReaction: MomentEmoji | null = null;

    if (existing) {
      if (existing.emoji === emoji) {
        // Hapus reaksi (toggle off)
        await supabase
          .from("moment_reactions")
          .delete()
          .eq("moment_id", momentId)
          .eq("user_id", user.id);
        newReaction = null;
      } else {
        // Ganti reaksi
        await supabase
          .from("moment_reactions")
          .update({ emoji })
          .eq("moment_id", momentId)
          .eq("user_id", user.id);
        newReaction = emoji;
      }
    } else {
      // Reaksi baru
      await supabase
        .from("moment_reactions")
        .insert({ moment_id: momentId, user_id: user.id, emoji });
      newReaction = emoji;
    }

    // Ambil hitungan terbaru
    const { data: moment } = await supabase
      .from("moments")
      .select("reaction_count")
      .eq("id", momentId)
      .single();

    revalidatePath(`/m/${momentId}`);

    return {
      ok: true,
      data: {
        reaction: newReaction,
        count: moment?.reaction_count ?? 0,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Gagal memperbarui reaksi",
    };
  }
}

/**
 * 4. Tambah Komentar Moment
 */
export async function addComment(
  momentId: string,
  body: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 500) {
      return {
        ok: false,
        error: "VALIDATION",
        message: "Komentar harus berisi antara 1 hingga 500 karakter",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login untuk berkomentar" };
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        moment_id: momentId,
        user_id: user.id,
        body: trimmed,
        status: "published",
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal mengirim komentar: " + error?.message,
      };
    }

    revalidatePath(`/m/${momentId}`);

    return { ok: true, data: { id: data.id } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan server",
    };
  }
}

/**
 * 5. Hapus Komentar
 */
export async function deleteComment(
  commentId: string
): Promise<ActionResult<{ ok: true }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login terlebih dahulu" };
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menghapus komentar: " + error.message,
      };
    }

    return { ok: true, data: { ok: true } };
  } catch (err: unknown) {
    return {
      ok: false,
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Terjadi kesalahan",
    };
  }
}

/**
 * 6. Hapus Moment
 */
export async function deleteMoment(
  momentId: string
): Promise<ActionResult<{ ok: true }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Harap login terlebih dahulu" };
    }

    // Ambil foto-foto untuk dihapus dari storage
    const { data: photos } = await supabase
      .from("moment_photos")
      .select("storage_path")
      .eq("moment_id", momentId);

    const { error } = await supabase
      .from("moments")
      .delete()
      .eq("id", momentId);

    if (error) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Gagal menghapus momen: " + error.message,
      };
    }

    // Bersihkan file storage
    if (photos && photos.length > 0) {
      const paths = photos.map((p) => p.storage_path);
      await supabase.storage.from("moments").remove(paths);
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
