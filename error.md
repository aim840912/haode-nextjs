Failed to compile.
./src/services/supabaseInquiryService.ts:152:91
Type error: Property 'id' does not exist on type 'never'.
  150 |             });
  151 |           // 如果項目建立失敗，清除已建立的庫存查詢單
> 152 |           await createServiceSupabaseClient().from('inquiries').delete().eq('id', inquiry.id);
      |                                                                                           ^
  153 |           throw new Error(`建立庫存查詢項目失敗: ${itemsError.message} (code: ${itemsError.code})`);
  154 |         }
  155 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1