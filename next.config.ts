import type { NextConfig } from 'next'

const configured = (process.env.IMAGE_DOMAINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Google profile pictures are always allowed (OAuth sign-in).
const hostnames = Array.from(new Set([...configured, 'lh3.googleusercontent.com']))

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: hostnames.map((hostname) => ({ protocol: 'https' as const, hostname })),
    // Cache optimised images for 24 h (default is 60 s). Course thumbnails rarely change.
    minimumCacheTTL: 86400,
  },
  experimental: {
    // Tree-shake icon and Radix UI barrel exports — reduces client JS on every page.
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
}

export default nextConfig
