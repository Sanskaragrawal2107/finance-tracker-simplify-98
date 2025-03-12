
// Define the database types for our tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'supervisor';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'supervisor';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'supervisor';
          created_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          name: string;
          job_name: string;
          pos_no: string;
          start_date: string;
          completion_date: string | null;
          supervisor_id: string | null;
          created_at: string;
          is_completed: boolean;
          funds: number;
        };
        Insert: {
          id?: string;
          name: string;
          job_name: string;
          pos_no: string;
          start_date?: string;
          completion_date?: string | null;
          supervisor_id?: string | null;
          created_at?: string;
          is_completed?: boolean;
          funds?: number;
        };
        Update: {
          id?: string;
          name?: string;
          job_name?: string;
          pos_no?: string;
          start_date?: string;
          completion_date?: string | null;
          supervisor_id?: string | null;
          created_at?: string;
          is_completed?: boolean;
          funds?: number;
        };
      };
    };
  };
}
