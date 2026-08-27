/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
