Failed to compile.
./src/services/auditLogService.ts:67:9
Type error: Type 'Record<string, unknown>' is not assignable to type 'JsonValue | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'JsonValue[]': length, pop, push, concat, and 35 more.
  65 |         resource_type: request.resource_type,
  66 |         resource_id: request.resource_id,
> 67 |         resource_details: request.resource_details || {},
     |         ^
  68 |         previous_data: request.previous_data || {},
  69 |         new_data: request.new_data || {},
  70 |         ip_address: request.ip_address,
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1