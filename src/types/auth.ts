export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  role: 'customer' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  identifier: string // 可以是 email 或手機號碼
  password: string
  inputType: 'email' | 'phone'
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
}

export interface AuthResponse {
  user: Omit<User, 'password'>
  token: string
}

export interface AuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>
  register(userData: RegisterRequest): Promise<AuthResponse>
  logout(): Promise<void>
  verifyToken(token: string): Promise<User | null>
  updateProfile(id: string, updates: Partial<User>): Promise<User>
}
