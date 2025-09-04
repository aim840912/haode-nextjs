Failed to compile.
./src/lib/abstract-supabase-service.ts:139:19
Type error: Conversion of type 'PostgrestQueryBuilder<any, any, any, string, unknown>' to type 'SupabaseQueryBuilder<TRecord>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'PostgrestQueryBuilder<any, any, any, string, unknown>' is missing the following properties from type 'SupabaseQueryBuilder<TRecord>': eq, neq, gt, gte, and 12 more.
  137 |   ): SupabaseQueryBuilder<TRecord> {
  138 |     const client = this.getClient(useAdmin)
> 139 |     const query = client.from(this.config.tableName) as SupabaseQueryBuilder<TRecord>
      |                   ^
  140 |
  141 |     // Debug logging
  142 |     dbLogger.debug('Creating Supabase query', {
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1