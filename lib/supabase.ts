
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Strictly check for non-placeholder credentials
const isConfigured = 
  supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  supabaseAnonKey && 
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('https://');

const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: { id: 'demo-user', email: 'evaldo@marcenapp.com.br' } }, error: null }),
    signUp: async () => ({ data: { user: null }, error: new Error("Supabase não configurado.") }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          if (table === 'users') {
            return { data: { id: 'demo-master-id', credits: 99999, plan: 'enterprise' }, error: null };
          }
          return { data: null, error: null };
        },
        order: () => ({ data: [], error: null }),
      }),
      order: () => ({ data: [], error: null }),
    }),
    upsert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
    insert: () => ({ 
      select: () => ({ 
        single: async () => ({ data: { id: 'new-id' }, error: null }) 
      }) 
    }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: 'demo/path' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/500' } }),
    }),
  },
};

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : (mockSupabase as any);
