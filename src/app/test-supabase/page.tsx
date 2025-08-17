'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  duration?: number
}

export default function TestSupabasePage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. 基本連線測試', status: 'pending', message: '等待測試...' },
    { name: '2. 讀取產品資料', status: 'pending', message: '等待測試...' },
    { name: '3. 建立測試資料', status: 'pending', message: '等待測試...' },
    { name: '4. 使用者驗證', status: 'pending', message: '等待測試...' },
    { name: '5. RLS 政策測試', status: 'pending', message: '等待測試...' },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (index: number, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, duration } : test
    ))
  }

  const runTests = async () => {
    setIsRunning(true)
    
    // Test 1: 基本連線測試
    try {
      const start = Date.now()
      const { data, error } = await supabase.from('products').select('count').limit(1)
      const duration = Date.now() - start
      
      if (error) {
        updateTest(0, 'error', `連線失敗: ${error.message}`, duration)
      } else {
        updateTest(0, 'success', `連線成功！響應時間: ${duration}ms`, duration)
      }
    } catch (err) {
      updateTest(0, 'error', `連線錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
    }

    // Test 2: 讀取產品資料
    try {
      const start = Date.now()
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(3)
      const duration = Date.now() - start

      if (error) {
        updateTest(1, 'error', `讀取失敗: ${error.message}`, duration)
      } else {
        updateTest(1, 'success', `成功讀取 ${data?.length || 0} 筆產品資料`, duration)
      }
    } catch (err) {
      updateTest(1, 'error', `讀取錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
    }

    // Test 3: 建立測試資料 (如果有 test_data 表)
    try {
      const start = Date.now()
      const testData = {
        name: `測試資料_${Date.now()}`,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('test_data')
        .insert(testData)
        .select()
      const duration = Date.now() - start

      if (error) {
        if (error.code === '42P01') { // table doesn't exist
          updateTest(2, 'error', '測試表 test_data 不存在，跳過此測試', duration)
        } else {
          updateTest(2, 'error', `寫入失敗: ${error.message}`, duration)
        }
      } else {
        updateTest(2, 'success', `成功建立測試資料`, duration)
      }
    } catch (err) {
      updateTest(2, 'error', `寫入錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
    }

    // Test 4: 使用者驗證狀態
    try {
      const start = Date.now()
      const { data: { user }, error } = await supabase.auth.getUser()
      const duration = Date.now() - start

      if (error) {
        updateTest(3, 'error', `Auth 錯誤: ${error.message}`, duration)
      } else {
        if (user) {
          updateTest(3, 'success', `已登入使用者: ${user.email}`, duration)
        } else {
          updateTest(3, 'success', `未登入狀態（正常）`, duration)
        }
      }
    } catch (err) {
      updateTest(3, 'error', `Auth 錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
    }

    // Test 5: RLS 政策測試
    try {
      const start = Date.now()
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      const duration = Date.now() - start

      if (error) {
        if (error.code === '42P01') { // table doesn't exist
          updateTest(4, 'error', 'profiles 表不存在，跳過 RLS 測試', duration)
        } else if (error.code === '42501') { // insufficient privilege
          updateTest(4, 'success', 'RLS 政策正常運作（拒絕未授權存取）', duration)
        } else {
          updateTest(4, 'error', `RLS 測試失敗: ${error.message}`, duration)
        }
      } else {
        updateTest(4, 'success', `RLS 測試通過，可存取 ${data?.length || 0} 筆資料`, duration)
      }
    } catch (err) {
      updateTest(4, 'error', `RLS 錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase 連線測試
          </h1>
          <p className="text-gray-600 mb-8">
            測試 Supabase 資料庫連線、API Keys 和基本功能
          </p>

          <div className="mb-8">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? '測試中...' : '開始測試'}
            </button>
          </div>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  test.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : test.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {getStatusIcon(test.status)} {test.name}
                  </h3>
                  {test.duration && (
                    <span className="text-sm text-gray-500">
                      {test.duration}ms
                    </span>
                  )}
                </div>
                <p className={`mt-2 ${getStatusColor(test.status)}`}>
                  {test.message}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 測試結果說明
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>連線測試</strong>：驗證 Supabase URL 和 API Key 是否正確</li>
              <li>• <strong>讀取測試</strong>：確認可以從資料庫讀取資料</li>
              <li>• <strong>寫入測試</strong>：測試是否可以新增資料（需要 test_data 表）</li>
              <li>• <strong>Auth 測試</strong>：檢查使用者驗證狀態</li>
              <li>• <strong>RLS 測試</strong>：驗證 Row Level Security 政策</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              ⚠️ 如果測試失敗
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 檢查 .env.local 中的環境變數是否正確</li>
              <li>• 確認 Supabase 專案是否已啟動</li>
              <li>• 驗證 API Keys 是否已更新為最新版本</li>
              <li>• 檢查 Supabase 專案的 RLS 政策設定</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}