Failed to compile.
./src/app/profile/page.tsx:79:13
Type error: Block-scoped variable 'loadInterestedProducts' used before its declaration.
  77 |       loadInterestedProducts()
  78 |     }
> 79 |   }, [user, loadInterestedProducts])
     |             ^
  80 |
  81 |   const loadInterestedProducts = async () => {
  82 |     if (!user) return
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1