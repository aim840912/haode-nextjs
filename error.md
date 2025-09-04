Failed to compile.
./src/services/v2/inquiryServiceSimple.ts:197:10
Type error: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "inquiries", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; customer_name: string; customer_email: string; customer_phone: string | null; inquiry_type: InquiryType; notes: string | null; delivery_address: string | null; ... 4 more ...; is_replied: boolean; }[]' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "inquiries", never, "POST">', gave the following error.
    Type '{ user_id: string; customer_name: string; customer_email: string; customer_phone: string | null; inquiry_type: InquiryType; notes: string | null; delivery_address: string | null; ... 4 more ...; is_replied: boolean; }' is not assignable to type 'never'.
  195 |       const { data: inquiry, error: inquiryError } = await client
  196 |         .from('inquiries')
> 197 |         .insert([inquiryData])
      |          ^
  198 |         .select()
  199 |         .single()
  200 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1