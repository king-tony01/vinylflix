/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com',
      'image.tmdb.org',
    ],
  },
};

export default nextConfig;
