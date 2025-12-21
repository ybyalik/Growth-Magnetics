import type { NextConfig } from "next";

const replitDomains = process.env.REPLIT_DOMAINS?.split(",") || [];

const nextConfig: NextConfig = {
  allowedDevOrigins: replitDomains,
};

module.exports = nextConfig;
