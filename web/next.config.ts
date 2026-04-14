import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hash / in-page nav: blur focus before scrollIntoView so fixed header & bottom
   * dock links do not trigger a second browser scroll after Next scrolls to #id. */
  experimental: {
    appNewScrollHandler: true,
  },
};

export default nextConfig;
