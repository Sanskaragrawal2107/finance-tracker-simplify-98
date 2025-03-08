
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Building, CalendarCheck, Calendar, ArrowRight } from 'lucide-react';
import { Site } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPERVISORS, CONTRACTORS } from '@/lib/constants';

interface SitesListProps {
  sites: Site[];
  onSelectSite: (siteId: string) => void;
}

const SitesList: React.FC<SitesListProps> = ({ sites, onSelectSite }) => {
  const [filterType, setFilterType] = useState<'supervisor' | 'contractor' | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');

  const activeSites = sites.filter(site => !site.isCompleted);
  const completedSites = sites.filter(site => site.isCompleted);

  // Apply filtering
  const filteredActiveSites = filterType && filterValue 
    ? activeSites.filter(site => {
        if (filterType === 'supervisor') {
          return site.supervisorId === filterValue;
        } else if (filterType === 'contractor') {
          return site.contractorId === filterValue;
        }
        return true;
      })
    : activeSites;

  const filteredCompletedSites = filterType && filterValue 
    ? completedSites.filter(site => {
        if (filterType === 'supervisor') {
          return site.supervisorId === filterValue;
        } else if (filterType === 'contractor') {
          return site.contractorId === filterValue;
        }
        return true;
      })
    : completedSites;

  const handleCardClick = (siteId: string) => {
    onSelectSite(siteId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-1/3">
          <Select 
            onValueChange={(value: 'supervisor' | 'contractor' | '') => {
              setFilterType(value ? value as 'supervisor' | 'contractor' : null);
              setFilterValue('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="">No filter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterType && (
          <div className="w-full sm:w-2/3">
            <Select 
              onValueChange={(value) => setFilterValue(value)}
              value={filterValue}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${filterType}...`} />
              </SelectTrigger>
              <SelectContent searchable>
                {filterType === 'supervisor' ? (
                  SUPERVISORS.map((supervisor, index) => (
                    <SelectItem key={index} value={supervisor}>
                      {supervisor}
                    </SelectItem>
                  ))
                ) : (
                  CONTRACTORS.map((contractor, index) => (
                    <SelectItem key={index} value={contractor}>
                      {contractor}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Active Sites ({filteredActiveSites.length})</h3>
        {filteredActiveSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActiveSites.map((site) => (
              <div 
                key={site.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleCardClick(site.id)}
              >
                <CustomCard>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg truncate">{site.name}</h4>
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground truncate">{site.jobName}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm mb-2">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Started: {format(site.startDate, 'MMM dd, yyyy')}</span>
                    </div>
                    {site.completionDate && (
                      <div className="flex items-center text-sm mb-2">
                        <CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Expected Completion: {format(site.completionDate, 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite(site.id);
                      }}
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CustomCard>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No active sites found.</p>
          </div>
        )}
      </div>
      
      {filteredCompletedSites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Sites ({filteredCompletedSites.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompletedSites.map((site) => (
              <div 
                key={site.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleCardClick(site.id)}
              >
                <CustomCard className="bg-green-50/30">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg truncate">{site.name}</h4>
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground truncate">{site.jobName}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm mb-2">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Started: {format(site.startDate, 'MMM dd, yyyy')}</span>
                    </div>
                    {site.completionDate && (
                      <div className="flex items-center text-sm mb-2">
                        <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-green-600">Completed: {format(site.completionDate, 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite(site.id);
                      }}
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CustomCard>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesList;
