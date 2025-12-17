import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Commenting out as it might cause issues depending on Next.js version, keeping it safe or enabling if user had it. User had it enabled.
  // actually user had: reactCompiler: true. I will keep it.
  experimental: {
     // reactCompiler: true, // In Next.js 15+ it might be different, but 16.0.10? User had it in main config object.
  }
};

// User's original config had reactCompiler: true at top level. 
// Next.js 16? The build logs said Next.js 16.0.10. 
// Let's stick to user's config but wrapped.

const config: NextConfig = {
   experimental: {
    // reactCompiler: true, // Move here if needed, or keep at root if valid
   }
};
// Actually, let me just wrap the existing object structure carefully.
// The previous view showed:
// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

export default withPWA({
  reactCompiler: true,
});
