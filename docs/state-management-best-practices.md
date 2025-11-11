# 狀態管理最佳實踐指南

本文檔記錄了專案中的狀態管理最佳實踐，幫助開發者選擇合適的狀態管理方案。

## 目錄

- [決策流程圖](#決策流程圖)
- [useState vs useReducer](#usestate-vs-usereducer)
- [自訂 Hooks](#自訂-hooks)
- [實際案例](#實際案例)
- [常見陷阱](#常見陷阱)

---

## 決策流程圖

```
開始：需要管理狀態
    ↓
是否只有 1-3 個簡單狀態？
    ├─ 是 → 使用 useState
    └─ 否 ↓
是否有 5+ 個相關的狀態？
    ├─ 是 → 使用 useReducer
    └─ 否 ↓
是否需要複雜的狀態轉換邏輯？
    ├─ 是 → 使用 useReducer
    └─ 否 → 使用 useState（考慮合併為物件）
```

---

## useState vs useReducer

### 何時使用 useState

✅ **適用情況**：
- 狀態數量少（1-3 個）
- 狀態之間沒有複雜關聯
- 狀態更新邏輯簡單
- 元件邏輯簡單

```tsx
// ✅ 好的 useState 使用範例
function SimpleCounter() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

### 何時使用 useReducer

✅ **適用情況**：
- 狀態數量多（5+ 個）
- 狀態之間有複雜關聯
- 需要複雜的狀態轉換邏輯
- 需要更好的可測試性

```tsx
// ✅ 好的 useReducer 使用範例
interface FormState {
  loading: boolean
  data: Data[]
  filters: Filters
  error: string | null
  selectedItems: string[]
}

type FormAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Data[] }
  | { type: 'SET_FILTER'; payload: Filters }
  | { type: 'SELECT_ITEM'; payload: string }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null }
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, data: action.payload }
    case 'SET_FILTER':
      return { ...state, filters: action.payload }
    case 'SELECT_ITEM':
      return {
        ...state,
        selectedItems: [...state.selectedItems, action.payload]
      }
    default:
      return state
  }
}
```

---

## 自訂 Hooks

### 建立自訂 Reducer Hook

將 reducer 邏輯封裝為自訂 hook 可以提供更好的可重用性和易用性。

**結構範例**：

```tsx
// src/hooks/useFeatureReducer.ts
export interface FeatureState {
  // 狀態定義
}

export type FeatureAction =
  | { type: 'ACTION_1'; payload: any }
  | { type: 'ACTION_2' }

function featureReducer(state: FeatureState, action: FeatureAction): FeatureState {
  switch (action.type) {
    // reducer 邏輯
  }
}

export function useFeatureReducer() {
  const [state, dispatch] = useReducer(featureReducer, initialState)

  // 提供方便的 helper functions
  const actions = {
    action1: useCallback((payload: any) => {
      dispatch({ type: 'ACTION_1', payload })
    }, []),
    action2: useCallback(() => {
      dispatch({ type: 'ACTION_2' })
    }, []),
  }

  return { state, actions, dispatch }
}
```

**使用範例**：

```tsx
function MyComponent() {
  const { state, actions } = useFeatureReducer()

  return (
    <div>
      <p>Loading: {state.loading}</p>
      <button onClick={() => actions.action1('data')}>
        Do Something
      </button>
    </div>
  )
}
```

### 表單狀態管理：useForm Hook

對於表單密集的頁面，使用 `useForm` hook：

```tsx
import { useForm } from '@/hooks/useForm'

interface LoginForm {
  email: string
  password: string
}

function LoginPage() {
  const form = useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: any = {}
      if (!values.email) errors.email = 'Email 為必填'
      if (!values.password) errors.password = 'Password 為必填'
      return errors
    },
    onSubmit: async (values) => {
      await login(values)
    }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && (
        <span className="error">{form.errors.email}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? '提交中...' : '登入'}
      </button>
    </form>
  )
}
```

---

## 實際案例

### 案例 1：Site Settings 頁面

**問題**：17 個 useState 導致程式碼難以維護

**解決方案**：使用 `useSiteSettingsReducer`

```tsx
// ❌ 重構前
const [saving, setSaving] = useState(false)
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
const [homeHeroImages, setHomeHeroImages] = useState<string[]>([])
const [farmTourHeroBg, setFarmTourHeroBg] = useState<string>('')
// ... 還有 13 個 useState

// ✅ 重構後
const { state, actions } = useSiteSettingsReducer()

// 使用
actions.setSaving(true)
actions.setHomeHeroImages(images)
actions.showMessage('success', '儲存成功')
```

**改善**：
- 程式碼行數：674 → 665 行（-1.3%）
- useState 數量：17 → 1（-94%）
- 可維護性：✅ 大幅提升
- 可測試性：✅ Reducer 可獨立測試

### 案例 2：Dev Notes 頁面

**問題**：7 個 useState 管理資料、篩選器和 UI 狀態

**解決方案**：使用 `useDevNotesReducer`

```tsx
// ❌ 重構前
const [notes, setNotes] = useState<DevNote[]>([])
const [stats, setStats] = useState<DevNoteStats | null>(null)
const [loading, setLoading] = useState(true)
const [typeFilter, setTypeFilter] = useState<DevNoteType | 'all'>('all')
// ... 還有 3 個 useState

// ✅ 重構後
const { state, actions } = useDevNotesReducer()

// 使用
actions.loadDataStart()
actions.loadDataSuccess(notes, stats)
actions.setTypeFilter('bug')
```

**改善**：
- useState 數量：7 → 1（-86%）
- 整合了載入流程（loadDataStart, loadDataSuccess, loadDataError）

### 案例 3：Farm Tour Edit 頁面

**問題**：6 個 useState 管理載入狀態和圖片

**解決方案**：使用 `useFarmTourEditReducer`

```tsx
// ❌ 重構前
const [loading, setLoading] = useState(false)
const [initialLoading, setInitialLoading] = useState(true)
const [activityId, setActivityId] = useState<string>('')
const [uploadedImages, setUploadedImages] = useState<string[]>([])
const [existingImages, setExistingImages] = useState<string[]>([])
const [imageDeleted, setImageDeleted] = useState(false)

// ✅ 重構後
const { state, actions } = useFarmTourEditReducer()

// 使用
actions.setLoading(true)
actions.loadActivitySuccess(id, image)
actions.deleteExistingImage()
```

**改善**：
- useState 數量：7 → 1 useReducer + 1 formData（-71%）
- 整合了活動載入流程

---

## 常見陷阱

### ❌ 陷阱 1：過度使用 useReducer

```tsx
// ❌ 不好：簡單狀態使用 reducer 過於複雜
type Action = { type: 'TOGGLE' }
function reducer(state: boolean, action: Action) {
  return !state
}
function Component() {
  const [isOpen, dispatch] = useReducer(reducer, false)
  return <button onClick={() => dispatch({ type: 'TOGGLE' })}>Toggle</button>
}

// ✅ 好：使用 useState 更簡潔
function Component() {
  const [isOpen, setIsOpen] = useState(false)
  return <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
}
```

### ❌ 陷阱 2：Reducer 中執行副作用

```tsx
// ❌ 不好：在 reducer 中執行 API 呼叫
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      fetch('/api/data').then(data => {  // 副作用！
        // ...
      })
      return { ...state, loading: true }
  }
}

// ✅ 好：在元件中執行副作用
function Component() {
  const { state, actions } = useDataReducer()

  useEffect(() => {
    async function loadData() {
      actions.setLoading(true)
      const data = await fetch('/api/data')
      actions.setData(data)
    }
    loadData()
  }, [])
}
```

### ❌ 陷阱 3：忘記使用 useCallback

```tsx
// ❌ 不好：每次渲染都建立新函數
export function useFeatureReducer() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = {
    doSomething: (payload) => {  // 每次渲染都是新的函數
      dispatch({ type: 'DO_SOMETHING', payload })
    }
  }

  return { state, actions }
}

// ✅ 好：使用 useCallback 優化
export function useFeatureReducer() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = {
    doSomething: useCallback((payload) => {
      dispatch({ type: 'DO_SOMETHING', payload })
    }, [])  // 函數保持穩定
  }

  return { state, actions }
}
```

### ❌ 陷阱 4：Action Type 沒有類型安全

```tsx
// ❌ 不好：使用字串常數，容易拼錯
dispatch({ type: 'SET_LAODING', payload: true })  // 拼字錯誤！

// ✅ 好：使用 TypeScript 類型
export type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: Data[] }

// TypeScript 會在編譯時捕捉錯誤
dispatch({ type: 'SET_LAODING', payload: true })  // TS 錯誤！
```

---

## 最佳實踐檢查清單

建立新的狀態管理時，請檢查以下項目：

- [ ] 選擇了適合的狀態管理方式（useState vs useReducer）
- [ ] 為複雜狀態建立了自訂 hook
- [ ] 所有 action types 都有完整的 TypeScript 類型定義
- [ ] Helper functions 使用了 useCallback 優化
- [ ] Reducer 函數是純函數（無副作用）
- [ ] 提供了清晰的 JSDoc 文檔和使用範例
- [ ] 考慮了可測試性（reducer 可獨立測試）

---

## 參考資源

### 專案中的範例

- `src/hooks/useSiteSettingsReducer.ts` - 複雜狀態管理範例
- `src/hooks/useDevNotesReducer.ts` - 資料載入與篩選範例
- `src/hooks/useFarmTourEditReducer.ts` - 圖片管理範例
- `src/hooks/useForm.ts` - 通用表單管理範例

### 外部資源

- [React Hooks 官方文檔](https://react.dev/reference/react)
- [useReducer vs useState](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

---

**最後更新**：2025-11-06
