import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel: no requiere configuración especial para SSR/ISR
  // Las variables NEXT_PUBLIC_* se exponen automáticamente al navegador
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
