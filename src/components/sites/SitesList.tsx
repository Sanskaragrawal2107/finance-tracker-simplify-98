
import React from 'react';
import { format } from 'date-fns';
import { Building, CalendarCheck, Calendar, ArrowRight } from 'lucide-react';
import { Site } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';

interface SitesListProps {
  sites: Site[];
  onSelectSite: (siteId: string) => void;
}

const SitesList: React.FC<SitesListProps> = ({ sites, onSelectSite }) => {
  const activeSites = sites.filter(site => !site.isCompleted);
  const completedSites = sites.filter(site => site.isCompleted);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Sites ({activeSites.length})</h3>
        {activeSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSites.map((site) => (
              <CustomCard 
                key={site.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onSelectSite(site.id)}
              >
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
                    <span>Started: {format(new Date(site.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  {site.completionDate && (
                    <div className="flex items-center text-sm mb-2">
                      <CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Expected Completion: {format(new Date(site.completionDate), 'MMM dd, yyyy')}</span>
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
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No active sites found.</p>
          </div>
        )}
      </div>
      
      {completedSites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Sites ({completedSites.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSites.map((site) => (
              <CustomCard 
                key={site.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors bg-green-50/30"
                onClick={() => onSelectSite(site.id)}
              >
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
                    <span>Started: {format(new Date(site.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  {site.completionDate && (
                    <div className="flex items-center text-sm mb-2">
                      <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-600">Completed: {format(new Date(site.completionDate), 'MMM dd, yyyy')}</span>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesList;
