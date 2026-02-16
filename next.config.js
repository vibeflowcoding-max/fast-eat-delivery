/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // output: 'export', // Descomenta esta línea solo si eliges "Static Site" en Render
};

export default nextConfig;
