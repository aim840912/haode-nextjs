'use client';

import { InquiryStatus, INQUIRY_STATUS_LABELS, INQUIRY_STATUS_COLORS } from '@/types/inquiry';

interface InquiryStatusBadgeProps {
  status: InquiryStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function InquiryStatusBadge({ 
  status, 
  size = 'md', 
  className = '' 
}: InquiryStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`
        ${INQUIRY_STATUS_COLORS[status]}
        ${sizeClasses[size]}
        rounded-full font-medium
        ${className}
      `}
    >
      {INQUIRY_STATUS_LABELS[status]}
    </span>
  );
}