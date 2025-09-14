'use client'

// Facebook SVG Icon
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

// Instagram SVG Icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

interface SocialLinksProps {
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  showLabels?: boolean
  className?: string
}

export default function SocialLinks({
  size = 'md',
  orientation = 'horizontal',
  showLabels = false,
  className = '',
}: SocialLinksProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
  }

  const containerClasses =
    orientation === 'horizontal' ? 'flex items-center space-x-3' : 'flex flex-col space-y-3'

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/groups/284358098576086/?locale=zh_TW',
      icon: <FacebookIcon className="w-5 h-5" />,
      bgColor: 'hover:bg-blue-600',
      textColor: 'hover:text-blue-600',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/explore/locations/837190377/hao-de-hong-rou-li-guo-yuan/',
      icon: <InstagramIcon className="w-5 h-5" />,
      bgColor: 'hover:bg-pink-600',
      textColor: 'hover:text-pink-600',
    },
  ]

  return (
    <div className={`${containerClasses} ${className}`}>
      {socialLinks.map(social => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            ${sizeClasses[size]} 
            bg-amber-100 text-amber-900 
            rounded-full flex items-center justify-center 
            transition-all duration-300 
            ${social.bgColor} hover:text-white 
            hover:scale-110 hover:shadow-lg
            group
          `}
          title={`關注我們的 ${social.name}`}
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            {social.icon}
          </div>
        </a>
      ))}

      {showLabels && (
        <div className={orientation === 'horizontal' ? 'ml-2' : 'mt-2'}>
          <p className="text-sm text-gray-600 font-medium">關注我們</p>
        </div>
      )}
    </div>
  )
}
