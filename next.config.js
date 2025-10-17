/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Disable static optimization for pages that require session/auth
    missingSuspenseWithCSRBailout: false,
    // Enable instrumentation hook for auto-start background tasks
    instrumentationHook: true,
  },
  // Remove standalone output for Railway - use standard build
  // output: 'standalone',
  // Disable type checking and linting during build (optional)
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig