Failed to compile.
./src/services/auditLogService.ts:75:87
Type error: No overload matches this call.
  73 |
  74 |       // 插入審計日誌
> 75 |       const { error } = await createServiceSupabaseClient().from('audit_logs').insert(auditData)
     |                                                                                       ^
  76 |
  77 |       if (error) {
  78 |         dbLogger.info('審計日誌記錄失敗', {
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1