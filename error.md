Failed to compile.
./src/app/admin/locations/page.tsx:40:35
Type error: Object literal may only specify known properties, and 'count' does not exist in type 'LogContext'.
  38 |       if (Array.isArray(data)) {
  39 |         setLocations(data)
> 40 |         logger.info('門市資料載入成功', { count: data.length })
     |                                   ^
  41 |       } else {
  42 |         logger.error('API 回應格式錯誤：locations data 不是陣列', result)
  43 |         setLocations([])
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1