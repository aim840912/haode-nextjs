[02:01:42.174] Running build in Washington, D.C., USA (East) – iad1
[02:01:42.185] Build machine configuration: 2 cores, 8 GB
[02:01:42.223] Cloning github.com/aim840912/haode-nextjs (Branch: develop, Commit: ab5611c)
[02:01:43.120] Cloning completed: 897.000ms
[02:01:45.954] Restored build cache from previous deployment (9juB3i1S6MYrnKGRzxU4GXMRJ8TU)
[02:01:50.643] Running "vercel build"
[02:01:51.077] Vercel CLI 46.0.2
[02:01:51.459] Warning: Detected "engines": { "node": ">=20.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
[02:01:51.469] Running "install" command: `npm ci`...
[02:02:07.124]
[02:02:07.125] added 405 packages, and audited 406 packages in 15s
[02:02:07.126]
[02:02:07.126] 144 packages are looking for funding
[02:02:07.127]   run `npm fund` for details
[02:02:07.127]
[02:02:07.127] found 0 vulnerabilities
[02:02:07.192] Detected Next.js version: 15.4.6
[02:02:07.192] Running "npm run build"
[02:02:07.348]
[02:02:07.349] > my-nextjs-app@0.1.0 build
[02:02:07.349] > npx next build
[02:02:07.349]
[02:02:08.702]    ▲ Next.js 15.4.6
[02:02:08.704]    - Experiments (use with caution):
[02:02:08.704]      · optimizePackageImports
[02:02:08.704]
[02:02:08.748]    Creating an optimized production build ...
[02:02:20.784]  ✓ Compiled successfully in 11.0s
[02:02:20.789]    Skipping linting
[02:02:20.790]    Checking validity of types ...
[02:02:34.593]    Collecting page data ...
[02:02:35.088] unhandledRejection ReferenceError: self is not defined
[02:02:35.089]     at Object.<anonymous> (.next/server/vendors.js:1:1) {
[02:02:35.089]   type: 'ReferenceError'
[02:02:35.089] }
[02:02:35.142] Error: Command "npm run build" exited with 1