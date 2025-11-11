'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface DiagnosisResult {
  connection: boolean
  auth: boolean
  testInsert: boolean
  errors: string[]
  details: Record<string, unknown>
}

export default function DiagnosisPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  const runDiagnosis = useCallback(async () => {
    setIsRunning(true)
    setResult(null)
    setLogs([])

    const diagnosisResult: DiagnosisResult = {
      connection: false,
      auth: false,
      testInsert: false,
      errors: [],
      details: {},
    }

    try {
      addLog('🔍 開始 Supabase 詢價功能診斷...')

      // 步驟 1: 測試 Supabase 連接
      addLog('1️⃣ 測試 Supabase 連接...')

      try {
        const response = await fetch('/api/inquiries', {
          method: 'GET',
          credentials: 'include',
        })

        diagnosisResult.details.connectionStatus = response.status

        if (response.status === 200 || response.status === 401) {
          diagnosisResult.connection = true
          if (response.status === 200) {
            addLog('✅ Supabase API 連接正常（已認證用戶）')
          } else {
            addLog('✅ Supabase API 連接正常（回應 401 需要認證）')
          }
        } else if (response.status === 500) {
          addLog('⚠️ API 端點存在但有內部錯誤')
          diagnosisResult.errors.push('API 內部錯誤')
        } else {
          addLog(`⚠️ 意外的回應狀態: ${response.status}`)
          diagnosisResult.errors.push(`意外的 API 回應狀態: ${response.status}`)
        }
      } catch (connectionError) {
        addLog(`❌ 連接測試失敗: ${connectionError}`)
        diagnosisResult.errors.push(`連接錯誤: ${connectionError}`)
      }

      // 步驟 2: 檢查認證狀態
      addLog('2️⃣ 檢查認證狀態...')

      if (user) {
        diagnosisResult.auth = true
        addLog(`✅ 使用者已認證: ${user.email}`)
        diagnosisResult.details.user = {
          email: user.email,
          id: user.id,
        }

        // 步驟 3: 測試有認證的 API 調用
        addLog('3️⃣ 測試認證後的 API 調用...')

        try {
          const authResponse = await fetch('/api/inquiries', {
            method: 'GET',
            credentials: 'include',
          })

          const authResult = await authResponse.json()
          diagnosisResult.details.authApiResult = {
            status: authResponse.status,
            result: authResult,
          }

          addLog(`📊 認證 API 回應: ${authResponse.status}`)

          if (authResponse.ok) {
            addLog('✅ 認證 API 調用成功')
          } else {
            addLog(`❌ 認證 API 調用失敗: ${authResult.error}`)
            diagnosisResult.errors.push(authResult.error)
          }
        } catch (authError) {
          addLog(`❌ 認證測試失敗: ${authError}`)
          diagnosisResult.errors.push(`認證錯誤: ${authError}`)
        }

        // 步驟 4: 測試詢價提交
        addLog('4️⃣ 測試詢價提交...')

        const testInquiryData = {
          customer_name: '診斷測試',
          customer_email: user.email,
          customer_phone: '0912345678',
          notes: '這是診斷測試資料，可以安全刪除',
          items: [
            {
              product_id: 'DIAG-TEST-001',
              product_name: '診斷測試商品',
              product_category: '測試',
              quantity: 1,
              unit_price: 1,
            },
          ],
        }

        try {
          const testResponse = await fetch('/api/inquiries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(testInquiryData),
          })

          const testResult = await testResponse.json()

          diagnosisResult.details.testResult = {
            status: testResponse.status,
            result: testResult,
          }

          addLog(`📊 測試詢價提交結果: ${testResponse.status}`)

          if (testResponse.ok) {
            diagnosisResult.testInsert = true
            addLog('✅ 測試詢價提交成功！問題已解決')

            // 立即清理測試資料
            if (testResult.data && testResult.data.id) {
              addLog('🧹 清理測試資料...')
              try {
                await fetch(`/api/inquiries/${testResult.data.id}`, {
                  method: 'DELETE',
                  credentials: 'include',
                })
                addLog('✅ 測試資料已清理')
              } catch (_cleanupError) {
                addLog('⚠️ 測試資料清理失敗（無關緊要）')
              }
            }
          } else {
            addLog(`❌ 測試詢價提交失敗: ${testResult.error}`)
            diagnosisResult.errors.push(`測試提交失敗: ${testResult.error}`)

            // 分析具體錯誤
            if (testResult.error && testResult.error.includes('row-level security')) {
              addLog('🔍 錯誤分析: RLS 政策問題')
              addLog('💡 建議解決方案: 執行 RLS 修復 SQL')
            } else if (
              testResult.error &&
              testResult.error.includes('relation') &&
              testResult.error.includes('does not exist')
            ) {
              addLog('🔍 錯誤分析: 資料表不存在')
              addLog('💡 建議解決方案: 執行資料庫遷移')
            }
          }
        } catch (testError) {
          addLog(`❌ 測試過程中發生錯誤: ${testError}`)
          diagnosisResult.errors.push(`測試錯誤: ${testError}`)
        }
      } else {
        addLog('❌ 使用者未認證')
        diagnosisResult.errors.push('使用者未認證')
      }
    } catch (error) {
      addLog(`❌ 診斷過程中發生錯誤: ${error}`)
      diagnosisResult.errors.push(`診斷錯誤: ${error}`)
    }

    addLog('🏁 診斷完成')
    setResult(diagnosisResult)
    setIsRunning(false)
  }, [user, addLog])

  // 自動運行診斷（如果使用者已登入）
  useEffect(() => {
    if (user && !authLoading) {
      // 延遲 1 秒自動運行
      const timer = setTimeout(() => {
        runDiagnosis()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [user, authLoading, runDiagnosis])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-900"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-36">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Supabase 詢價功能診斷</h1>
          <p className="text-gray-600">自動檢測詢價功能的問題並提供修復建議</p>
        </div>

        {/* 控制按鈕 */}
        <div className="text-center mb-8">
          <button
            onClick={runDiagnosis}
            disabled={isRunning}
            className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
          >
            {isRunning ? '🔄 診斷中...' : '🚀 開始診斷'}
          </button>
        </div>

        {/* 診斷結果 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 診斷結果摘要</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div
                className={`text-center p-4 rounded-lg ${result.connection ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <div className="text-2xl mb-2">{result.connection ? '✅' : '❌'}</div>
                <div className="font-medium">Supabase 連接</div>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${result.auth ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <div className="text-2xl mb-2">{result.auth ? '✅' : '❌'}</div>
                <div className="font-medium">使用者認證</div>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${result.testInsert ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <div className="text-2xl mb-2">{result.testInsert ? '✅' : '❌'}</div>
                <div className="font-medium">詢價提交測試</div>
              </div>
            </div>

            {/* 錯誤列表 */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-red-800 mb-2">❌ 發現的問題:</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 成功狀態 */}
            {result.testInsert && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">🎉 診斷結果:</h3>
                <p className="text-green-700">
                  詢價功能運作正常！如果仍有問題，請重新載入頁面再試。
                </p>
              </div>
            )}

            {/* 修復建議 */}
            {!result.testInsert && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">💡 修復建議:</h3>
                <div className="text-blue-700 space-y-2">
                  {!result.connection && <p>• 檢查 .env.local 中的 Supabase 設定</p>}
                  {!result.auth && <p>• 請先登入系統</p>}
                  {result.auth && !result.testInsert && (
                    <>
                      <p>• 前往 Supabase Dashboard 執行修復 SQL</p>
                      <p>• 檢查資料表是否存在（inquiries, inquiry_items）</p>
                      <p>• 檢查 RLS 政策設定</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 診斷日誌 */}
        {logs.length > 0 && (
          <div className="bg-black rounded-lg p-4">
            <h2 className="text-white font-bold mb-4">📋 診斷日誌</h2>
            <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 text-sm font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未登入狀態 */}
        {!user && !authLoading && (
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-yellow-800 mb-2">需要登入才能進行診斷</h2>
            <p className="text-yellow-700 mb-4">請先登入您的帳戶以進行詢價功能診斷</p>
            <a
              href="/login"
              className="inline-block bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              前往登入
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
