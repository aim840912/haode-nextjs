Failed to compile.
./src/app/api/admin/locations/route.ts:113:6
Type error: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "locations", never, "POST">', gave the following error.
    Argument of type '{ name: string; title: string; address: string; landmark: string | null; phone: string | null; line_id: string | null; hours: string | null; closed_days: string | null; parking: string | null; ... 5 more ...; is_main: boolean; }[]' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "locations", never, "POST">', gave the following error.
    Type '{ name: string; title: string; address: string; landmark: string | null; phone: string | null; line_id: string | null; hours: string | null; closed_days: string | null; parking: string | null; ... 5 more ...; is_main: boolean; }' is not assignable to type 'never'.
  111 |   const { data, error } = await supabaseAdmin
  112 |     .from('locations')
> 113 |     .insert([dbLocation])
      |      ^
  114 |     .select()
  115 |     .single()
  116 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1