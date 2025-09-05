Failed to compile.
./src/hooks/useEnhancedInquiryForm.ts:313:48
Type error: Argument of type 'CreateInquiryRequest' is not assignable to parameter of type 'Record<string, unknown>'.
  Index signature for type 'string' is missing in type 'CreateInquiryRequest'.
  311 |
  312 |       // 使用新的 v1 API
> 313 |       const response = await inquiryApi.create(inquiryRequest)
      |                                                ^
  314 |
  315 |       if (response.success && response.data) {
  316 |         logger.info('詢價單建立成功', {
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1