[21:12:47.371] Running build in Washington, D.C., USA (East) – iad1
[21:12:47.371] Build machine configuration: 2 cores, 8 GB
[21:12:47.386] Cloning github.com/aim840912/haode-nextjs (Branch: develop, Commit: 49c8801)
[21:12:48.764] Cloning completed: 1.377s
[21:12:52.067] Restored build cache from previous deployment (Hk19TYMKA67ibJAeVP2EBSdEftpo)
[21:12:52.835] Running "vercel build"
[21:12:53.693] Vercel CLI 47.0.5
[21:12:54.046] Warning: Detected "engines": { "node": ">=20.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
[21:12:54.059] Running "install" command: `npm ci`...
[21:12:56.714] npm warn reify invalid or damaged lockfile detected
[21:12:56.714] npm warn reify please re-try this operation once it completes
[21:12:56.714] npm warn reify so that the damage can be corrected, or perform
[21:12:56.714] npm warn reify a fresh install with no lockfile if the problem persists.
[21:12:58.719] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[21:12:58.758] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[21:13:13.944]
[21:13:13.945] > haude@0.1.0 prepare
[21:13:13.945] > husky
[21:13:13.945]
[21:13:14.018]
[21:13:14.020] added 828 packages, and audited 829 packages in 20s
[21:13:14.020]
[21:13:14.021] 191 packages are looking for funding
[21:13:14.021]   run `npm fund` for details
[21:13:14.031]
[21:13:14.032] 5 low severity vulnerabilities
[21:13:14.032]
[21:13:14.032] To address all issues (including breaking changes), run:
[21:13:14.033]   npm audit fix --force
[21:13:14.033]
[21:13:14.033] Run `npm audit` for details.
[21:13:14.131] Detected Next.js version: 15.5.2
[21:13:14.131] Running "npm run build"
[21:13:14.340]
[21:13:14.340] > haude@0.1.0 build
[21:13:14.342] > npx next build
[21:13:14.342]
[21:13:15.560]    ▲ Next.js 15.5.2
[21:13:15.561]    - Experiments (use with caution):
[21:13:15.561]      · optimizePackageImports
[21:13:15.561]
[21:13:15.660]    Creating an optimized production build ...
[21:13:38.755] <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (128kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
[21:13:38.839] <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (108kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
[21:13:46.829]  ⚠ Compiled with warnings in 30.9s
[21:13:46.830]
[21:13:46.830] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[21:13:46.831] A Node.js API is used (process.versions at line: 35) which is not supported in the Edge Runtime.
[21:13:46.831] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.831]
[21:13:46.831] Import trace for requested module:
[21:13:46.831] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[21:13:46.831] ./node_modules/@supabase/realtime-js/dist/module/index.js
[21:13:46.832] ./node_modules/@supabase/supabase-js/dist/module/index.js
[21:13:46.832] ./src/lib/supabase-auth.ts
[21:13:46.832] ./src/services/auditLogService.ts
[21:13:46.832] ./src/lib/rate-limiter.ts
[21:13:46.832]
[21:13:46.832] ./node_modules/@supabase/supabase-js/dist/module/index.js
[21:13:46.833] A Node.js API is used (process.version at line: 24) which is not supported in the Edge Runtime.
[21:13:46.833] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.833]
[21:13:46.833] Import trace for requested module:
[21:13:46.833] ./node_modules/@supabase/supabase-js/dist/module/index.js
[21:13:46.833] ./src/lib/supabase-auth.ts
[21:13:46.833] ./src/services/auditLogService.ts
[21:13:46.834] ./src/lib/rate-limiter.ts
[21:13:46.834]
[21:13:46.834] ./node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
[21:13:46.834] A Node.js API is used (process.version at line: 3) which is not supported in the Edge Runtime.
[21:13:46.834] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.834]
[21:13:46.834] Import trace for requested module:
[21:13:46.835] ./node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
[21:13:46.835] ./node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
[21:13:46.835] ./node_modules/jsonwebtoken/verify.js
[21:13:46.835] ./node_modules/jsonwebtoken/index.js
[21:13:46.835] ./src/lib/auth-middleware.ts
[21:13:46.835]
[21:13:46.835] ./node_modules/jsonwebtoken/lib/psSupported.js
[21:13:46.836] A Node.js API is used (process.version at line: 3) which is not supported in the Edge Runtime.
[21:13:46.836] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.836]
[21:13:46.836] Import trace for requested module:
[21:13:46.836] ./node_modules/jsonwebtoken/lib/psSupported.js
[21:13:46.836] ./node_modules/jsonwebtoken/verify.js
[21:13:46.836] ./node_modules/jsonwebtoken/index.js
[21:13:46.842] ./src/lib/auth-middleware.ts
[21:13:46.842]
[21:13:46.843] ./node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
[21:13:46.843] A Node.js API is used (process.version at line: 3) which is not supported in the Edge Runtime.
[21:13:46.843] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.843]
[21:13:46.843] Import trace for requested module:
[21:13:46.844] ./node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
[21:13:46.844] ./node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
[21:13:46.844] ./node_modules/jsonwebtoken/verify.js
[21:13:46.844] ./node_modules/jsonwebtoken/index.js
[21:13:46.844] ./src/lib/auth-middleware.ts
[21:13:46.844]
[21:13:46.845] ./node_modules/jws/lib/data-stream.js
[21:13:46.845] A Node.js API is used (process.nextTick at line: 29) which is not supported in the Edge Runtime.
[21:13:46.845] Learn more: https://nextjs.org/docs/api-reference/edge-runtime
[21:13:46.845]
[21:13:46.845] Import trace for requested module:
[21:13:46.845] ./node_modules/jws/lib/data-stream.js
[21:13:46.845] ./node_modules/jws/lib/sign-stream.js
[21:13:46.845] ./node_modules/jws/index.js
[21:13:46.846] ./node_modules/jsonwebtoken/decode.js
[21:13:46.846] ./node_modules/jsonwebtoken/index.js
[21:13:46.846] ./src/lib/auth-middleware.ts
[21:13:46.846]
[21:13:46.855]    Linting and checking validity of types ...
[21:14:07.631]
[21:14:07.631] Failed to compile.
[21:14:07.632]
[21:14:07.632] ./src/app/admin/products/[id]/edit/page.tsx
[21:14:07.632] 171:26  Warning: '_unusedSalePrice' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.632]
[21:14:07.632] ./src/app/admin/products/add/page.tsx
[21:14:07.632] 119:26  Warning: '_unusedSalePrice' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.632]
[21:14:07.632] ./src/app/api/farm-tour/calendar/route.ts
[21:14:07.633] 245:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:14:07.633]
[21:14:07.633] ./src/app/diagnosis/page.tsx
[21:14:07.633] 158:26  Warning: 'cleanupError' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.633]
[21:14:07.633] ./src/app/inquiries/[id]/page.tsx
[21:14:07.633] 29:9  Warning: '_router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.634] 235:53  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.634]
[21:14:07.634] ./src/app/inquiries/page.tsx
[21:14:07.634] 24:9  Warning: '_router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.634]
[21:14:07.634] ./src/app/inquiry/page.tsx
[21:14:07.634] 92:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.634]
[21:14:07.634] ./src/components/ImageUploader.tsx
[21:14:07.634] 67:10  Warning: 'errorMessage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.635] 68:10  Warning: 'uploadStatus' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.635] 250:5  Warning: React Hook useCallback has a missing dependency: 'uploadImageToServer'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[21:14:07.635]
[21:14:07.635] ./src/components/OptimizedImage.tsx
[21:14:07.636] 195:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[21:14:07.636] 207:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[21:14:07.637] 248:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[21:14:07.637]
[21:14:07.637] ./src/components/ProductsSection.tsx
[21:14:07.637] 15:11  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.637]
[21:14:07.637] ./src/components/ProductsTable.tsx
[21:14:07.637] 33:5  Warning: 'updateToast' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.637] 302:13  Warning: 'result' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.638]
[21:14:07.638] ./src/components/admin/MonitoringDashboard.tsx
[21:14:07.638] 14:3  Warning: 'CheckCircleIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.638] 21:3  Warning: 'StopIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.638] 22:3  Warning: 'TrophyIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.638]
[21:14:07.638] ./src/components/examples/GA4TrackingExamples.tsx
[21:14:07.638] 34:11  Warning: 'trackEvent' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.638] 36:9  Warning: 'handleViewProduct' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 47:9  Warning: 'handleAddToCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 72:11  Warning: 'trackEvent' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 74:9  Warning: 'handleFormSubmit' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 82:9  Warning: 'handlePhoneClick' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 99:9  Warning: 'handlePurchaseComplete' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 126:9  Warning: 'handleNewsletterSignup' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 142:9  Warning: 'handleSearch' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639] 158:9  Warning: 'handleShare' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.639]
[21:14:07.640] ./src/components/inquiry/StatusStep.tsx
[21:14:07.643] 22:3  Warning: 'stepNumber' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.643]
[21:14:07.643] ./src/config/data-strategy.ts
[21:14:07.643] 50:9  Warning: 'explicitlyUseSupabase' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.643] 51:9  Warning: 'autoUseSupabaseInProduction' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.643]
[21:14:07.643] ./src/contexts/InquiryStatsContext.tsx
[21:14:07.643] 9:44  Warning: 'useCallback' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.643] 9:57  Warning: 'useRef' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.643]
[21:14:07.646] ./src/hooks/useInquiryStats.ts
[21:14:07.647] 390:5  Warning: React Hook useCallback has missing dependencies: 'consecutiveErrors', 'error', 'getRetryDelay', 'lastErrorMessage', 'retryCount', and 'saveCachedStats'. Either include them or remove the dependency array. Outer scope values like 'supabase' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
[21:14:07.647]
[21:14:07.647] ./src/hooks/useInquiryStatusFlow.ts
[21:14:07.647] 59:11  Warning: 'currentStatusIndex' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/hooks/useRateLimitStatus.ts
[21:14:07.647] 173:5  Warning: React Hook useCallback has a missing dependency: 'addNotification'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[21:14:07.647] 220:5  Warning: React Hook useCallback has a missing dependency: 'addNotification'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[21:14:07.647] 305:45  Warning: The ref value 'notificationTimeouts.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'notificationTimeouts.current' to a variable inside the effect, and use that variable in the cleanup function.  react-hooks/exhaustive-deps
[21:14:07.647]
[21:14:07.647] ./src/lib/auth-middleware.ts
[21:14:07.647] 212:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/lib/email-service.ts
[21:14:07.647] 6:28  Warning: 'InquiryEmailData' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/lib/env.ts
[21:14:07.647] 258:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 266:13  Warning: 'server' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 283:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/lib/error-tracking.ts
[21:14:07.647] 300:42  Warning: 'timeout' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/lib/image-utils.ts
[21:14:07.647] 52:9  Warning: 'baseFileName' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 218:61  Warning: 'productId' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.647] ./src/lib/news-storage.ts
[21:14:07.647] 2:29  Warning: 'generateFileName' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 90:13  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 146:13  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647] 446:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.647]
[21:14:07.648] ./src/lib/supabase-storage.ts
[21:14:07.648] 4:54  Warning: 'StorageFileWithUrl' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.656] 36:15  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.656] 76:13  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.656] 326:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.656]
[21:14:07.657] ./src/middleware.ts
[21:14:07.657] 281:17  Warning: 'token' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.657]
[21:14:07.657] ./src/services/auditLogService.ts
[21:14:07.657] 251:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:14:07.657] 293:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:14:07.657]
[21:14:07.657] ./src/services/locationServiceAdapter.ts
[21:14:07.657] 133:15  Warning: 'distance' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.657]
[21:14:07.657] ./src/services/rateLimitMonitoringService.ts
[21:14:07.658] 13:10  Warning: 'AuditAction' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.658]
[21:14:07.658] ./src/services/serviceFactory.ts
[21:14:07.658] 14:10  Warning: 'ServiceConfig' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.658] 15:67  Warning: 'getStrategyInfo' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.658] 92:16  Warning: 'createJsonService' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.658] 142:16  Warning: 'createService' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.658] 221:7  Warning: 'serviceInstances' is assigned a value but only used as a type.  @typescript-eslint/no-unused-vars
[21:14:07.658]
[21:14:07.658] ./src/services/supabaseFarmTourService.ts
[21:14:07.658] 27:17  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.659] 59:5  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.659] 60:5  Warning: 'updateData' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.659] 66:16  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.659]
[21:14:07.659] ./src/services/supabaseInquiryService.ts
[21:14:07.659] 17:3  Warning: 'Inquiry' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.659]
[21:14:07.660] ./src/services/supabaseLocationService.ts
[21:14:07.660] 89:24  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.660] 94:25  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.660]
[21:14:07.660] ./src/services/supabaseProductService.ts
[21:14:07.660] 60:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.668] 73:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:14:07.670] 173:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.670] 239:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.670]
[21:14:07.671] ./src/services/v2/cultureServiceSimple.ts
[21:14:07.671] 341:7  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.671] 394:11  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.671] 548:7  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.671]
[21:14:07.671] ./src/services/v2/farmTourServiceSimple.ts
[21:14:07.671] 13:10  Warning: 'createServiceSupabaseClient' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.671] 16:24  Warning: 'NotFoundError' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.671] 16:39  Warning: 'ValidationError' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.671] 19:7  Warning: 'getAdmin' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.671] 20:10  Warning: 'UpdateDataObject' is defined but never used.  @typescript-eslint/no-unused-vars
[21:14:07.671]
[21:14:07.671] ./src/services/v2/inquiryServiceSimple.ts
[21:14:07.671] 197:7  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.672] 221:9  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.672] 344:7  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.672] 411:7  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.672] 435:13  Warning: 'client' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.672] 517:9  Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[21:14:07.672]
[21:14:07.672] ./src/services/v2/locationServiceSimple.ts
[21:14:07.672] 370:15  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.672]
[21:14:07.672] ./src/services/v2/newsServiceSimple.ts
[21:14:07.673] 216:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:14:07.673]
[21:14:07.673] ./src/services/v2/scheduleServiceSimple.ts
[21:14:07.673] 349:15  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:14:07.673]
[21:14:07.673] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[21:14:07.776] Error: Command "npm run build" exited with 1