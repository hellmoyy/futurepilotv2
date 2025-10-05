/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require session/auth
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Output configuration for deployment
  output: 'standalone',
  // Skip generating error pages at build time
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig