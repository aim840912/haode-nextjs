[00:57:25.049] Running build in Washington, D.C., USA (East) – iad1
[00:57:25.050] Build machine configuration: 2 cores, 8 GB
[00:57:25.071] Cloning github.com/aim840912/haode-nextjs (Branch: main, Commit: 556d7d3)
[00:57:25.091] Skipping build cache, deployment was triggered without cache.
[00:57:26.783] Cloning completed: 1.711s
[00:57:28.648] Running "vercel build"
[00:57:29.319] Vercel CLI 44.7.3
[00:57:29.706] Running "install" command: `npm install`...
[00:57:41.618]
[00:57:41.619] added 381 packages, and audited 382 packages in 12s
[00:57:41.619]
[00:57:41.619] 142 packages are looking for funding
[00:57:41.620]   run `npm fund` for details
[00:57:41.620]
[00:57:41.620] found 0 vulnerabilities
[00:57:41.681] Detected Next.js version: 15.4.6
[00:57:41.682] Running "npm run build"
[00:57:42.136]
[00:57:42.137] > my-nextjs-app@0.1.0 build
[00:57:42.137] > next build
[00:57:42.137]
[00:57:42.927] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[00:57:42.928] This information is used to shape Next.js' roadmap and prioritize features.
[00:57:42.929] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[00:57:42.929] https://nextjs.org/telemetry
[00:57:42.929]
[00:57:43.038]    ▲ Next.js 15.4.6
[00:57:43.039]    - Experiments (use with caution):
[00:57:43.039]      · optimizePackageImports
[00:57:43.039]
[00:57:43.080]    Creating an optimized production build ...
[00:58:05.180]  ✓ Compiled successfully in 18.0s
[00:58:05.182]    Linting and checking validity of types ...
[00:58:14.163]
[00:58:14.163] Failed to compile.
[00:58:14.164]
[00:58:14.164] ./src/app/admin/culture/[id]/edit/page.tsx
[00:58:14.164] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.164] 368:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.164]
[00:58:14.164] ./src/app/admin/culture/add/page.tsx
[00:58:14.164] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.164] 61:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.165] 61:37  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.165] 62:43  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.165] 222:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.165] 243:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.165] 421:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.165]
[00:58:14.165] ./src/app/admin/farm-tour/[id]/edit/page.tsx
[00:58:14.166] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.166] 80:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.166] 85:6  Warning: React Hook useEffect has missing dependencies: 'fetchActivity' and 'params'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[00:58:14.166]
[00:58:14.166] ./src/app/admin/farm-tour/add/page.tsx
[00:58:14.166] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.166]
[00:58:14.166] ./src/app/admin/locations/[id]/edit/page.tsx
[00:58:14.166] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.168] 80:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 114:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169]
[00:58:14.169] ./src/app/admin/news/[id]/edit/page.tsx
[00:58:14.169] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 79:21  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 106:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169]
[00:58:14.169] ./src/app/admin/news/add/page.tsx
[00:58:14.169] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169]
[00:58:14.169] ./src/app/admin/products/[id]/edit/page.tsx
[00:58:14.169] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 65:24  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 92:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169] 313:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.169]
[00:58:14.169] ./src/app/admin/products/add/page.tsx
[00:58:14.169] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.169]
[00:58:14.170] ./src/app/admin/reviews/page.tsx
[00:58:14.170] 23:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[00:58:14.170]
[00:58:14.170] ./src/app/admin/schedule/[id]/edit/page.tsx
[00:58:14.170] 56:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170] 78:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170] 88:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170] 117:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170]
[00:58:14.170] ./src/app/admin/schedule/add/page.tsx
[00:58:14.170] 53:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170] 66:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[00:58:14.170]
[00:58:14.170] ./src/app/api/cart/[itemId]/route.ts
[00:58:14.170] 82:13  Warning: 'itemId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.170]
[00:58:14.170] ./src/app/api/cart/route.ts
[00:58:14.170] 1:10  Warning: 'NextRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.170] 73:11  Warning: 'userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.170]
[00:58:14.171] ./src/app/api/farm-tour/[id]/route.ts
[00:58:14.171] 13:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171] 30:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171] 46:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171]
[00:58:14.171] ./src/app/api/farm-tour/route.ts
[00:58:14.171] 9:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171] 20:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171]
[00:58:14.171] ./src/app/api/stats/track/route.ts
[00:58:14.171] 16:7  Warning: 'page_path' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171] 17:7  Warning: 'page_title' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171] 18:7  Warning: 'referrer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171]
[00:58:14.171] ./src/app/api/stats/visitors/route.ts
[00:58:14.171] 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.171]
[00:58:14.171] ./src/app/cart/page.tsx
[00:58:14.171] 33:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.172] 40:9  Warning: 'handleClearCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.172] 46:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.172]
[00:58:14.172] ./src/app/culture/page.tsx
[00:58:14.172] 27:7  Warning: 'getRandomImage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.172] 138:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.172] 182:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.172] 239:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.172]
[00:58:14.172] ./src/app/locations/page.tsx
[00:58:14.192] 12:10  Warning: 'showMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.192] 12:19  Warning: 'setShowMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.198]
[00:58:14.198] ./src/app/login/page.tsx
[00:58:14.198] 14:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.198]
[00:58:14.198] ./src/app/news/[id]/page.tsx
[00:58:14.198] 136:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.198] 204:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.198]
[00:58:14.198] ./src/app/news/page.tsx
[00:58:14.198] 138:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 188:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199]
[00:58:14.199] ./src/app/page.tsx
[00:58:14.199] 33:6  Warning: React Hook useEffect has a missing dependency: 'farmImages'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[00:58:14.199] 51:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 241:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 254:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 280:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199]
[00:58:14.199] ./src/app/products/page.tsx
[00:58:14.199] 88:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 93:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 102:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 174:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 208:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 260:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.199] 288:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 305:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199] 317:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.199]
[00:58:14.199] ./src/app/profile/page.tsx
[00:58:14.199] 113:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.199]
[00:58:14.199] ./src/app/reviews/page.tsx
[00:58:14.199] 11:10  Warning: 'showForm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.199] 98:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200]
[00:58:14.200] ./src/app/schedule/page.tsx
[00:58:14.200] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.200] 88:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200] 96:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200] 105:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200] 114:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200]
[00:58:14.200] ./src/components/CustomerReviews.tsx
[00:58:14.200] 69:45  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.200] 94:17  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[00:58:14.200] 94:34  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[00:58:14.200] 173:23  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[00:58:14.200] 173:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[00:58:14.200]
[00:58:14.200] ./src/components/LoadingSpinner.tsx
[00:58:14.200] 76:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.200]
[00:58:14.200] ./src/components/ProductsSection.tsx
[00:58:14.200] 72:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[00:58:14.200]
[00:58:14.200] ./src/components/ReviewList.tsx
[00:58:14.200] 30:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[00:58:14.200]
[00:58:14.200] ./src/components/VisitorTracker.tsx
[00:58:14.200] 94:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.201] 95:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.201]
[00:58:14.201] ./src/lib/api-cache.ts
[00:58:14.208] 11:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.208] 68:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.209] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetcher'. Either include it or remove the dependency array. If 'fetcher' changes too often, find the parent component that defines it and wrap that definition in useCallback.  react-hooks/exhaustive-deps
[00:58:14.209]
[00:58:14.209] ./src/lib/api-response.ts
[00:58:14.209] 1:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.209] 84:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.210]
[00:58:14.210] ./src/lib/auth-context.tsx
[00:58:14.210] 50:16  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.210]
[00:58:14.210] ./src/lib/auth-middleware.ts
[00:58:14.211] 16:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.211] 22:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.211]
[00:58:14.211] ./src/lib/cart-context.tsx
[00:58:14.211] 4:26  Warning: 'AddToCartRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[00:58:14.211] 131:21  Warning: 'setIsLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.211]
[00:58:14.212] ./src/lib/mock-auth.ts
[00:58:14.212] 86:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.212] 119:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.212] 135:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.212] 156:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[00:58:14.212]
[00:58:14.212] ./src/services/reviewService.ts
[00:58:14.213] 4:5  Error: 'reviews' is never reassigned. Use 'const' instead.  prefer-const
[00:58:14.213]
[00:58:14.213] ./src/services/supabaseLocationService.ts
[00:58:14.213] 99:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.213] 122:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.213] 122:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.214] 123:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.214]
[00:58:14.214] ./src/services/supabaseProductService.ts
[00:58:14.214] 91:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.214] 107:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.215] 107:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.215] 108:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[00:58:14.215]
[00:58:14.215] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[00:58:14.228] Error: Command "npm run build" exited with 1