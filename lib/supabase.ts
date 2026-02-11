
// Nota: Em um ambiente de produção real, estas seriam variáveis de ambiente.
// Aqui, deixamos estruturado para integração futura.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
