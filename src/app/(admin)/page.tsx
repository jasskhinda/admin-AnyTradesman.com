import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Building2,
  FileCheck,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Clock,
  LayoutGrid,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  pendingVerifications: number;
  activeSubscriptions: number;
  newUsersToday: number;
  newBusinessesToday: number;
}

async function getStats(): Promise<Stats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalBusinesses },
    { count: pendingVerifications },
    { count: activeSubscriptions },
    { count: newUsersToday },
    { count: newBusinessesToday },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('business_credentials').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalBusinesses: totalBusinesses || 0,
    pendingVerifications: pendingVerifications || 0,
    activeSubscriptions: activeSubscriptions || 0,
    newUsersToday: newUsersToday || 0,
    newBusinessesToday: newBusinessesToday || 0,
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const stats = await getStats();

  // Get recent activity
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('id, name, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Overview of platform activity and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">+{stats.newUsersToday} today</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Businesses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                <p className="text-sm text-green-600 mt-1">+{stats.newBusinessesToday} today</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                {stats.pendingVerifications > 0 && (
                  <p className="text-sm text-orange-600 mt-1">Needs attention</p>
                )}
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Link href="/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-gray-500">View, edit, suspend</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/businesses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <Building2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium">Manage Businesses</p>
                <p className="text-sm text-gray-500">Review, verify</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/verifications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <FileCheck className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium">Verifications</p>
                <p className="text-sm text-gray-500">{stats.pendingVerifications} pending</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/categories">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <LayoutGrid className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium">Categories</p>
                <p className="text-sm text-gray-500">Manage services</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </div>
              <Link href="/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.role === 'business_owner'
                          ? 'bg-green-100 text-green-700'
                          : user.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No users yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Businesses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Businesses</CardTitle>
                <CardDescription>Latest business registrations</CardDescription>
              </div>
              <Link href="/businesses" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBusinesses && recentBusinesses.length > 0 ? (
              <div className="space-y-4">
                {recentBusinesses.map((business) => (
                  <div key={business.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{business.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(business.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {business.is_verified ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No businesses yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
