'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
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
    { href: '/culture', label: '歲月留影', isExternal: false },
    { href: '/products', label: '產品介紹', isExternal: false },
    { href: '/news', label: '農產新聞', isExternal: false },
    { href: '/schedule', label: '擺攤行程', isExternal: false },
    { href: '/farm-tour', label: '觀光果園', isExternal: false },
    { href: '/locations', label: '門市據點', isExternal: false },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-lg shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-8 py-4 lg:py-5">
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-center">
          {/* Desktop Layout */}
          <div className="justify-self-start">
            <Link href="/" className="block">
              <div className="text-2xl font-bold text-amber-900 tracking-tight">
                豪德茶業
              </div>
              <div className="text-xs text-amber-700/70 font-medium tracking-wider">
                HAUDE TEA
              </div>
            </Link>
          </div>

          <div className="justify-self-center">
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <div key={item.href} className="group relative py-2">
                  {item.isExternal ? (
                    <a href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </a>
                  ) : (
                    <Link href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium ${isActive(item.href) ? 'text-amber-900' : ''
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

          <div className="justify-self-end">
            <div className="flex items-center space-x-3">
              {/* Auth Button */}
              <AuthButton />
              
              {/* Admin Button - 只有登入時才顯示 */}
              {user && (
                <Link 
                  href="/admin/products"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-900 hover:bg-amber-800 rounded-full transition-all duration-200 flex items-center space-x-1"
                >
                  <span>🛠</span>
                  <span>管理</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          {/* Compact Header for smaller screens */}
          <div className="flex items-center justify-between">
            {/* Brand */}
            <Link href="/" className="block">
              <div className="text-xl font-bold text-amber-900 tracking-tight">
                豪德茶業
              </div>
              <div className="text-xs text-amber-700/70 font-medium tracking-wider">
                HAUDE TEA
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              {/* Auth Button - Mobile */}
              <AuthButton isMobile />
              
              {/* Admin Button - Mobile - 只有登入時才顯示 */}
              {user && (
                <Link 
                  href="/admin/products"
                  className="px-2 py-1 text-xs font-medium text-white bg-amber-900 hover:bg-amber-800 rounded-full transition-all duration-200"
                >
                  🛠 管理
                </Link>
              )}
            </div>
          </div>

          {/* Multi-row Navigation for smaller screens */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              {navItems.map((item) => (
                <div key={item.href} className="group relative py-2">
                  {item.isExternal ? (
                    <a href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium ${isActive(item.href) ? 'text-amber-900' : ''
                        }`}>
                        {item.label}
                      </span>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></div>
                    </a>
                  ) : (
                    <Link href={item.href} className="block">
                      <span className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium ${isActive(item.href) ? 'text-amber-900' : ''
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