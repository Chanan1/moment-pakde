"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, X, Plus, AlertCircle, Loader2 } from "lucide-react";
import { requestUploadUrls, createMoment } from "@/lib/actions/moment";

const SUGGESTED_TAGS = ["haripertama", "lembur", "makansiang", "farewell", "batch3", "kantor"];

export default function UploadMomentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [momentDate, setMomentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles = Array.from(selected);
    const combined = [...files, ...newFiles].slice(0, 5);

    setFiles(combined);

    // Buat URL preview
    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setErrorMessage(null);
  }

  function handleRemoveFile(index: number) {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  }

  function handleAddTag(tag: string) {
    const clean = tag.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean || tags.includes(clean) || tags.length >= 10) return;
    setTags([...tags, clean]);
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMessage("Harap pilih minimal 1 foto");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Request signed upload URLs
      const uploadRequest = await requestUploadUrls({
        files: files.map((f) => ({
          contentType: f.type as "image/webp" | "image/jpeg" | "image/png",
          size: f.size,
        })),
      });

      if (!uploadRequest.ok) {
        setErrorMessage(uploadRequest.message);
        setIsSubmitting(false);
        return;
      }

      const { uploads } = uploadRequest.data;
      const uploadedPhotos = [];

      // 2. Upload file ke Supabase Storage via signed URL
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadInfo = uploads[i];

        const uploadRes = await fetch(uploadInfo.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Gagal mengunggah foto ke-${i + 1}`);
        }

        uploadedPhotos.push({
          path: uploadInfo.path,
          width: 800,
          height: 600,
          blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
        });
      }

      // 3. Simpan baris moment ke database
      const createRes = await createMoment({
        caption,
        momentDate: new Date(momentDate),
        location: location || undefined,
        tags,
        photos: uploadedPhotos,
      });

      if (!createRes.ok) {
        setErrorMessage(createRes.message);
        setIsSubmitting(false);
        return;
      }

      // Berhasil, redirect ke detail
      router.push(`/m/${createRes.data.id}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah"
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <h1 className="text-sm font-semibold">Bagikan Momen</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Area Foto */}
          <div>
            <label className="block text-xs font-semibold mb-2">
              Foto Momen ({files.length}/5)
            </label>

            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[var(--line)] bg-stone-100"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label="Hapus foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {files.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] flex flex-col items-center justify-center gap-1 transition-colors text-[var(--ink-muted)] hover:text-[var(--accent)]"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[11px] font-medium">+ Foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Cerita / Caption
            </label>
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={4}
                placeholder="Ceritain momen magangnya..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-[var(--ink-muted)]">
                {caption.length}/2200
              </span>
            </div>
          </div>

          {/* Tanggal & Lokasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Tanggal Momen
              </label>
              <input
                type="date"
                value={momentDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setMomentDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Lokasi (opsional)
              </label>
              <input
                type="text"
                placeholder="Mis. Pantry lt 7"
                value={location}
                maxLength={100}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Tag / Hashtag ({tags.length}/10)
            </label>

            {/* Chip terpasang */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone-200 text-[var(--ink)]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Input tag baru */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Tambah tag baru (tekan Enter)"
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-xs font-medium hover:bg-stone-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Rekomendasi Tag Magang */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-[var(--ink-muted)]">Saran:</span>
              {SUGGESTED_TAGS.filter((st) => !tags.includes(st)).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  #{st}
                </button>
              ))}
            </div>
          </div>

          {/* Pengingat Privasi Kantor */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span className="font-semibold">⚠️ Pengingat Privasi: </span>
            Pastikan tidak ada dokumen rahasia kantor, layar kerja, atau kode confidential di latar belakang foto ya!
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isSubmitting || files.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sedang Mengunggah Momen...</span>
              </>
            ) : (
              <span>Bagikan Momen</span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
