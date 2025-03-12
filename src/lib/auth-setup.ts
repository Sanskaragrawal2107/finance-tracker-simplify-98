
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "./types";

/**
 * Creates a test admin user for development purposes
 */
export const createAdminUser = async () => {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'password',
    });
    
    if (authError) throw authError;
    
    // The auth.users trigger will automatically create a users record
    // but we need to update the role to admin
    if (authData.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: UserRole.ADMIN })
        .eq('id', authData.user.id);
      
      if (updateError) throw updateError;
      
      return { success: true, message: 'Admin user created successfully' };
    }
    
    return { success: false, message: 'Failed to create admin user' };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Creates a test supervisor user for development purposes
 */
export const createSupervisorUser = async (supervisorId: string = '1') => {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'supervisor@example.com',
      password: 'password',
    });
    
    if (authError) throw authError;
    
    // The auth.users trigger will automatically create a users record
    // but we need to update the supervisor_id
    if (authData.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: UserRole.SUPERVISOR,
          supervisor_id: supervisorId 
        })
        .eq('id', authData.user.id);
      
      if (updateError) throw updateError;
      
      return { success: true, message: 'Supervisor user created successfully' };
    }
    
    return { success: false, message: 'Failed to create supervisor user' };
  } catch (error: any) {
    console.error('Error creating supervisor user:', error);
    return { success: false, message: error.message };
  }
};
