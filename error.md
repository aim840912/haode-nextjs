Failed to compile.
./src/services/auditLogService.ts:76:17
Type error: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "audit_logs", never, "POST">', gave the following error.
    Argument of type '{ user_id: string | null | undefined; user_email: string; user_name: string | undefined; user_role: UserRole | undefined; action: AuditAction; resource_type: ResourceType; ... 7 more ...; metadata: Record<...>; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "audit_logs", never, "POST">', gave the following error.
    Argument of type '{ user_id: string | null | undefined; user_email: string; user_name: string | undefined; user_role: UserRole | undefined; action: AuditAction; resource_type: ResourceType; ... 7 more ...; metadata: Record<...>; }' is not assignable to parameter of type 'never[]'.
      Type '{ user_id: string | null | undefined; user_email: string; user_name: string | undefined; user_role: UserRole | undefined; action: AuditAction; resource_type: ResourceType; ... 7 more ...; metadata: Record<...>; }' is missing the following properties from type 'never[]': length, pop, push, concat, and 35 more.
  74 |       const { error } = await createServiceSupabaseClient()
  75 |         .from('audit_logs')
> 76 |         .insert(auditData);
     |                 ^
  77 |
  78 |       if (error) {
  79 |         dbLogger.info('審計日誌記錄失敗', {
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1