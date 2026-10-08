import { describe, it, expect } from "vitest";
import { CreateMomentSchema } from "./moment";

describe("CreateMomentSchema", () => {
  it("harus memvalidasi momen dengan 1 foto dan data lengkap", () => {
    const input = {
      caption: "Hari pertama magang di divisi tech!",
      tags: ["haripertama", "batch3"],
      momentDate: new Date(),
      location: "Pantry lt 5",
      photos: [
        {
          path: "moments/user-123/foto.webp",
          width: 800,
          height: 600,
          blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
        },
      ],
    };

    const result = CreateMomentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("harus menolak jika tidak ada foto", () => {
    const input = {
      caption: "Momen tanpa foto",
      tags: [],
      momentDate: new Date(),
      photos: [],
    };

    const result = CreateMomentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("harus menolak jika foto lebih dari 5", () => {
    const photos = Array.from({ length: 6 }, (_, i) => ({
      path: `moments/user-123/foto-${i}.webp`,
      width: 800,
      height: 600,
      blurhash: "test",
    }));

    const result = CreateMomentSchema.safeParse({
      caption: "Terlalu banyak foto",
      photos,
      momentDate: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("harus menolak tag dengan format tidak valid (huruf besar/spasi)", () => {
    const result = CreateMomentSchema.safeParse({
      caption: "Momen magang",
      tags: ["Tag Dengan Spasi"],
      photos: [
        {
          path: "moments/user-123/foto.webp",
          width: 800,
          height: 600,
          blurhash: "test",
        },
      ],
      momentDate: new Date(),
    });
    expect(result.success).toBe(false);
  });
});
