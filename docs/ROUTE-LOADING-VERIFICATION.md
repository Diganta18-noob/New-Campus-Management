# Route loading verification — 2026-11-04

All page routes now use React lazy imports and an accessible Suspense loading state. Existing authorization wrappers remain in place.

Production build using committed Vite configuration passed: main JavaScript fell from 2,044.32 KB (620.77 KB gzip) to 504.46 KB (168.11 KB gzip). This measures the main emitted file, not total transferred bytes. Shared dependencies and page chunks are additional requests. The people management chunk remains 819 KB and needs a later import optimization.

Both browser suites passed against the production build: login/reset routing, dashboard navigation and themes, insights, focused batch destinations, reports, 320px and reduced motion. API fixtures were used for these browser checks. No backend behavior changed.
