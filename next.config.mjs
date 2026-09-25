/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma's Neon adapter talks to Postgres over WebSockets via `ws`. Bundling
    // `ws` breaks its native buffer helper ("bufferUtil.mask is not a function"),
    // so load these from node_modules at runtime instead.
    serverComponentsExternalPackages: ["ws", "@neondatabase/serverless", "@prisma/adapter-neon"],
  },
};

export default nextConfig;
