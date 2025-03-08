
import React from 'react';
import { cn } from '@/lib/utils';

interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
  onClick?: () => void; // Add the onClick prop
}

const CustomCard: React.FC<CustomCardProps> = ({ 
  children, 
  className,
  hoverEffect = false,
  glass = false,
  onClick // Add the onClick prop
}) => {
  return (
    <div 
      className={cn(
        "rounded-lg p-6 shadow-subtle border animate-scale-in",
        glass && "glass-panel",
        hoverEffect && "hover-card",
        className
      )}
      onClick={onClick} // Use the onClick prop
    >
      {children}
    </div>
  );
};

export default CustomCard;
