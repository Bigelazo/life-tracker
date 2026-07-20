import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life Tracker",
    short_name: "Life Tracker",
    description:
      "Personal habits, finance and notes hub — one calm, paper-light home for your day.",
    start_url: "/today",
    display: "standalone",
    background_color: "#f6f5f4",
    theme_color: "#f6f5f4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
