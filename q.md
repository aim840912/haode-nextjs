[01:17:48.166] Running build in Washington, D.C., USA (East) – iad1
[01:17:48.166] Build machine configuration: 2 cores, 8 GB
[01:17:48.188] Cloning github.com/aim840912/haode-nextjs (Branch: main, Commit: 556d7d3)
[01:17:48.209] Skipping build cache, deployment was triggered without cache.
[01:17:48.912] Cloning completed: 723.000ms
[01:17:50.883] Running "vercel build"
[01:17:51.348] Vercel CLI 44.7.3
[01:17:51.690] Running "install" command: `npm install`...
[01:18:04.367]
[01:18:04.368] added 381 packages, and audited 382 packages in 12s
[01:18:04.369]
[01:18:04.369] 142 packages are looking for funding
[01:18:04.369]   run `npm fund` for details
[01:18:04.370]
[01:18:04.370] found 0 vulnerabilities
[01:18:04.437] Detected Next.js version: 15.4.6
[01:18:04.440] Running "npm run build"
[01:18:04.558]
[01:18:04.559] > my-nextjs-app@0.1.0 build
[01:18:04.559] > next build
[01:18:04.559]
[01:18:05.386] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[01:18:05.386] This information is used to shape Next.js' roadmap and prioritize features.
[01:18:05.386] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[01:18:05.387] https://nextjs.org/telemetry
[01:18:05.387]
[01:18:05.506]    ▲ Next.js 15.4.6
[01:18:05.507]    - Experiments (use with caution):
[01:18:05.507]      · optimizePackageImports
[01:18:05.507]
[01:18:05.549]    Creating an optimized production build ...
[01:18:29.299]  ✓ Compiled successfully in 19.0s
[01:18:29.305]    Linting and checking validity of types ...
[01:18:39.901]
[01:18:39.906] Failed to compile.
[01:18:39.906]
[01:18:39.907] ./src/app/admin/culture/[id]/edit/page.tsx
[01:18:39.907] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.907] 368:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.908]
[01:18:39.908] ./src/app/admin/culture/add/page.tsx
[01:18:39.908] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.908] 61:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.908] 61:37  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.909] 62:43  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.909] 222:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.909] 243:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.909] 421:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.910]
[01:18:39.910] ./src/app/admin/farm-tour/[id]/edit/page.tsx
[01:18:39.910] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.911] 80:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.911] 85:6  Warning: React Hook useEffect has missing dependencies: 'fetchActivity' and 'params'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[01:18:39.911]
[01:18:39.911] ./src/app/admin/farm-tour/add/page.tsx
[01:18:39.911] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.919]
[01:18:39.919] ./src/app/admin/locations/[id]/edit/page.tsx
[01:18:39.920] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.920] 80:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.920] 114:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.920]
[01:18:39.920] ./src/app/admin/news/[id]/edit/page.tsx
[01:18:39.921] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.921] 79:21  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.921] 106:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.921]
[01:18:39.921] ./src/app/admin/news/add/page.tsx
[01:18:39.922] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.922]
[01:18:39.922] ./src/app/admin/products/[id]/edit/page.tsx
[01:18:39.922] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.923] 65:24  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.923] 92:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.923] 313:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.923]
[01:18:39.923] ./src/app/admin/products/add/page.tsx
[01:18:39.924] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.924]
[01:18:39.924] ./src/app/admin/reviews/page.tsx
[01:18:39.924] 23:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:18:39.924]
[01:18:39.925] ./src/app/admin/schedule/[id]/edit/page.tsx
[01:18:39.925] 56:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.925] 78:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.925] 88:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.925] 117:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.925]
[01:18:39.926] ./src/app/admin/schedule/add/page.tsx
[01:18:39.926] 53:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.926] 66:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:18:39.926]
[01:18:39.926] ./src/app/api/cart/[itemId]/route.ts
[01:18:39.926] 82:13  Warning: 'itemId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.926]
[01:18:39.927] ./src/app/api/cart/route.ts
[01:18:39.927] 1:10  Warning: 'NextRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.927] 73:11  Warning: 'userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.927]
[01:18:39.927] ./src/app/api/farm-tour/[id]/route.ts
[01:18:39.927] 13:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.927] 30:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.928] 46:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.928]
[01:18:39.928] ./src/app/api/farm-tour/route.ts
[01:18:39.928] 9:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.928] 20:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.928]
[01:18:39.929] ./src/app/api/stats/track/route.ts
[01:18:39.929] 16:7  Warning: 'page_path' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.929] 17:7  Warning: 'page_title' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.929] 18:7  Warning: 'referrer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.929]
[01:18:39.929] ./src/app/api/stats/visitors/route.ts
[01:18:39.929] 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.930]
[01:18:39.930] ./src/app/cart/page.tsx
[01:18:39.930] 33:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.930] 40:9  Warning: 'handleClearCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.930] 46:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.946]
[01:18:39.946] ./src/app/culture/page.tsx
[01:18:39.946] 27:7  Warning: 'getRandomImage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.946] 138:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.946] 182:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.946] 239:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.946]
[01:18:39.946] ./src/app/locations/page.tsx
[01:18:39.947] 12:10  Warning: 'showMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.947] 12:19  Warning: 'setShowMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.947]
[01:18:39.947] ./src/app/login/page.tsx
[01:18:39.947] 14:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.947]
[01:18:39.947] ./src/app/news/[id]/page.tsx
[01:18:39.947] 136:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.947] 204:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.947]
[01:18:39.947] ./src/app/news/page.tsx
[01:18:39.947] 138:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.947] 188:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.947]
[01:18:39.947] ./src/app/page.tsx
[01:18:39.948] 33:6  Warning: React Hook useEffect has a missing dependency: 'farmImages'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:18:39.948] 51:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 241:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 254:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 280:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948]
[01:18:39.948] ./src/app/products/page.tsx
[01:18:39.948] 88:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 93:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 102:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 174:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 208:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 260:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.948] 288:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 305:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948] 317:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948]
[01:18:39.948] ./src/app/profile/page.tsx
[01:18:39.948] 113:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.948]
[01:18:39.948] ./src/app/reviews/page.tsx
[01:18:39.948] 11:10  Warning: 'showForm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.948] 98:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.948]
[01:18:39.948] ./src/app/schedule/page.tsx
[01:18:39.948] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.949] 88:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.949] 96:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.949] 105:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950] 114:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950]
[01:18:39.950] ./src/components/CustomerReviews.tsx
[01:18:39.950] 69:45  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.950] 94:17  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:18:39.950] 94:34  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:18:39.950] 173:23  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:18:39.950] 173:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:18:39.950]
[01:18:39.950] ./src/components/LoadingSpinner.tsx
[01:18:39.950] 76:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950]
[01:18:39.950] ./src/components/ProductsSection.tsx
[01:18:39.950] 72:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:18:39.950]
[01:18:39.950] ./src/components/ReviewList.tsx
[01:18:39.950] 30:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:18:39.950]
[01:18:39.950] ./src/components/VisitorTracker.tsx
[01:18:39.950] 94:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950] 95:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950]
[01:18:39.950] ./src/lib/api-cache.ts
[01:18:39.950] 11:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950] 68:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetcher'. Either include it or remove the dependency array. If 'fetcher' changes too often, find the parent component that defines it and wrap that definition in useCallback.  react-hooks/exhaustive-deps
[01:18:39.950]
[01:18:39.950] ./src/lib/api-response.ts
[01:18:39.950] 1:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950] 84:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.950]
[01:18:39.951] ./src/lib/auth-context.tsx
[01:18:39.951] 50:16  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951]
[01:18:39.951] ./src/lib/auth-middleware.ts
[01:18:39.951] 16:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951] 22:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951]
[01:18:39.951] ./src/lib/cart-context.tsx
[01:18:39.951] 4:26  Warning: 'AddToCartRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951] 131:21  Warning: 'setIsLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951]
[01:18:39.951] ./src/lib/mock-auth.ts
[01:18:39.951] 86:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951] 119:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951] 135:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951] 156:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:18:39.951]
[01:18:39.951] ./src/services/reviewService.ts
[01:18:39.951] 4:5  Error: 'reviews' is never reassigned. Use 'const' instead.  prefer-const
[01:18:39.951]
[01:18:39.951] ./src/services/supabaseLocationService.ts
[01:18:39.951] 99:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951] 122:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951] 122:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951] 123:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951]
[01:18:39.951] ./src/services/supabaseProductService.ts
[01:18:39.951] 91:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.951] 107:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.952] 107:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.952] 108:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:18:39.952]
[01:18:39.952] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[01:18:39.979] Error: Command "npm run build" exited with 1