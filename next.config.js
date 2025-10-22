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
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for SSL certificate issues in development (server-side only)
    if (isServer && process.env.NODE_ENV === 'development') {
      // Disable SSL verification for development only
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    return config;
  },
}

module.exports = nextConfig