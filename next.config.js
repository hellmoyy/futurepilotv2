/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require session/auth
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Output configuration for deployment
  output: 'standalone',
  // Disable generation of default error pages to prevent Pages Router conflicts
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig