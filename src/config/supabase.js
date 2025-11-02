// Supabase configuration
export const SUPABASE_URL = 'https://gixbazstflmpsjksstjc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeGJhenN0ZmxtcHNqa3NzdGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjU4MjUsImV4cCI6MjA3NzY0MTgyNX0.8_Myous150z7YQCUNbsTsHMcA82u7pu2m7cYDrW0Ty8';

// Supabase REST API headers
export const getSupabaseHeaders = (token = null) => {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

