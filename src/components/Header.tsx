'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import SocialLinks from './SocialLinks';
import CartIcon from './CartIcon';
import { ExpandableSearchBar } from './ui/ExpandableSearchBar';
import InquiryNotificationBadge from './InquiryNotificationBadge';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/', label: '農業探索', isExternal: false },
    { href: '/farm-tour', label: '觀光果園', isExternal: false },
    { href: '/products', label: '產品介紹', isExternal: false },
    { href: '/locations', label: '門市據點', isExternal: false },
    { href: '/culture', label: '歲月留影', isExternal: false },
    { href: '/schedule', label: '擺攤行程', isExternal: false },
    { href: '/news', label: '農產新聞', isExternal: false },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50">
      <nav className="max-w-7xl mx-auto px-8 py-4 lg:py-5">
        <div className="hidden lg:block">
          {/* Desktop Layout */}
          {/* 上層：品牌和登入 */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="block">
              <div className="text-3xl font-display text-amber-900 tracking-tight">
                豪德茶業
              </div>
              <div className="text-xs text-amber-700/70 font-inter font-medium tracking-wider">
                HAUDE TEA
              </div>
            </Link>

            <AuthButton />
          </div>

          {/* 下層：導航選單和工具列 */}
          <div className="flex items-center justify-between">
            {/* 左側：導航選單 */}
            <div className="flex items-center space-x-5">
              {navItems.map((item) => (
                <div key={item.href} className="group relative py-2">
                  {item.isExternal ? (
                    <a href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </a>
                  ) : (
                    <Link href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* 右側：工具列 */}
            <div className="flex items-center space-x-3">
              {/* 可展開搜尋欄 */}
              <ExpandableSearchBar iconOnly />

              {/* Social Links */}
              <SocialLinks size="sm" />

              {/* 詢價通知徽章 - 只有管理員才顯示 */}
              {user?.role === 'admin' && <InquiryNotificationBadge size="sm" />}

              {/* Cart Icon - 只有登入時才顯示 */}
              {user && <CartIcon size="sm" />}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          {/* Compact Header for smaller screens */}
          <div className="flex items-center justify-between">
            {/* Brand */}
            <Link href="/" className="block">
              <div className="text-2xl font-display text-amber-900 tracking-tight">
                豪德茶業
              </div>
              <div className="text-xs text-amber-700/70 font-inter font-medium tracking-wider">
                HAUDE TEA
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              {/* 可展開搜尋欄 - Mobile */}
              <ExpandableSearchBar iconOnly />

              {/* Social Links - Mobile */}
              <SocialLinks size="sm" />

              {/* 詢價通知徽章 - Mobile - 只有管理員才顯示 */}
              {user?.role === 'admin' && <InquiryNotificationBadge size="sm" />}

              {/* Cart Icon - Mobile - 只有登入時才顯示 */}
              {user && <CartIcon size="sm" />}

              {/* Auth Button - Mobile */}
              <AuthButton isMobile />
            </div>
          </div>

          {/* Multi-row Navigation for smaller screens */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
              {navItems.map((item) => (
                <div key={item.href} className="group relative py-2">
                  {item.isExternal ? (
                    <a href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </a>
                  ) : (
                    <Link href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}