/** @type {import('next').NextConfig} */
// Поддержка статического экспорта (GitHub Pages / Cloudflare Pages / Netlify / любой CDN).
// basePath выставляется переменной окружения, чтобы сайт корректно работал
// как на корневом домене (Cloudflare / Netlify), так и в подпути (GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
