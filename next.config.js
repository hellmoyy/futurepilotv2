/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require session/auth
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Output configuration for deployment
  output: 'standalone',
  // Disable type checking and linting during build (optional)
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig