import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service';

// Credential documents live in a PRIVATE bucket. Admins view them through a
// short-lived signed URL minted here, so the files are never publicly readable.

const BUCKET = 'business-credentials';
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  // Legacy rows may hold a full URL rather than a storage path
  if (/^https?:\/\//i.test(path)) {
    return NextResponse.json({ url: path });
  }

  const service = createServiceClient();
  const { data, error } = await service.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error('[admin/document] Signed URL failed:', error?.message);
    return NextResponse.json({ error: 'Could not open document' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
