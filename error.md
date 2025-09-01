Failed to compile.
./src/app/admin/audit-logs/page.tsx:169:46
Type error: Object literal may only specify known properties, and 'ids' does not exist in type 'string[] | AuditLog'.
  167 |   const handleDeleteSelected = () => {
  168 |     if (selectedLogs.length === 0) return
> 169 |     setDeleteTarget({ type: 'batch', data: { ids: selectedLogs } })
      |                                              ^
  170 |     setShowDeleteConfirm(true)
  171 |   }
  172 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1