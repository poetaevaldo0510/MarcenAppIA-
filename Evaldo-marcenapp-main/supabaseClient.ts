
import { createClient } from '@supabase/supabase-js';

// Tenta obter das variáveis de ambiente injetadas pelo bundler ou plataforma
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

/**
 * Mock Client resiliente para evitar o erro 'supabaseUrl is required'
 * caso as chaves não estejam configuradas no Dashboard da Vercel.
 */
const mockSupabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  }
};

const isValidConfig = supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey;

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (mockSupabase as any);

if (!isValidConfig) {
  console.warn("MarcenaPP: Supabase em modo Offline. Configure as chaves para persistência em nuvem.");
}
