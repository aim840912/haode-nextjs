Failed to compile.
./src/lib/auth-context.tsx:107:14
Type error: Parameter 'error' implicitly has an 'any' type.
  105 |         handleAuthStateChange(session)
  106 |       })
> 107 |       .catch(error => {
      |              ^
  108 |         logger.error('Failed to get initial session', error as Error, {
  109 |           metadata: { action: 'get_initial_session' },
  110 |         })
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1