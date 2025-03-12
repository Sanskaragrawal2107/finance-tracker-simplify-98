
import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ApprovalStatus, RecipientType, AdvancePurpose } from '@/lib/types';

interface AdvanceFilterProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterRecipientType: string;
  setFilterRecipientType: (type: string) => void;
  filterPurpose: string;
  setFilterPurpose: (purpose: string) => void;
}

const AdvanceFilter: React.FC<AdvanceFilterProps> = ({
  filterStatus,
  setFilterStatus,
  filterRecipientType,
  setFilterRecipientType,
  filterPurpose,
  setFilterPurpose
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filter Advances</h4>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Status</h5>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-all-status" 
                  checked={filterStatus === 'all'}
                  onCheckedChange={() => setFilterStatus('all')}
                />
                <Label htmlFor="filter-all-status">All Statuses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-pending" 
                  checked={filterStatus === ApprovalStatus.PENDING}
                  onCheckedChange={() => setFilterStatus(ApprovalStatus.PENDING)}
                />
                <Label htmlFor="filter-pending">Pending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-approved" 
                  checked={filterStatus === ApprovalStatus.APPROVED}
                  onCheckedChange={() => setFilterStatus(ApprovalStatus.APPROVED)}
                />
                <Label htmlFor="filter-approved">Approved</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-rejected" 
                  checked={filterStatus === ApprovalStatus.REJECTED}
                  onCheckedChange={() => setFilterStatus(ApprovalStatus.REJECTED)}
                />
                <Label htmlFor="filter-rejected">Rejected</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Recipient Type</h5>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-all-recipients" 
                  checked={filterRecipientType === 'all'}
                  onCheckedChange={() => setFilterRecipientType('all')}
                />
                <Label htmlFor="filter-all-recipients">All Recipients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-worker" 
                  checked={filterRecipientType === RecipientType.WORKER}
                  onCheckedChange={() => setFilterRecipientType(RecipientType.WORKER)}
                />
                <Label htmlFor="filter-worker">Worker</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-subcontractor" 
                  checked={filterRecipientType === RecipientType.SUBCONTRACTOR}
                  onCheckedChange={() => setFilterRecipientType(RecipientType.SUBCONTRACTOR)}
                />
                <Label htmlFor="filter-subcontractor">Subcontractor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-supervisor" 
                  checked={filterRecipientType === RecipientType.SUPERVISOR}
                  onCheckedChange={() => setFilterRecipientType(RecipientType.SUPERVISOR)}
                />
                <Label htmlFor="filter-supervisor">Supervisor</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Purpose</h5>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-all-purposes" 
                  checked={filterPurpose === 'all'}
                  onCheckedChange={() => setFilterPurpose('all')}
                />
                <Label htmlFor="filter-all-purposes">All Purposes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-advance" 
                  checked={filterPurpose === AdvancePurpose.ADVANCE}
                  onCheckedChange={() => setFilterPurpose(AdvancePurpose.ADVANCE)}
                />
                <Label htmlFor="filter-advance">Advance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-safety-shoes" 
                  checked={filterPurpose === AdvancePurpose.SAFETY_SHOES}
                  onCheckedChange={() => setFilterPurpose(AdvancePurpose.SAFETY_SHOES)}
                />
                <Label htmlFor="filter-safety-shoes">Safety Shoes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-tools" 
                  checked={filterPurpose === AdvancePurpose.TOOLS}
                  onCheckedChange={() => setFilterPurpose(AdvancePurpose.TOOLS)}
                />
                <Label htmlFor="filter-tools">Tools</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-other" 
                  checked={filterPurpose === AdvancePurpose.OTHER}
                  onCheckedChange={() => setFilterPurpose(AdvancePurpose.OTHER)}
                />
                <Label htmlFor="filter-other">Other</Label>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdvanceFilter;
