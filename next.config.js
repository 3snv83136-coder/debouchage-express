/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // @react-pdf/renderer doit tourner côté Node, pas être bundlé pour le edge
  experimental: { serverComponentsExternalPackages: ["@react-pdf/renderer"] },
};
module.exports = nextConfig;
