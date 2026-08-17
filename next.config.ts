import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/sponsors", destination: "/sponsoring", permanent: false },
      { source: "/social", destination: "/social-media/kalender", permanent: false },
      { source: "/downloads", destination: "/media", permanent: false },
      { source: "/facturen", destination: "/sponsoring/facturen", permanent: false },
      { source: "/drankbonnen", destination: "/sponsoring/drankbonnen", permanent: false },
      { source: "/vrijkaarten", destination: "/sponsoring/vrijkaarten", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
