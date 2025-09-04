Failed to compile.
./src/services/auditLogService.ts:222:40
Type error: Argument of type '{ target_user_id: string; limit_count: number; offset_count: number; }' is not assignable to parameter of type 'undefined'.
  220 |     try {
  221 |       const { data, error } = await createServiceSupabaseClient()
> 222 |         .rpc('get_user_audit_history', {
      |                                        ^
  223 |           target_user_id: userId,
  224 |           limit_count: limit,
  225 |           offset_count: offset
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1