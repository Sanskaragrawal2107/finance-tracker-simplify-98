
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Site, UserRole } from '@/lib/types';

const SUPABASE_URL = "https://jourdleqqgzkwdaylrcc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdXJkbGVxcWd6a3dkYXlscmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MDM0NzUsImV4cCI6MjA1NzE3OTQ3NX0.7s1WzoYy-t72agRmpoA_CP_MOykOZkhUFQ5jNqWEs0o";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper function to assign a role to a user
export const assignRoleToUser = async (userId: string, role: 'admin' | 'supervisor' | 'viewer') => {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });
  
  if (error) {
    console.error('Error assigning role:', error);
    return false;
  }
  
  return true;
};

// Get the primary role for the current user
export const getCurrentUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Use the get_primary_role function we created in the database
  const { data, error } = await supabase.rpc('get_primary_role', {
    _user_id: user.id
  });
  
  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }
  
  return data;
};

// Get all sites from the database
export const getAllSites = async () => {
  const { data, error } = await supabase
    .from('sites')
    .select('*');

  if (error) {
    console.error('Error fetching sites:', error);
    return [];
  }

  return data;
};

// Get sites for a specific supervisor
export const getSitesBySupervisor = async (supervisorId: string) => {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('supervisor_id', supervisorId);

  if (error) {
    console.error('Error fetching supervisor sites:', error);
    return [];
  }

  return data;
};

// Create a new site
export const createSite = async (site: Partial<Site>) => {
  const { data, error } = await supabase
    .from('sites')
    .insert([
      {
        name: site.name,
        job_name: site.jobName,
        pos_no: site.posNo,
        start_date: site.startDate,
        completion_date: site.completionDate,
        supervisor_id: site.supervisorId,
        is_completed: site.isCompleted || false
      }
    ])
    .select();

  if (error) {
    console.error('Error creating site:', error);
    return null;
  }

  return data[0];
};

// Get a site by ID
export const getSiteById = async (siteId: string) => {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (error) {
    console.error('Error fetching site:', error);
    return null;
  }

  return data;
};

// Update a site
export const updateSite = async (siteId: string, updates: Partial<Site>) => {
  const { data, error } = await supabase
    .from('sites')
    .update({
      name: updates.name,
      job_name: updates.jobName,
      pos_no: updates.posNo,
      start_date: updates.startDate,
      completion_date: updates.completionDate,
      is_completed: updates.isCompleted,
      funds: updates.funds
    })
    .eq('id', siteId)
    .select();

  if (error) {
    console.error('Error updating site:', error);
    return null;
  }

  return data[0];
};

// Get expenses for a site
export const getSiteExpenses = async (siteId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('site_id', siteId);

  if (error) {
    console.error('Error fetching site expenses:', error);
    return [];
  }

  return data;
};

// Add funds to a site
export const addFundsToSite = async (siteId: string, amount: number, date: Date, reference?: string, method?: string) => {
  const { data, error } = await supabase
    .from('funds_received')
    .insert([
      {
        site_id: siteId,
        amount,
        date,
        reference,
        method
      }
    ])
    .select();

  if (error) {
    console.error('Error adding funds:', error);
    return null;
  }

  return data[0];
};

// Get funds received for a site
export const getSiteFunds = async (siteId: string) => {
  const { data, error } = await supabase
    .from('funds_received')
    .select('*')
    .eq('site_id', siteId);

  if (error) {
    console.error('Error fetching site funds:', error);
    return [];
  }

  return data;
};
