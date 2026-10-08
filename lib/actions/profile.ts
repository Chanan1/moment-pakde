"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UpdateProfileSchema, UpdateProfileInput } from "@/lib/validation/profile";
import { ActionResult } from "@/lib/types/action";

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "UNAUTHORIZED",
      message: "Silakan masuk untuk mengubah profil.",
    };
  }

  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION",
      message: parsed.error.issues[0]?.message ?? "Input profil tidak valid",
    };
  }

  const { displayName, bio } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName ?? null,
      bio: bio ?? null,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Gagal memperbarui profil.",
    };
  }

  revalidatePath("/");
  return { ok: true, data: { success: true } };
}
