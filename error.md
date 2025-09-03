Failed to compile.
./src/app/api/admin/products/route.ts:342:9
Type error: Type 'Product | {}' is not assignable to type 'Record<string, unknown> | undefined'.
  Type 'Product' is not assignable to type 'Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'Product'.
  340 |         resource_type: 'product' as any, // 暫時使用 any，稍後會更新 type
  341 |         resource_id: id,
> 342 |         resource_details: productData ? transformFromDB(productData) : {},
      |         ^
  343 |         metadata: {
  344 |           imageCleanup: imageDeletionResult,
  345 |           verification: verificationResult
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1