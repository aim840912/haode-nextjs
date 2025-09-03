Failed to compile.
./src/app/news/[id]/page.tsx:63:110
Type error: Object literal may only specify known properties, and 'newsId' does not exist in type 'LogContext'.
  61 |         setNewsItem(null)
  62 |       } else {
> 63 |         logger.error('Failed to fetch news', new Error(`HTTP ${response.status}: ${response.statusText}`), { newsId: id, module: 'NewsDetailPage', action: 'fetchNewsDetail' })
     |                                                                                                              ^
  64 |         setNewsItem(null)
  65 |       }
  66 |     } catch (error) {
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1
