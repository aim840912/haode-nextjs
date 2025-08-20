Failed to compile.
./src/app/products/page.tsx:238:15
Type error: Property 'error' does not exist on type 'typeof import("/vercel/path0/src/components/Toast")'.
  236 |     if (!user) {
  237 |       // 顯示提示訊息
> 238 |       const { error: showError } = await import('@/components/Toast');
      |               ^
  239 |       const { useToast } = await import('@/components/Toast');
  240 |
  241 |       // 創建臨時 toast 提示
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1