export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  static created<T>(data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || '資源創建成功',
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  static error(message: string, status: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  static badRequest(message: string = '請求格式錯誤'): Response {
    return this.error(message, 400);
  }
  
  static unauthorized(message: string = '未授權訪問'): Response {
    return this.error(message, 401);
  }
  
  static forbidden(message: string = '禁止訪問'): Response {
    return this.error(message, 403);
  }
  
  static notFound(message: string = '資源不存在'): Response {
    return this.error(message, 404);
  }
  
  static methodNotAllowed(message: string = '不支援的請求方法'): Response {
    return this.error(message, 405);
  }
  
  static conflict(message: string = '資源衝突'): Response {
    return this.error(message, 409);
  }
  
  static tooManyRequests(message: string = '請求過於頻繁'): Response {
    return this.error(message, 429);
  }
  
  static internalError(message: string = '伺服器內部錯誤'): Response {
    return this.error(message, 500);
  }
}

export function handleApiError(error: any): Response {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return ApiResponseBuilder.badRequest(error.message);
  }
  
  if (error.name === 'UnauthorizedError') {
    return ApiResponseBuilder.unauthorized(error.message);
  }
  
  if (error.name === 'NotFoundError') {
    return ApiResponseBuilder.notFound(error.message);
  }
  
  return ApiResponseBuilder.internalError(
    process.env.NODE_ENV === 'production' 
      ? '系統暫時無法處理請求'
      : error.message
  );
}