import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moment Pakde — Komunitas MagangHub",
    short_name: "Moment Pakde",
    description: "Kumpulan momen & confess anak magang",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#f97316",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
