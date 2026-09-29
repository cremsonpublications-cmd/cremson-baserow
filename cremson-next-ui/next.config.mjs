/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/uploads/:path*",
        destination: "https://api.cremsonpublications.com/uploads/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
