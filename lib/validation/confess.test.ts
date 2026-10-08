import { describe, it, expect } from "vitest";
import {
  SubmitConfessSchema,
  ManageConfessSchema,
  SubmitConfessReplySchema,
} from "./confess";

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

describe("ManageConfessSchema", () => {
  it("harus meloloskan shortId dan secretCode yang valid", () => {
    const res = ManageConfessSchema.safeParse({
      shortId: "a1b2c3d4",
      secretCode: "K7Q2-MX9P",
    });
    expect(res.success).toBe(true);
  });

  it("harus menolak jika shortId terlalu pendek", () => {
    const res = ManageConfessSchema.safeParse({
      shortId: "ab",
      secretCode: "K7Q2-MX9P",
    });
    expect(res.success).toBe(false);
  });
});

describe("SubmitConfessReplySchema", () => {
  it("harus meloloskan balasan yang valid", () => {
    const res = SubmitConfessReplySchema.safeParse({
      confessionId: "123e4567-e89b-12d3-a456-426614174000",
      body: "Semangat terus ya anak magang!",
      turnstileToken: "valid-token",
    });
    expect(res.success).toBe(true);
  });

  it("harus menolak jika body kosong atau terlalu panjang", () => {
    expect(
      SubmitConfessReplySchema.safeParse({
        confessionId: "123e4567-e89b-12d3-a456-426614174000",
        body: "",
        turnstileToken: "valid-token",
      }).success
    ).toBe(false);

    expect(
      SubmitConfessReplySchema.safeParse({
        confessionId: "123e4567-e89b-12d3-a456-426614174000",
        body: "a".repeat(501),
        turnstileToken: "valid-token",
      }).success
    ).toBe(false);
  });
});

