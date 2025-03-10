
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HODebitsCardProps {
  totalDebits: number;
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

const HODebitsCard: React.FC<HODebitsCardProps> = ({ 
  totalDebits,
  className,
  valuePrefix = '',
  valueSuffix = '',
  trend
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Debits by H.O.</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-xl md:text-2xl font-bold">
            {valuePrefix && <span className="mr-1">{valuePrefix}</span>}
            {!valuePrefix && <IndianRupee className="h-5 w-5 mr-1 text-muted-foreground" />}
            {formatCurrency(totalDebits)}
            {valueSuffix && <span className="ml-1">{valueSuffix}</span>}
          </div>
          
          {trend && (
            <Badge variant={trend.isPositive ? "default" : "destructive"} className="flex items-center gap-1">
              {trend.isPositive ? 
                <TrendingUp className="h-3.5 w-3.5" /> : 
                <TrendingDown className="h-3.5 w-3.5" />
              }
              {trend.value}%
            </Badge>
          )}
        </div>
        
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HODebitsCard;
