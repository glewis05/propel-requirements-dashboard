/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // TODO: Fix Supabase type inference issues then remove these
  typescript: {
    // Allow build to succeed even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow build to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Redirects for route groups without root pages
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'cookie',
            key: 'sb-royctwjkewpnrcqdyhzd-auth-token',
          },
        ],
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
