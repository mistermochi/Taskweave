import withPWAInit from "@ducanh2912/next-pwa";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // skipWaiting: true, // Disabled to allow manual update prompt
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: basePath,
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
