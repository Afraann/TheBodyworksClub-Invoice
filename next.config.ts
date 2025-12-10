import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  
  // Advanced Workbox Config for POS/Inventory Accuracy
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // RULE 1: CRITICAL - Never cache mutations (Creating Invoices/Updating Stock)
        // We force these to go to the network to prevent data conflicts.
        urlPattern: ({ request }) => request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE',
        handler: 'NetworkOnly', 
      },
      {
        // RULE 2: Data Fetching (React Server Components)
        // Try to get fresh stock/sales data first. If offline, use the cache.
        urlPattern: /^https?.+\?_rsc=/,
        handler: 'NetworkFirst', 
        options: {
          cacheName: 'next-rsc-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        // RULE 3: Static Assets (Images, Logos)
        // Cache these aggressively so the app looks good offline immediately.
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      {
        // RULE 4: Pages / Navigation
        // Try to load the fresh page. If offline, load the cached page.
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, 
          },
        },
      }
    ],
  },
});

const nextConfig: NextConfig = {
  // You can add other Next.js config options here if needed
  // experimental: { ... }
};

export default withPWA(nextConfig);