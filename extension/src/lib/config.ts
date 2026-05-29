export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  dashboardUrl: import.meta.env.VITE_DASHBOARD_URL as string,
};
