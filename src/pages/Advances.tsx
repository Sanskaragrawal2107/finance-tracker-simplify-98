// Your import statements here
import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Advance, RecipientType, AdvancePurpose, ApprovalStatus } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AdvanceForm from '@/components/advances/AdvanceForm';

// Mock data adjustment to match the enum values
const mockAdvances: Advance[] = [
  {
    id: '1',
    date: new Date('2023-04-15'),
    recipientId: 'C001',
    recipientName: 'ABC Contractors',
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.MATERIAL,
    amount: 25000,
    status: ApprovalStatus.APPROVED,
    createdBy: 'Admin',
    createdAt: new Date('2023-04-15'),
    siteId: 'S001',
    siteName: 'Project Alpha'
  },
  {
    id: '2',
    date: new Date('2023-04-10'),
    recipientId: 'C002',
    recipientName: 'XYZ Builders',
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.MATERIAL,
    amount: 15000,
    status: ApprovalStatus.APPROVED,
    createdBy: 'Admin',
    createdAt: new Date('2023-04-10'),
    siteId: 'S001',
    siteName: 'Project Alpha'
  },
  {
    id: '3',
    date: new Date('2023-04-08'),
    recipientId: 'W001',
    recipientName: 'John Smith',
    recipientType: RecipientType.WORKER,
    purpose: AdvancePurpose.ADVANCE,
    amount: 5000,
    status: ApprovalStatus.APPROVED,
    createdBy: 'Admin',
    createdAt: new Date('2023-04-08'),
    siteId: 'S002',
    siteName: 'Project Beta'
  },
  {
    id: '4',
    date: new Date('2023-04-05'),
    recipientId: 'C003',
    recipientName: 'Reliable Construction',
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.TRANSPORT,
    amount: 18000,
    status: ApprovalStatus.PENDING,
    createdBy: 'Admin',
    createdAt: new Date('2023-04-05'),
    siteId: 'S001',
    siteName: 'Project Alpha'
  },
  {
    id: '5',
    date: new Date('2023-04-03'),
    recipientId: 'W002',
    recipientName: 'Michael Johnson',
    recipientType: RecipientType.WORKER,
    purpose: AdvancePurpose.ADVANCE,
    amount: 3000,
    status: ApprovalStatus.PENDING,
    createdBy: 'Admin',
    createdAt: new Date('2023-04-03'),
    siteId: 'S002',
    siteName: 'Project Beta'
  }
];

const purposeColorMap: Record<string, string> = {
  [AdvancePurpose.MATERIAL]: 'blue',
  [AdvancePurpose.ADVANCE]: 'green',
  [AdvancePurpose.TRANSPORT]: 'yellow',
  [AdvancePurpose.MISC]: 'purple',
  [AdvancePurpose.SAFETY_SHOES]: 'pink',
  [AdvancePurpose.TOOLS]: 'orange',
  [AdvancePurpose.OTHER]: 'gray'
};

const Advances: React.FC = () => {
  const [advances, setAdvances] = useState<Advance[]>(mockAdvances);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const siteId = localStorage.getItem('selectedSiteId') || '';

  const filterByType = (type: string) => {
    setSelectedType(type);
  };

  const filterByPurposeType = (purposeType: string) => {
    if (purposeType === 'all') {
      return filteredAdvances;
    }
    return filteredAdvances.filter(advance => 
      advance.purpose === purposeType
    );
  };

  const filterByApprovalStatus = (statusType: string) => {
    if (statusType === 'all') {
      return filteredAdvances;
    }
    return filteredAdvances.filter(advance => 
      advance.status === statusType
    );
  };

  const handleAddAdvance = (newAdvance: Advance) => {
    setAdvances([newAdvance, ...advances]);
  };

  const filteredAdvances = advances.filter(advance => {
    if (selectedType === 'all') {
      return true;
    }
    return advance.recipientType === selectedType;
  });

  const purposeFilteredAdvances = filterByPurposeType(selectedType);
  const statusFilteredAdvances = filterByApprovalStatus(selectedStatus);

  const getBadgeColor = (status: ApprovalStatus): string => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return "green";
      case ApprovalStatus.PENDING:
        return "yellow";
      case ApprovalStatus.REJECTED:
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div>
      <PageTitle title="Advances" subtitle="Manage worker advances and payments" />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <Select value={selectedType} onValueChange={filterByType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={RecipientType.WORKER}>Worker</SelectItem>
              <SelectItem value={RecipientType.SUBCONTRACTOR}>Subcontractor</SelectItem>
              <SelectItem value={RecipientType.SUPERVISOR}>Supervisor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={ApprovalStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ApprovalStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={ApprovalStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAdvanceFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Advance
        </Button>
      </div>

      {advances.length > 0 ? (
        <Table>
          <TableCaption>A list of all recent advances.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdvances.map((advance) => (
              <TableRow key={advance.id}>
                <TableCell>{advance.date instanceof Date ? advance.date.toLocaleDateString() : new Date(advance.date).toLocaleDateString()}</TableCell>
                <TableCell>{advance.recipientName}</TableCell>
                <TableCell>{advance.recipientType}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-x-2">
                    {advance.purpose}
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: purposeColorMap[advance.purpose] }}
                    />
                  </Badge>
                </TableCell>
                <TableCell>{advance.amount}</TableCell>
                <TableCell>
                  <Badge className={`bg-${getBadgeColor(advance.status)}-100 text-${getBadgeColor(advance.status)}-800`}>
                    {advance.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CustomCard>
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">No Advances Added Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Record your first advance payment to start tracking.
            </p>
            <Button onClick={() => setIsAdvanceFormOpen(true)} className="mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add First Advance
            </Button>
          </div>
        </CustomCard>
      )}

      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={handleAddAdvance}
        siteId={siteId}
      />
    </div>
  );
};

export default Advances;
