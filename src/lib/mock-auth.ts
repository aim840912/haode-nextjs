import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

// 模擬用戶資料庫
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@haude.com',
    password: '123456',
    name: '管理員',
    phone: '0912-345-678',
    address: {
      street: '台北市信義區信義路五段7號',
      city: '台北市',
      postalCode: '110',
      country: '台灣'
    },
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'user@haude.com',
    password: '123456',
    name: '一般用戶',
    phone: '0987-654-321',
    role: 'customer',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    email: 'test@example.com',
    password: 'password',
    name: '測試用戶',
    role: 'customer',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// 生成模擬 JWT token
function generateMockToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: userId, 
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小時後過期
  }));
  const signature = btoa(`mock-signature-${userId}`);
  
  return `${header}.${payload}.${signature}`;
}

// 驗證模擬 token
function verifyMockToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // 檢查是否過期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload.sub;
  } catch {
    return null;
  }
}

export class MockAuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('電子郵件或密碼錯誤');
    }
    
    const { password, ...userWithoutPassword } = user;
    const token = generateMockToken(user.id);
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 檢查 email 是否已存在
    const existingUser = MOCK_USERS.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('此電子郵件已被註冊');
    }
    
    // 建立新用戶
    const newUser: User & { password: string } = {
      id: (MOCK_USERS.length + 1).toString(),
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_USERS.push(newUser);
    
    const { password, ...userWithoutPassword } = newUser;
    const token = generateMockToken(newUser.id);
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  static async verifyToken(token: string): Promise<User | null> {
    const userId = verifyMockToken(token);
    if (!userId) return null;
    
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('用戶不存在');
    }
    
    // 更新用戶資料
    MOCK_USERS[userIndex] = {
      ...MOCK_USERS[userIndex],
      ...updates,
      id: userId, // 確保 ID 不被覆蓋
      updatedAt: new Date().toISOString()
    };
    
    const { password, ...userWithoutPassword } = MOCK_USERS[userIndex];
    return userWithoutPassword;
  }
  
  static async logout(): Promise<void> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 300));
    // 在真實應用中，這裡可能會將 token 加入黑名單
  }
  
  // 工具方法：取得所有測試帳號（僅用於開發）
  static getTestAccounts() {
    return MOCK_USERS.map(user => ({
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role
    }));
  }
}