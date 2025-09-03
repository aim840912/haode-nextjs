Failed to compile.
./src/lib/abstract-supabase-service.ts:160:9
Type error: Object literal may only specify known properties, and 'tableName' does not exist in type 'LogContext'.
  158 |     } catch (error) {
  159 |       dbLogger.error('Query builder error', error as Error, {
> 160 |         tableName: this.config.tableName,
      |         ^
  161 |         options: normalizedOptions,
  162 |         queryType: typeof query,
  163 |         queryMethods: Object.getOwnPropertyNames(query)
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1