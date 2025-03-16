
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import PageTitle from '../components/common/PageTitle';
import { Eye, Plus, Edit, Trash, ArrowLeft } from 'lucide-react';
import SitesList from '../components/sites/SitesList';
import SiteDetailTransactions from '../components/sites/SiteDetailTransactions';

const AdminDashboard = () => {
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [viewingSites, setViewingSites] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const { data: supervisors, isLoading: supervisorsLoading } = useQuery({
    queryKey: ['supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'supervisor');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: supervisorSites, isLoading: sitesLoading, refetch: refetchSites } = useQuery({
    queryKey: ['supervisor-sites', selectedSupervisor?.id],
    queryFn: async () => {
      if (!selectedSupervisor) return [];
      
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('supervisor_id', selectedSupervisor.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSupervisor,
  });

  const handleViewSites = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setViewingSites(true);
    setSelectedSite(null);
  };

  const handleBackToSupervisors = () => {
    setViewingSites(false);
    setSelectedSupervisor(null);
    setSelectedSite(null);
  };

  const handleBackToSites = () => {
    setSelectedSite(null);
  };

  const handleViewSite = (site) => {
    setSelectedSite(site);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {selectedSite ? (
        <div>
          <div className="mb-8 flex items-center">
            <Button 
              variant="outline" 
              onClick={handleBackToSites}
              className="mr-4 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Sites
            </Button>
            <PageTitle 
              title={`Site: ${selectedSite.name}`} 
              subtitle={`Location: ${selectedSite.location}`} 
            />
          </div>
          <SiteDetailTransactions site={selectedSite} />
        </div>
      ) : viewingSites ? (
        <div>
          <div className="mb-8 flex items-center">
            <Button 
              variant="outline" 
              onClick={handleBackToSupervisors}
              className="mr-4 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Supervisors
            </Button>
            <PageTitle 
              title={`Supervisor: ${selectedSupervisor?.name || 'Unknown'}`} 
              subtitle="View and manage all sites under this supervisor" 
            />
          </div>
          
          {sitesLoading ? (
            <div className="text-center py-10">Loading sites...</div>
          ) : (
            <SitesList 
              sites={supervisorSites} 
              onSiteSelected={handleViewSite}
              showDetailButton={true}
              refetchSites={refetchSites}
            />
          )}
        </div>
      ) : (
        <div>
          <PageTitle title="Supervisor Management" subtitle="Manage supervisors and their sites" />
          
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={fadeIn}
            className="mt-8 grid grid-cols-1 gap-6"
          >
            <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Supervisors</CardTitle>
              </CardHeader>
              <CardContent>
                {supervisorsLoading ? (
                  <div className="text-center py-10">Loading supervisors...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {supervisors && supervisors.length > 0 ? (
                          supervisors.map((supervisor) => (
                            <tr key={supervisor.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {supervisor.name || 'Unnamed'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {supervisor.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewSites(supervisor)}
                                  className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 mr-2"
                                >
                                  <Eye size={16} className="mr-1" /> View Sites
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                              No supervisors found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
