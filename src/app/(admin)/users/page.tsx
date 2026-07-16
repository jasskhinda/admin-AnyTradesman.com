'use client';

import { useState, useEffect } from 'react';
import { adminQuery, sanitizeSearch } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  X,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'business_owner' | 'admin';
  phone: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  async function fetchUsers() {
    setLoading(true);

    const filters: Array<{ type: string; column?: string; value?: string }> = [];

    if (roleFilter !== 'all') {
      filters.push({ type: 'eq', column: 'role', value: roleFilter });
    }

    const q = sanitizeSearch(searchQuery);
    if (q) {
      filters.push({ type: 'or', value: `email.ilike.%${q}%,full_name.ilike.%${q}%` });
    }

    const result = await adminQuery({
      table: 'profiles',
      filters,
      order: 'created_at',
      ascending: false,
      from: (currentPage - 1) * ITEMS_PER_PAGE,
      to: currentPage * ITEMS_PER_PAGE - 1,
      count: true,
    });

    if (result.data) {
      setUsers(result.data);
      setTotalCount(result.count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-gray-500">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchUsers(); } }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="business_owner">Business Owners</option>
              <option value="admin">Admins</option>
            </select>
            <Button onClick={() => { setCurrentPage(1); fetchUsers(); }}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'business_owner'
                              ? 'bg-green-100 text-green-700'
                              : user.role === 'admin'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'business_owner' ? 'Business' : user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="p-2 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                >
                                  View Details
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  {selectedUser.full_name || 'Unnamed'}
                </h3>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  selectedUser.role === 'business_owner'
                    ? 'bg-green-100 text-green-700'
                    : selectedUser.role === 'admin'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedUser.role === 'business_owner' ? 'Business' : selectedUser.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedUser.phone || 'No phone provided'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Joined</label>
                <p className="mt-1 text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
