Failed to compile.
./src/app/api/inquiries/route.ts:14:26
Type error: Module '"@/lib/validation-schemas"' has no exported member 'CommonValidations'.
  12 | import { withErrorHandler } from '@/lib/error-handler';
  13 | import { withValidation, withQueryValidation, withBodyValidation } from '@/lib/validation-middleware';
> 14 | import { InquirySchemas, CommonValidations } from '@/lib/validation-schemas';
     |                          ^
  15 | import { z } from 'zod';
  16 | import { success, created } from '@/lib/api-response';
  17 | import { NotFoundError, AuthorizationError } from '@/lib/errors';
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1