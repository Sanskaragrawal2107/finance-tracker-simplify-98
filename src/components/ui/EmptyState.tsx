
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  buttonText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  buttonText = "Add Item", 
  onAction 
}) => {
  return (
    <div className="text-center p-8 border rounded-lg bg-muted/30">
      <p className="text-muted-foreground mb-4">{message}</p>
      {onAction && (
        <Button onClick={onAction}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
