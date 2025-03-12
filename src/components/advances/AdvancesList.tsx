
import React from 'react';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Advance, ApprovalStatus, RecipientType, AdvancePurpose } from '@/lib/types';
import { Button } from '@/components/ui/button';
import CustomCard from '@/components/ui/CustomCard';
import { cn } from '@/lib/utils';

interface AdvancesListProps {
  advances: Advance[];
  onViewDetails: (advance: Advance) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const AdvancesList: React.FC<AdvancesListProps> = ({ 
  advances, 
  onViewDetails, 
  onApprove, 
  onReject 
}) => {
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case ApprovalStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case ApprovalStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case ApprovalStatus.PENDING:
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case ApprovalStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ApprovalStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ApprovalStatus.PENDING:
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    switch(type) {
      case RecipientType.WORKER:
        return "Worker";
      case RecipientType.SUBCONTRACTOR:
        return "Subcontractor";
      case RecipientType.SUPERVISOR:
        return "Supervisor";
      default:
        return type;
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch(purpose) {
      case AdvancePurpose.ADVANCE:
        return "Advance";
      case AdvancePurpose.SAFETY_SHOES:
        return "Safety Shoes";
      case AdvancePurpose.TOOLS:
        return "Tools";
      case AdvancePurpose.OTHER:
        return "Other";
      default:
        return purpose;
    }
  };

  return (
    <div className="space-y-4">
      {advances.length > 0 ? (
        advances.map((advance) => (
          <CustomCard key={advance.id} className="p-0 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{advance.recipientName}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({getRecipientTypeLabel(advance.recipientType as string)})
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getStatusBadgeClass(advance.status as string)
                    )}>
                      {getStatusIcon(advance.status as string)}
                      <span className="ml-1">{advance.status}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
                    <span>₹{advance.amount.toLocaleString()}</span>
                    <span>•</span>
                    <span>{getPurposeLabel(advance.purpose as string)}</span>
                    <span>•</span>
                    <span>{typeof advance.date === 'string' 
                      ? format(new Date(advance.date), 'dd MMM yyyy') 
                      : format(advance.date, 'dd MMM yyyy')}
                    </span>
                  </div>
                  {advance.remarks && (
                    <p className="mt-2 text-sm">{advance.remarks}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewDetails(advance)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  {advance.status === ApprovalStatus.PENDING && onApprove && onReject && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => onApprove(advance.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onReject(advance.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CustomCard>
        ))
      ) : (
        <CustomCard>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No advances found.</p>
          </div>
        </CustomCard>
      )}
    </div>
  );
};

export default AdvancesList;
