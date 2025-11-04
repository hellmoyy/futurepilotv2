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
  // Explicitly expose public env vars to client-side (for Railway compatibility)
  env: {
    NEXT_PUBLIC_CAPTCHA_ENABLED: process.env.NEXT_PUBLIC_CAPTCHA_ENABLED,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
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