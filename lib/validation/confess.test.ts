import { describe, it, expect } from "vitest";
import { SubmitConfessSchema } from "./confess";

describe("SubmitConfessSchema", () => {
  it("harus meloloskan confess dengan data lengkap dan valid", () => {
    const input = {
      body: "Terima kasih banyak kak mentor sudah mengajari saya selama magang!",
      recipient: "Mentor Divisi Mobile",
      category: "terima_kasih",
      turnstileToken: "valid-token",
    };

    const res = SubmitConfessSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("harus menolak confess yang kurang dari 10 karakter", () => {
    const input = {
      body: "halo",
      category: "curhat",
      turnstileToken: "valid-token",
    };

    const res = SubmitConfessSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("harus menolak confess yang lebih dari 1000 karakter", () => {
    const input = {
      body: "a".repeat(1001),
      category: "curhat",
      turnstileToken: "valid-token",
    };

    const res = SubmitConfessSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("harus menolak kategori yang tidak dikenal", () => {
    const input = {
      body: "Ini isi confess yang cukup panjang",
      category: "kategori_palsu",
      turnstileToken: "valid-token",
    };

    const res = SubmitConfessSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("harus menolak jika turnstileToken kosong", () => {
    const input = {
      body: "Ini isi confess yang cukup panjang",
      category: "curhat",
      turnstileToken: "",
    };

    const res = SubmitConfessSchema.safeParse(input);
    expect(res.success).toBe(false);
  });
});
