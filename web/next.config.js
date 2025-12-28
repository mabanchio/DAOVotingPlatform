/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_DAO_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS,
    NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  },
};

module.exports = nextConfig;
