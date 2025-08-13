'use client';

interface SocialLinksProps {
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export default function SocialLinks({ 
  size = 'md', 
  orientation = 'horizontal', 
  showLabels = false,
  className = ''
}: SocialLinksProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl'
  };

  const containerClasses = orientation === 'horizontal' 
    ? 'flex items-center space-x-3' 
    : 'flex flex-col space-y-3';

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/haudetea',
      icon: '📘',
      bgColor: 'hover:bg-blue-600',
      textColor: 'hover:text-blue-600'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/haudetea',
      icon: '📷',
      bgColor: 'hover:bg-pink-600',
      textColor: 'hover:text-pink-600'
    }
  ];

  return (
    <div className={`${containerClasses} ${className}`}>
      {socialLinks.map((social) => (
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
          <span className="group-hover:scale-110 transition-transform duration-200">
            {social.icon}
          </span>
        </a>
      ))}
      
      {showLabels && (
        <div className={orientation === 'horizontal' ? 'ml-2' : 'mt-2'}>
          <p className="text-sm text-gray-600 font-medium">關注我們</p>
        </div>
      )}
    </div>
  );
}