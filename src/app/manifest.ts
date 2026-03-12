import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradesFlow",
    short_name: "TradesFlow",
    description: "Field service operating system for trades businesses.",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#0A1A33",
    theme_color: "#0A1A33",
    icons: [
      {
        src: "/branding/tradesflow_svg_bundle/tradesflow-app-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/branding/tradesflow_svg_bundle/tradesflow-icon-only.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
