import { z } from "zod";

export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, "Nama tampilan maksimal 50 karakter")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(160, "Bio maksimal 160 karakter")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
