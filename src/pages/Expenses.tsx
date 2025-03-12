
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExpensesPageContent from '@/components/expenses/ExpensesPageContent';
import { useSiteData } from '@/hooks/use-site-data';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Expenses: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [validSiteId, setValidSiteId] = useState<string | undefined>(undefined);
  
  // Validate the siteId parameter
  useEffect(() => {
    // Check if siteId exists and is a valid UUID format
    const isValidUUID = siteId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(siteId);
    
    if (!isValidUUID) {
      console.error('Invalid site ID format:', siteId);
      toast.error('Invalid site ID', {
        description: 'Please select a valid site from the sites page'
      });
      // Redirect back to sites page after a short delay
      const timer = setTimeout(() => {
        navigate('/supervisor/sites');
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('Valid site ID detected:', siteId);
      setValidSiteId(siteId);
    }
  }, [siteId, navigate]);
  
  // Only pass the siteId to useSiteData if it's valid
  const siteData = useSiteData(validSiteId);
  
  if (!validSiteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Invalid Site ID</h2>
          <p className="text-muted-foreground">Redirecting you to the sites page...</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/supervisor/sites')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Sites
        </Button>
      </div>
    );
  }
  
  if (siteData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (siteData.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Error Loading Site</h2>
          <p className="text-muted-foreground">{siteData.error}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/supervisor/sites')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sites
        </Button>
      </div>
    );
  }
  
  return <ExpensesPageContent siteData={siteData} />;
};

export default Expenses;
