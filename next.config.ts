import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Das Entwickler-Abzeichen unten links blendet sich sonst über die Seite.
  // Beim Vorführen auf localhost soll der Kunde die Seite sehen, nicht das
  // Werkzeug, mit dem sie gebaut wurde.
  devIndicators: false,

  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }],
      },
    ];
  },
};

export default nextConfig;
