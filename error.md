Failed to compile.
./src/components/ProductsTable.tsx:290:97
Type error: Cannot find name 'isCurrentlyShown'.
  288 |
  289 |       const result = await response.json()
> 290 |       logger.debug('handleToggleShowInCatalog - 更新成功', { metadata: { productId: id, newStatus: !isCurrentlyShown, component: 'ProductsTable' } })
      |                                                                                                 ^
  291 |
  292 |       // 更新成功後重新載入整個產品列表，確保資料同步
  293 |       await fetchProducts()
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1