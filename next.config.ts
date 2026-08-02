import type { NextConfig } from 'next'

/**
 * Static export: there is no server (CONTEXT.md decision D1).
 * The whole app is text, SVG and math — it deploys to any static host.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
}

export default nextConfig
