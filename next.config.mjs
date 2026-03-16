import withPWAInit from "@ducanh2912/next-pwa";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const now = new Date();
const buildNumber = now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0');

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
  env: {
    NEXT_PUBLIC_BUILD_NUMBER: buildNumber,
  },
};

export default withPWA(nextConfig);
