Failed to compile.
./src/app/api/search/stats/route.ts:37:56
Type error: Argument of type 'any' is not assignable to parameter of type 'never'.
  35 |   try {
  36 |     // 使用搜尋統計 RPC 函數
> 37 |     const { data: stats, error } = (await supabase.rpc('get_popular_searches' as any, {
     |                                                        ^
  38 |       days_back: daysBack,
  39 |       result_limit: limit,
  40 |     })) as { data: any[] | null; error: any }
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1