import { z } from "zod";

export const CreateMomentSchema = z.object({
  caption: z.string().max(2200, "Caption maksimal 2.200 karakter").default(""),
  tags: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9_]{1,30}$/, "Tag hanya boleh huruf kecil, angka, dan underscore")
    )
    .max(10, "Maksimal 10 tag")
    .default([]),
  momentDate: z.coerce
    .date()
    .refine(
      (d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
      "Tanggal momen tidak boleh di masa depan"
    ),
  location: z.string().max(100, "Lokasi maksimal 100 karakter").optional(),
  photos: z
    .array(
      z.object({
        path: z.string(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        blurhash: z.string().max(100),
        altText: z.string().max(300).optional(),
      })
    )
    .min(1, "Minimal pilih 1 foto")
    .max(5, "Maksimal 5 foto per momen"),
});

export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;
