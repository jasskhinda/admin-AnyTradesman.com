// Client-side helper for admin data operations.
// Routes all queries through /api/admin which uses the service role key
// to bypass RLS restrictions.

interface QueryOptions {
  table: string;
  select?: string;
  filters?: Array<{ type: string; column?: string; value?: string }>;
  order?: string;
  ascending?: boolean;
  from?: number;
  to?: number;
  count?: boolean;
}

interface MutateOptions {
  table: string;
  id?: string;
  data: Record<string, unknown>;
}

export async function adminQuery(options: QueryOptions) {
  const params = new URLSearchParams();
  params.set('table', options.table);
  if (options.select) params.set('select', options.select);
  if (options.filters) params.set('filters', JSON.stringify(options.filters));
  if (options.order) params.set('order', options.order);
  if (options.ascending === false) params.set('ascending', 'false');
  if (options.from !== undefined) params.set('from', String(options.from));
  if (options.to !== undefined) params.set('to', String(options.to));
  if (options.count) params.set('count', 'true');

  const res = await fetch(`/api/admin?${params.toString()}`);
  return res.json();
}

export async function adminUpdate(options: MutateOptions) {
  const res = await fetch('/api/admin', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return res.json();
}

export async function adminInsert(options: Omit<MutateOptions, 'id'>) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return res.json();
}

export async function adminDelete(table: string, id: string) {
  const params = new URLSearchParams({ table, id });
  const res = await fetch(`/api/admin?${params.toString()}`, {
    method: 'DELETE',
  });
  return res.json();
}
