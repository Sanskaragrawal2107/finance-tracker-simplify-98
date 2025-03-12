
import React from 'react';
import { Input } from "./input";
import { Label } from "./label";

interface InputWithLabelProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  description,
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Input id={inputId} {...props} />
    </div>
  );
};
