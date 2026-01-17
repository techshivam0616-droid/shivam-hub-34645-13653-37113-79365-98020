import { Crown } from 'lucide-react';

interface KingBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { icon: 'h-3 w-3', wrapper: 'h-5 w-5' },
  md: { icon: 'h-3.5 w-3.5', wrapper: 'h-6 w-6' },
  lg: { icon: 'h-4 w-4', wrapper: 'h-7 w-7' }
};

export function KingBadge({ className = '', size = 'md' }: KingBadgeProps) {
  const config = sizeConfig[size];
  
  return (
    <div 
      className={`king-badge-premium ${config.wrapper} ${className}`}
      title="King Badge"
    >
      <Crown 
        className={`${config.icon} text-amber-900 drop-shadow-sm`}
        strokeWidth={2.5}
        fill="currentColor"
      />
    </div>
  );
}
