/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require session/auth
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Output configuration for deployment
  output: 'standalone',
}

module.exports = nextConfig