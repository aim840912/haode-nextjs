export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  role: 'customer' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
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