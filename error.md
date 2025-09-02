Failed to compile.
./src/lib/api-middleware/auth.ts:93:33
Type error: Type 'import("/vercel/path0/node_modules/@supabase/supabase-js/node_modules/@supabase/auth-js/dist/module/lib/types").User' is not assignable to type 'import("/vercel/path0/src/lib/api-middleware/auth").User'.
  Index signature for type 'string' is missing in type 'User'.
  91 |       })
  92 |
> 93 |       return handler(request, { user, params: params as Record<string, string> })
     |                                 ^
  94 |     },
  95 |     {
  96 |       module: 'RequireAuth',
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1