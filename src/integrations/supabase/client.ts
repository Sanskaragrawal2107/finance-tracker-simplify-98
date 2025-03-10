
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejwfqmacjzheawhxvhfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2ZxbWFjanpoZWF3aHh2aGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODc3MzIsImV4cCI6MjA1NzE2MzczMn0.7_cQFZGS6Zfhu0hJnzP96ZYLcKIm2jr1jEs4gH7Vgfs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = any;
