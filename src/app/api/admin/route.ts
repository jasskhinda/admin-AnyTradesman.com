import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service';

// Allowed tables the admin can query/mutate
const ALLOWED_TABLES = [
  'profiles',
  'businesses',
  'business_credentials',
  'categories',
  'subscriptions',
  'service_requests',
  'conversations',
  'messages',
  'reviews',
  'leads',
  'quotes',
  'business_categories',
  'hero_config',
  'hero_slides',
];

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

// GET: Fetch data from any allowed table
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const select = searchParams.get('select') || '*';
  const filters = searchParams.get('filters'); // JSON string of filters
  const order = searchParams.get('order');
  const ascending = searchParams.get('ascending') !== 'false';
  const rangeFrom = searchParams.get('from');
  const rangeTo = searchParams.get('to');
  const count = searchParams.get('count') === 'true';

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const supabase = createServiceClient();
  let query = supabase.from(table).select(select, count ? { count: 'exact' } : undefined);

  // Apply filters
  if (filters) {
    try {
      const parsedFilters = JSON.parse(filters) as Array<{ type: string; column?: string; value?: string }>;
      for (const filter of parsedFilters) {
        switch (filter.type) {
          case 'eq':
            query = query.eq(filter.column!, filter.value!);
            break;
          case 'neq':
            query = query.neq(filter.column!, filter.value!);
            break;
          case 'or':
            query = query.or(filter.value!);
            break;
          case 'ilike':
            query = query.ilike(filter.column!, filter.value!);
            break;
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid filters' }, { status: 400 });
    }
  }

  if (order) {
    query = query.order(order, { ascending });
  }

  if (rangeFrom && rangeTo) {
    query = query.range(parseInt(rangeFrom), parseInt(rangeTo));
  }

  const { data, error, count: totalCount } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: totalCount });
}

// PATCH: Update data in any allowed table
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { table, id, data: updateData } = body;

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST: Insert data into any allowed table
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { table, data: insertData } = body;

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE: Delete data from any allowed table
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id!);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
