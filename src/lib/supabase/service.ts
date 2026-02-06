import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service role key.
// This bypasses Row Level Security (RLS) - use only in API routes
// that have already verified the caller is an admin.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
