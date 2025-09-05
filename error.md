Failed to compile.
./src/app/api/admin/products/route.ts:343:7
Type error: Type '"product"' is not assignable to type 'ResourceType'.
  341 |       user_role: 'admin',
  342 |       action: 'delete',
> 343 |       resource_type: 'product' as const, // 指定具體的資源類型
      |       ^
  344 |       resource_id: id,
  345 |       resource_details: productData
  346 |         ? (transformFromDB(productData) as unknown as Record<string, unknown>)
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1