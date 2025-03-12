
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://judyphcrcqmggkndcxlj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZHlwaGNyY3FtZ2drbmRjeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NTc4NjAsImV4cCI6MjA1NzMzMzg2MH0.hpT3pzWGDWz_5tCtV0M-AoPabAwJcS796KA4Zp8H6dE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
