[23:20:55.389] Running build in Washington, D.C., USA (East) – iad1
[23:20:55.390] Build machine configuration: 2 cores, 8 GB
[23:20:55.403] Cloning github.com/aim840912/haode-nextjs (Branch: develop, Commit: 44df3e1)
[23:20:56.382] Cloning completed: 979.000ms
[23:20:57.769] Restored build cache from previous deployment (Eq2VXHGayFtJHX8HnnNGRshWSSGB)
[23:21:01.338] Running "vercel build"
[23:21:01.758] Vercel CLI 45.0.10
[23:21:02.114] Warning: Detected "engines": { "node": ">=18.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
[23:21:02.125] Running "install" command: `npm ci`...
[23:21:06.955] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[23:21:09.298] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[23:21:18.604]
[23:21:18.605] added 741 packages, and audited 742 packages in 16s
[23:21:18.606]
[23:21:18.606] 184 packages are looking for funding
[23:21:18.606]   run `npm fund` for details
[23:21:18.607]
[23:21:18.607] found 0 vulnerabilities
[23:21:18.691] Detected Next.js version: 15.4.6
[23:21:18.691] Running "npm run build"
[23:21:18.812]
[23:21:18.812] > my-nextjs-app@0.1.0 build
[23:21:18.813] > next build
[23:21:18.813]
[23:21:19.811]    ▲ Next.js 15.4.6
[23:21:19.812]    - Experiments (use with caution):
[23:21:19.813]      ✓ optimizeCss
[23:21:19.813]      · optimizePackageImports
[23:21:19.813]
[23:21:19.853]    Creating an optimized production build ...
[23:21:38.123]  ✓ Compiled successfully in 18.0s
[23:21:38.128]    Skipping linting
[23:21:38.128]    Checking validity of types ...
[23:21:49.756]    Collecting page data ...
[23:21:53.113]    Generating static pages (0/52) ...
[23:21:53.731] Error occurred prerendering page "/500". Read more: https://nextjs.org/docs/messages/prerender-error
[23:21:53.732] [Error: Cannot find module 'critters'
[23:21:53.732] Require stack:
[23:21:53.732] - /vercel/path0/node_modules/next/dist/compiled/next-server/pages.runtime.prod.js
[23:21:53.733] - /vercel/path0/.next/server/pages/_document.js
[23:21:53.733] - /vercel/path0/node_modules/next/dist/server/require.js
[23:21:53.733] - /vercel/path0/node_modules/next/dist/server/load-components.js
[23:21:53.733] - /vercel/path0/node_modules/next/dist/build/utils.js
[23:21:53.734] - /vercel/path0/node_modules/next/dist/build/worker.js
[23:21:53.734] - /vercel/path0/node_modules/next/dist/compiled/jest-worker/processChild.js] {
[23:21:53.734]   code: 'MODULE_NOT_FOUND',
[23:21:53.734]   requireStack: [Array]
[23:21:53.734] }
[23:21:53.734] Export encountered an error on /_error: /500, exiting the build.
[23:21:53.741]  ⨯ Next.js build worker exited with code: 1 and signal: null
[23:21:53.797] Error: Command "npm run build" exited with 1