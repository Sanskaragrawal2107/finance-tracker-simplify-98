
import React from 'react';
import { cn } from '@/lib/utils';

interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
}

const CustomCard: React.FC<CustomCardProps> = ({ 
  children, 
  className,
  hoverEffect = false,
  glass = false
}) => {
  return (
    <div 
      className={cn(
        "rounded-lg p-6 shadow-subtle border animate-scale-in",
        glass && "glass-panel",
        hoverEffect && "hover-card",
        className
      )}
    >
      {children}
    </div>
  );
};

export default CustomCard;
