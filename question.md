[22:41:51.873] Running build in Washington, D.C., USA (East) – iad1
[22:41:51.874] Build machine configuration: 2 cores, 8 GB
[22:41:51.905] Cloning github.com/aim840912/haode-nextjs (Branch: develop, Commit: 2eb27b2)
[22:41:52.581] Cloning completed: 676.000ms
[22:41:54.287] Restored build cache from previous deployment (Eq2VXHGayFtJHX8HnnNGRshWSSGB)
[22:41:58.808] Running "vercel build"
[22:41:59.226] Vercel CLI 45.0.10
[22:41:59.573] Warning: Detected "engines": { "node": ">=18.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
[22:41:59.586] Running "install" command: `npm ci`...
[22:42:04.167] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[22:42:06.440] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[22:42:15.856]
[22:42:15.857] added 741 packages, and audited 742 packages in 16s
[22:42:15.858]
[22:42:15.858] 184 packages are looking for funding
[22:42:15.858]   run `npm fund` for details
[22:42:15.861]
[22:42:15.861] found 0 vulnerabilities
[22:42:15.908] Detected Next.js version: 15.4.6
[22:42:15.908] Running "npm run build"
[22:42:16.145]
[22:42:16.148] > my-nextjs-app@0.1.0 build
[22:42:16.148] > next build
[22:42:16.148]
[22:42:17.060]    ▲ Next.js 15.4.6
[22:42:17.061]    - Experiments (use with caution):
[22:42:17.061]      ✓ optimizeCss
[22:42:17.061]      · optimizePackageImports
[22:42:17.061]
[22:42:17.105]    Creating an optimized production build ...
[22:42:35.072]  ✓ Compiled successfully in 17.0s
[22:42:35.077]    Linting and checking validity of types ...
[22:42:46.039]
[22:42:46.043] Failed to compile.
[22:42:46.044]
[22:42:46.044] ./src/app/admin/culture/[id]/edit/page.tsx
[22:42:46.045] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.051] 368:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.052]
[22:42:46.052] ./src/app/admin/culture/add/page.tsx
[22:42:46.052] 23:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.052] 223:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.055] 244:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.056] 422:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.056]
[22:42:46.056] ./src/app/admin/farm-tour/[id]/edit/page.tsx
[22:42:46.056] 14:17  Warning: 'isLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.057] 47:6  Warning: React Hook useEffect has missing dependencies: 'fetchActivity' and 'params'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[22:42:46.057]
[22:42:46.057] ./src/app/admin/farm-tour/add/page.tsx
[22:42:46.059] 11:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.060] 496:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.060] 568:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.060]
[22:42:46.060] ./src/app/admin/locations/[id]/edit/page.tsx
[22:42:46.060] 14:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.061] 636:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.061] 694:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.064]
[22:42:46.064] ./src/app/admin/news/[id]/edit/page.tsx
[22:42:46.064] 28:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.064] 257:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.073] 417:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.079]
[22:42:46.080] ./src/app/admin/news/add/page.tsx
[22:42:46.080] 25:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.080] 208:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.081] 368:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.081]
[22:42:46.081] ./src/app/admin/news/page.tsx
[22:42:46.081] 130:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.081]
[22:42:46.081] ./src/app/admin/products/[id]/edit/page.tsx
[22:42:46.081] 133:15  Warning: 'salePrice' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.081] 343:28  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[22:42:46.081] 343:48  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[22:42:46.081] 500:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.082]
[22:42:46.082] ./src/app/admin/products/add/page.tsx
[22:42:46.082] 31:6  Warning: React Hook useEffect has a missing dependency: 'fetchCategories'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[22:42:46.082] 94:15  Warning: 'salePrice' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 275:28  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[22:42:46.082] 275:48  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[22:42:46.082]
[22:42:46.082] ./src/app/admin/reviews/page.tsx
[22:42:46.082] 23:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[22:42:46.082]
[22:42:46.082] ./src/app/api/cart/[itemId]/route.ts
[22:42:46.082] 82:13  Warning: 'itemId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082]
[22:42:46.082] ./src/app/api/cart/route.ts
[22:42:46.082] 1:10  Warning: 'NextRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 73:11  Warning: 'userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082]
[22:42:46.082] ./src/app/api/farm-tour/[id]/route.ts
[22:42:46.082] 13:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 30:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 46:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082]
[22:42:46.082] ./src/app/api/farm-tour/route.ts
[22:42:46.082] 9:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 20:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082]
[22:42:46.082] ./src/app/api/search/route.ts
[22:42:46.082] 78:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.082] 105:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.082]
[22:42:46.082] ./src/app/api/stats/track/route.ts
[22:42:46.082] 16:7  Warning: 'page_path' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.082] 17:7  Warning: 'page_title' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083] 18:7  Warning: 'referrer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083]
[22:42:46.083] ./src/app/api/stats/visitors/route.ts
[22:42:46.083] 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083]
[22:42:46.083] ./src/app/cart/page.tsx
[22:42:46.083] 34:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083] 41:9  Warning: 'handleClearCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083] 47:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083]
[22:42:46.083] ./src/app/culture/page.tsx
[22:42:46.083] 27:7  Warning: 'getRandomImage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.083] 138:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.088] 182:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 239:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089]
[22:42:46.089] ./src/app/locations/page.tsx
[22:42:46.089] 12:10  Warning: 'showMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.089] 12:19  Warning: 'setShowMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.089]
[22:42:46.089] ./src/app/news/[id]/page.tsx
[22:42:46.089] 137:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 143:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 211:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 217:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089]
[22:42:46.089] ./src/app/news/page.tsx
[22:42:46.089] 143:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 149:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 200:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 206:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089]
[22:42:46.089] ./src/app/page.tsx
[22:42:46.089] 3:10  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.089] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.089] 4:8  Warning: 'Link' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.089] 71:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 240:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 253:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.089] 266:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.090] 279:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.090]
[22:42:46.090] ./src/app/products/page.tsx
[22:42:46.090] 91:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.090] 138:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.090] 147:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.090] 243:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.091] 278:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.091] 331:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.091] 360:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.091] 377:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.091] 389:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.091]
[22:42:46.091] ./src/app/profile/page.tsx
[22:42:46.091] 113:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.092]
[22:42:46.092] ./src/app/reviews/page.tsx
[22:42:46.092] 11:10  Warning: 'showForm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.092] 98:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092]
[22:42:46.092] ./src/app/schedule/page.tsx
[22:42:46.092] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.092] 88:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092] 96:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092] 105:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092] 114:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092]
[22:42:46.092] ./src/app/sitemap.ts
[22:42:46.092] 82:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092] 83:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092]
[22:42:46.092] ./src/components/ErrorBoundary.tsx
[22:42:46.092] 8:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092] 26:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092]
[22:42:46.092] ./src/components/LoadingSpinner.tsx
[22:42:46.092] 76:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.092]
[22:42:46.092] ./src/components/ProductsSection.tsx
[22:42:46.092] 111:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[22:42:46.092]
[22:42:46.092] ./src/components/ReviewList.tsx
[22:42:46.092] 30:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[22:42:46.092]
[22:42:46.093] ./src/components/StructuredData.tsx
[22:42:46.093] 4:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 85:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 113:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093]
[22:42:46.093] ./src/components/VisitorTracker.tsx
[22:42:46.093] 94:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 95:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093]
[22:42:46.093] ./src/lib/api-cache.ts
[22:42:46.093] 11:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 68:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetcher'. Either include it or remove the dependency array. If 'fetcher' changes too often, find the parent component that defines it and wrap that definition in useCallback.  react-hooks/exhaustive-deps
[22:42:46.093]
[22:42:46.093] ./src/lib/api-response.ts
[22:42:46.093] 1:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 84:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093]
[22:42:46.093] ./src/lib/auth-context.tsx
[22:42:46.093] 50:16  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.093]
[22:42:46.093] ./src/lib/auth-middleware.ts
[22:42:46.093] 60:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[22:42:46.093] 66:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.093]
[22:42:46.093] ./src/lib/cart-context.tsx
[22:42:46.093] 4:26  Warning: 'AddToCartRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094] 131:21  Warning: 'setIsLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094]
[22:42:46.094] ./src/lib/mock-auth.ts
[22:42:46.094] 86:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094] 119:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094] 135:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094] 156:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[22:42:46.094]
[22:42:46.094] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[22:42:46.153] Error: Command "npm run build" exited with 1