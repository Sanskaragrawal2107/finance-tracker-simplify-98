
import { supabase } from '@/integrations/supabase/client';

export const supervisors = [
  { id: "1", name: "Mithlesh Singh" },
  { id: "2", name: "Shubham Urmaliya" },
  { id: "3", name: "Yogesh Sharma" },
  { id: "4", name: "Vivek Giri Goswami" },
  { id: "5", name: "M.P. Naidu" },
  { id: "6", name: "Dinesh Nath" },
  { id: "7", name: "Jaspal Singh" },
  { id: "8", name: "Sanjay Shukla" },
  { id: "9", name: "Kundan Kumar" },
  { id: "10", name: "Mahendra Pandey" },
  { id: "11", name: "Mithlesh Paul" }
];

// Function to fetch supervisors from the database
export const getSupervisors = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'supervisor') as any;
    
    if (error) {
      console.error('Error fetching supervisors:', error);
      return supervisors; // Return local data as fallback
    }
    
    if (data && data.length > 0) {
      // Convert to the expected format
      return data.map(supervisor => ({
        id: supervisor.id,
        name: supervisor.name
      }));
    }
    
    return supervisors; // Return local data as fallback if no data returned
  } catch (error) {
    console.error('Error in getSupervisors:', error);
    return supervisors; // Return local data as fallback
  }
};
