[01:34:01.805] Running build in Washington, D.C., USA (East) – iad1
[01:34:01.806] Build machine configuration: 2 cores, 8 GB
[01:34:01.828] Cloning github.com/aim840912/haode-nextjs (Branch: main, Commit: 556d7d3)
[01:34:01.836] Skipping build cache, deployment was triggered without cache.
[01:34:02.421] Cloning completed: 592.000ms
[01:34:04.255] Running "vercel build"
[01:34:04.705] Vercel CLI 44.7.3
[01:34:05.023] Running "install" command: `npm install`...
[01:34:16.939]
[01:34:16.940] added 381 packages, and audited 382 packages in 12s
[01:34:16.940]
[01:34:16.941] 142 packages are looking for funding
[01:34:16.941]   run `npm fund` for details
[01:34:16.943]
[01:34:16.943] found 0 vulnerabilities
[01:34:17.003] Detected Next.js version: 15.4.6
[01:34:17.004] Running "npm run build"
[01:34:17.114]
[01:34:17.114] > my-nextjs-app@0.1.0 build
[01:34:17.115] > next build
[01:34:17.115]
[01:34:17.912] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[01:34:17.913] This information is used to shape Next.js' roadmap and prioritize features.
[01:34:17.913] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[01:34:17.913] https://nextjs.org/telemetry
[01:34:17.913]
[01:34:18.018]    ▲ Next.js 15.4.6
[01:34:18.018]    - Experiments (use with caution):
[01:34:18.018]      · optimizePackageImports
[01:34:18.018]
[01:34:18.056]    Creating an optimized production build ...
[01:34:41.157]  ✓ Compiled successfully in 19.0s
[01:34:41.165]    Linting and checking validity of types ...
[01:34:50.409]
[01:34:50.410] Failed to compile.
[01:34:50.410]
[01:34:50.410] ./src/app/admin/culture/[id]/edit/page.tsx
[01:34:50.410] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.411] 368:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.411]
[01:34:50.411] ./src/app/admin/culture/add/page.tsx
[01:34:50.411] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.412] 61:10  Warning: 'imageFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.412] 61:37  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.412] 62:43  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.412] 222:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.412] 243:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.413] 421:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.413]
[01:34:50.413] ./src/app/admin/farm-tour/[id]/edit/page.tsx
[01:34:50.413] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.414] 80:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.414] 85:6  Warning: React Hook useEffect has missing dependencies: 'fetchActivity' and 'params'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[01:34:50.414]
[01:34:50.414] ./src/app/admin/farm-tour/add/page.tsx
[01:34:50.414] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.414]
[01:34:50.414] ./src/app/admin/locations/[id]/edit/page.tsx
[01:34:50.414] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.414] 80:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.415] 114:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.415]
[01:34:50.415] ./src/app/admin/news/[id]/edit/page.tsx
[01:34:50.415] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.415] 79:21  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.415] 106:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.415]
[01:34:50.415] ./src/app/admin/news/add/page.tsx
[01:34:50.416] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.416]
[01:34:50.416] ./src/app/admin/products/[id]/edit/page.tsx
[01:34:50.416] 54:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.416] 65:24  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.416] 92:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.417] 313:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.417]
[01:34:50.417] ./src/app/admin/products/add/page.tsx
[01:34:50.417] 51:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.417]
[01:34:50.417] ./src/app/admin/reviews/page.tsx
[01:34:50.417] 23:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:34:50.418]
[01:34:50.421] ./src/app/admin/schedule/[id]/edit/page.tsx
[01:34:50.421] 56:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.421] 78:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.421] 88:25  Error: React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.421] 117:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.421]
[01:34:50.422] ./src/app/admin/schedule/add/page.tsx
[01:34:50.422] 53:35  Error: React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.422] 66:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[01:34:50.422]
[01:34:50.422] ./src/app/api/cart/[itemId]/route.ts
[01:34:50.422] 82:13  Warning: 'itemId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.422]
[01:34:50.422] ./src/app/api/cart/route.ts
[01:34:50.422] 1:10  Warning: 'NextRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.422] 73:11  Warning: 'userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.422]
[01:34:50.422] ./src/app/api/farm-tour/[id]/route.ts
[01:34:50.422] 13:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423] 30:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423] 46:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423]
[01:34:50.423] ./src/app/api/farm-tour/route.ts
[01:34:50.423] 9:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423] 20:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423]
[01:34:50.423] ./src/app/api/stats/track/route.ts
[01:34:50.423] 16:7  Warning: 'page_path' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423] 17:7  Warning: 'page_title' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423] 18:7  Warning: 'referrer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423]
[01:34:50.423] ./src/app/api/stats/visitors/route.ts
[01:34:50.423] 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.423]
[01:34:50.423] ./src/app/cart/page.tsx
[01:34:50.423] 33:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.430] 40:9  Warning: 'handleClearCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.430] 46:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.430]
[01:34:50.430] ./src/app/culture/page.tsx
[01:34:50.430] 27:7  Warning: 'getRandomImage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.430] 138:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.430] 182:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.430] 239:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.430]
[01:34:50.431] ./src/app/locations/page.tsx
[01:34:50.431] 12:10  Warning: 'showMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.431] 12:19  Warning: 'setShowMap' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.431]
[01:34:50.431] ./src/app/login/page.tsx
[01:34:50.431] 14:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.431]
[01:34:50.431] ./src/app/news/[id]/page.tsx
[01:34:50.432] 136:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.432] 204:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.432]
[01:34:50.432] ./src/app/news/page.tsx
[01:34:50.432] 138:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.432] 188:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.432]
[01:34:50.432] ./src/app/page.tsx
[01:34:50.432] 33:6  Warning: React Hook useEffect has a missing dependency: 'farmImages'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:34:50.433] 51:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.433] 241:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.433] 254:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.433] 267:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.433] 280:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.433]
[01:34:50.433] ./src/app/products/page.tsx
[01:34:50.433] 88:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.433] 93:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.433] 102:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.433] 174:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.434] 208:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.434] 260:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.434] 288:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.434] 305:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.434] 317:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.434]
[01:34:50.434] ./src/app/profile/page.tsx
[01:34:50.434] 113:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.434]
[01:34:50.434] ./src/app/reviews/page.tsx
[01:34:50.434] 11:10  Warning: 'showForm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.435] 98:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.435]
[01:34:50.435] ./src/app/schedule/page.tsx
[01:34:50.435] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.435] 88:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.435] 96:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.435] 105:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.435] 114:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.435]
[01:34:50.435] ./src/components/CustomerReviews.tsx
[01:34:50.435] 69:45  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.435] 94:17  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:34:50.436] 94:34  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:34:50.436] 173:23  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:34:50.436] 173:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[01:34:50.436]
[01:34:50.436] ./src/components/LoadingSpinner.tsx
[01:34:50.436] 76:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.436]
[01:34:50.436] ./src/components/ProductsSection.tsx
[01:34:50.436] 72:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[01:34:50.436]
[01:34:50.436] ./src/components/ReviewList.tsx
[01:34:50.437] 30:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[01:34:50.437]
[01:34:50.437] ./src/components/VisitorTracker.tsx
[01:34:50.437] 94:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.437] 95:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.437]
[01:34:50.437] ./src/lib/api-cache.ts
[01:34:50.437] 11:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.437] 68:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.437] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetcher'. Either include it or remove the dependency array. If 'fetcher' changes too often, find the parent component that defines it and wrap that definition in useCallback.  react-hooks/exhaustive-deps
[01:34:50.444]
[01:34:50.444] ./src/lib/api-response.ts
[01:34:50.445] 1:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.445] 84:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.445]
[01:34:50.445] ./src/lib/auth-context.tsx
[01:34:50.445] 50:16  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.445]
[01:34:50.445] ./src/lib/auth-middleware.ts
[01:34:50.445] 16:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.445] 22:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.445]
[01:34:50.445] ./src/lib/cart-context.tsx
[01:34:50.446] 4:26  Warning: 'AddToCartRequest' is defined but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446] 131:21  Warning: 'setIsLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446]
[01:34:50.446] ./src/lib/mock-auth.ts
[01:34:50.446] 86:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446] 119:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446] 135:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446] 156:13  Warning: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[01:34:50.446]
[01:34:50.446] ./src/services/reviewService.ts
[01:34:50.446] 4:5  Error: 'reviews' is never reassigned. Use 'const' instead.  prefer-const
[01:34:50.447]
[01:34:50.447] ./src/services/supabaseLocationService.ts
[01:34:50.447] 99:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447] 122:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447] 122:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447] 123:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447]
[01:34:50.447] ./src/services/supabaseProductService.ts
[01:34:50.447] 91:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447] 107:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.447] 107:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.448] 108:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[01:34:50.448]
[01:34:50.448] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[01:34:50.480] Error: Command "npm run build" exited with 1