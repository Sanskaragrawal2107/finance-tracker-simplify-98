
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://ejwfqmacjzheawhxvhfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2ZxbWFjanpoZWF3aHh2aGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODc3MzIsImV4cCI6MjA1NzE2MzczMn0.7_cQFZGS6Zfhu0hJnzP96ZYLcKIm2jr1jEs4gH7Vgfs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to format date objects for Supabase
export const formatDateForSupabase = (date: Date): string => {
  return date.toISOString();
};

// Wait function to help with rate limiting
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create predefined users with guaranteed access
export const createPredefinedUsers = async () => {
  try {
    console.log("Creating predefined users...");
    
    // First create admin user
    const adminEmail = "finance.admin@example.com";
    const adminPassword = "Admin@12345";
    
    // Check if admin exists by trying to sign in
    const { error: adminSignInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    // If admin doesn't exist, create it
    if (adminSignInError) {
      console.log("Admin user doesn't exist, creating...");
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: "Finance Admin",
            role: "admin",
          }
        }
      });
      
      if (adminError) {
        console.error("Error creating admin user:", adminError.message);
      } else {
        console.log("Admin user created successfully");
      }
      
      // Wait to avoid rate limiting
      await wait(2000);
    } else {
      console.log("Admin user already exists");
    }
    
    // Then create supervisor user
    const supervisorEmail = "site.supervisor@example.com";
    const supervisorPassword = "Super@12345";
    
    // Check if supervisor exists by trying to sign in
    const { error: supervisorSignInError } = await supabase.auth.signInWithPassword({
      email: supervisorEmail,
      password: supervisorPassword
    });
    
    // If supervisor doesn't exist, create it
    if (supervisorSignInError) {
      console.log("Supervisor user doesn't exist, creating...");
      const { data: supervisorData, error: supervisorError } = await supabase.auth.signUp({
        email: supervisorEmail,
        password: supervisorPassword,
        options: {
          data: {
            full_name: "Site Supervisor",
            role: "supervisor",
          }
        }
      });
      
      if (supervisorError) {
        console.error("Error creating supervisor user:", supervisorError.message);
      } else {
        console.log("Supervisor user created successfully");
        
        // Wait for auth trigger to create profile
        await wait(2000);
        
        // If user was created successfully, create supervisor record
        if (supervisorData?.user) {
          const { error: supervisorRecordError } = await supabase
            .from('supervisors')
            .insert({
              name: "Site Supervisor",
              email: supervisorEmail,
              user_id: supervisorData.user.id
            });
          
          if (supervisorRecordError) {
            console.error("Error creating supervisor record:", supervisorRecordError.message);
          } else {
            console.log("Supervisor record created successfully");
          }
        }
      }
    } else {
      console.log("Supervisor user already exists");
    }
    
    return {
      adminEmail,
      adminPassword,
      supervisorEmail,
      supervisorPassword
    };
  } catch (error) {
    console.error("Error creating predefined users:", error);
    return null;
  }
};
