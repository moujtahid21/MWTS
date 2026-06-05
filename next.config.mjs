/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are GA in Next 14; kept here for clarity of intent.
  },
};

export default nextConfig;
