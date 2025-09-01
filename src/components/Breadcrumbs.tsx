/**
 * Breadcrumbs 導航組件
 * 
 * 提供頁面導航路徑顯示，支援 JSON-LD 結構化資料
 * 有助於 SEO 和使用者導航體驗
 */

import Link from 'next/link';
import { FC, useMemo } from 'react';

// ============================================================================
// 類型定義
// ============================================================================

export interface BreadcrumbItem {
  /** 顯示文字 */
  name: string;
  /** 連結路徑，最後一項通常不提供（表示當前頁面） */
  href?: string;
  /** 是否為當前頁面 */
  current?: boolean;
}

export interface BreadcrumbsProps {
  /** 麵包屑項目列表 */
  items: BreadcrumbItem[];
  /** 自訂樣式 */
  className?: string;
  /** 分隔符號 */
  separator?: string;
  /** 是否顯示首頁連結 */
  showHome?: boolean;
  /** 是否啟用結構化資料 */
  enableStructuredData?: boolean;
  /** 網站基礎 URL */
  baseUrl?: string;
}

// ============================================================================
// 結構化資料組件
// ============================================================================

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
  baseUrl: string;
}

const BreadcrumbStructuredData: FC<BreadcrumbStructuredDataProps> = ({ items, baseUrl }) => {
  const structuredData = useMemo(() => {
    const itemListElement = items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href && {
        item: {
          '@type': 'WebPage',
          '@id': item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}`
        }
      })
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement
    };
  }, [items, baseUrl]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

// ============================================================================
// 主要 Breadcrumbs 組件
// ============================================================================

const Breadcrumbs: FC<BreadcrumbsProps> = ({
  items,
  className = '',
  separator = '/',
  showHome = true,
  enableStructuredData = true,
  baseUrl = 'https://haode-nextjs.vercel.app'
}) => {
  // 準備最終的麵包屑項目列表
  const finalItems = useMemo(() => {
    const result: BreadcrumbItem[] = [];
    
    // 添加首頁（如果需要且不是第一個項目）
    if (showHome && (items.length === 0 || items[0].href !== '/')) {
      result.push({
        name: '首頁',
        href: '/'
      });
    }
    
    // 添加提供的項目
    result.push(...items);
    
    // 標記最後一個項目為當前頁面
    if (result.length > 0) {
      const lastItem = result[result.length - 1];
      lastItem.current = true;
      // 當前頁面不需要連結
      delete lastItem.href;
    }
    
    return result;
  }, [items, showHome]);

  // 如果沒有項目或只有首頁，不顯示麵包屑
  if (finalItems.length <= 1) {
    return null;
  }

  return (
    <>
      {/* 結構化資料 */}
      {enableStructuredData && (
        <BreadcrumbStructuredData 
          items={finalItems} 
          baseUrl={baseUrl} 
        />
      )}
      
      {/* 可見的麵包屑導航 */}
      <nav 
        className={`text-sm text-gray-600 ${className}`}
        aria-label="麵包屑導航"
      >
        <ol className="flex items-center space-x-2">
          {finalItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {/* 分隔符號（除了第一個項目） */}
              {index > 0 && (
                <span 
                  className="mx-2 text-gray-400 select-none" 
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
              
              {/* 麵包屑項目 */}
              {item.current ? (
                <span 
                  className="text-gray-800 font-medium"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="text-amber-900 hover:text-amber-800 hover:underline transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 根據路徑自動生成麵包屑項目
 * @param pathname 當前路徑
 * @param customNames 自定義路徑名稱對映
 */
export const generateBreadcrumbs = (
  pathname: string,
  customNames: Record<string, string> = {}
): BreadcrumbItem[] => {
  if (pathname === '/') return [];
  
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  const items: BreadcrumbItem[] = [];
  
  // 預設路徑名稱對映
  const defaultNames: Record<string, string> = {
    'products': '產品',
    'news': '新聞',
    'culture': '茶文化',
    'locations': '產地介紹',
    'farm-tour': '農場導覽',
    'schedule': '活動行程',
    'admin': '管理後台',
    'login': '登入',
    'register': '註冊',
    'profile': '個人資料',
    'inquiries': '詢問單',
    'about': '關於我們',
    'contact': '聯絡我們',
    ...customNames
  };
  
  let currentPath = '';
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // 跳過動態路由參數（純數字或 UUID 格式）
    if (/^\d+$/.test(segment) || /^[0-9a-f-]{36}$/i.test(segment)) {
      return;
    }
    
    const name = defaultNames[segment] || 
                 segment.replace(/-/g, ' ')
                       .replace(/\b\w/g, l => l.toUpperCase());
    
    items.push({
      name,
      href: currentPath,
      current: index === pathSegments.length - 1
    });
  });
  
  return items;
};

/**
 * 針對特定頁面類型創建麵包屑
 */
export const createProductBreadcrumbs = (productName?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { name: '產品', href: '/products' }
  ];
  
  if (productName) {
    items.push({ name: productName });
  }
  
  return items;
};

export const createNewsBreadcrumbs = (newsTitle?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { name: '農產新聞', href: '/news' }
  ];
  
  if (newsTitle) {
    items.push({ name: newsTitle });
  }
  
  return items;
};

export const createCultureBreadcrumbs = (cultureTitle?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { name: '茶文化', href: '/culture' }
  ];
  
  if (cultureTitle) {
    items.push({ name: cultureTitle });
  }
  
  return items;
};

export const createAdminBreadcrumbs = (...segments: string[]): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { name: '管理後台', href: '/admin' }
  ];
  
  const nameMap: Record<string, string> = {
    'products': '產品管理',
    'users': '用戶管理',
    'orders': '訂單管理',
    'inquiries': '詢問單管理',
    'settings': '系統設定',
    'logs': '系統日誌',
    'add': '新增',
    'edit': '編輯',
    'view': '查看'
  };
  
  let currentPath = '/admin';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      name: nameMap[segment] || segment,
      href: index === segments.length - 1 ? undefined : currentPath
    });
  });
  
  return items;
};

// ============================================================================
// 預設樣式變體
// ============================================================================

export const BreadcrumbVariants = {
  default: '',
  compact: 'text-xs',
  large: 'text-base',
  card: 'bg-white p-4 rounded-lg shadow-sm border',
  minimal: 'text-gray-500',
  dark: 'text-gray-300'
};

// ============================================================================
// 導出
// ============================================================================

export default Breadcrumbs;
export type { BreadcrumbItem, BreadcrumbsProps };