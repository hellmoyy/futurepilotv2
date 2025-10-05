/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require session/auth
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig