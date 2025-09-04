Failed to compile.
./src/app/api/admin/kpi-report/route.ts:36:33
Type error: Argument of type '(request: NextRequest, { user }: { user: { id: string; email: string; }; }) => Promise<NextResponse<unknown>>' is not assignable to parameter of type 'AdminHandler'.
  Types of parameters '__1' and 'context' are incompatible.
    Type '{ user: User; isAdmin: true; params?: Record<string, string> | undefined; }' is not assignable to type '{ user: { id: string; email: string; }; }'.
      The types of 'user.email' are incompatible between these types.
        Type 'string | undefined' is not assignable to type 'string'.
          Type 'undefined' is not assignable to type 'string'.
  34 |
  35 | // 導出處理器 - 需要管理員權限
> 36 | export const GET = requireAdmin(handleGET)
     |                                 ^
  37 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1