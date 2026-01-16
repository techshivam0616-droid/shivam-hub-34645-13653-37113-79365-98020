import { Crown } from 'lucide-react';

interface KingBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export function KingBadge({ className = '', size = 'md' }: KingBadgeProps) {
  return (
    <Crown 
      className={`king-badge ${sizeClasses[size]} ${className}`}
      strokeWidth={2.5}
      fill="currentColor"
    />
  );
}
