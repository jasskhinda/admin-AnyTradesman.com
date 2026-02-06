'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminQuery, adminUpdate } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Search,
  MoreVertical,
  Ban,
  CheckCircle,
  Clock,
  Star,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  rating_average: number | null;
  rating_count: number | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, [currentPage, verifiedFilter]);

  async function fetchBusinesses() {
    setLoading(true);

    const filters: Array<{ type: string; column?: string; value?: string }> = [];

    if (verifiedFilter === 'verified') {
      filters.push({ type: 'eq', column: 'is_verified', value: 'true' });
    } else if (verifiedFilter === 'unverified') {
      filters.push({ type: 'eq', column: 'is_verified', value: 'false' });
    }

    if (searchQuery) {
      filters.push({ type: 'or', value: `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%` });
    }

    const result = await adminQuery({
      table: 'businesses',
      filters,
      order: 'created_at',
      ascending: false,
      from: (currentPage - 1) * ITEMS_PER_PAGE,
      to: currentPage * ITEMS_PER_PAGE - 1,
      count: true,
    });

    if (result.data) {
      setBusinesses(result.data);
      setTotalCount(result.count || 0);
    }
    setLoading(false);
  }

  async function handleVerifyBusiness(businessId: string, verify: boolean) {
    setProcessing(businessId);
    const result = await adminUpdate({
      table: 'businesses',
      id: businessId,
      data: { is_verified: verify },
    });

    if (!result.error) {
      fetchBusinesses();
    }
    setProcessing(null);
    setActionMenuOpen(null);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
        <p className="mt-1 text-gray-500">View and manage all registered businesses</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchBusinesses(); } }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">All Businesses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
            <Button onClick={() => { setCurrentPage(1); fetchBusinesses(); }}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Businesses ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading businesses...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8 text-gray-700">
              No businesses found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Business</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Rating</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{business.name}</p>
                            <p className="text-sm text-gray-500">{business.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {business.city && business.state
                              ? `${business.city}, ${business.state}`
                              : 'Not specified'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {(business.rating_average ?? 0).toFixed(1)} ({business.rating_count ?? 0})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {business.is_verified ? (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700 w-fit">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 w-fit">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(business.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {business.is_verified ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyBusiness(business.id, false)}
                                disabled={processing === business.id}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleVerifyBusiness(business.id, true)}
                                disabled={processing === business.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => setActionMenuOpen(actionMenuOpen === business.id ? null : business.id)}
                                className="p-2 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {actionMenuOpen === business.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                                  <button
                                    onClick={() => router.push(`/businesses/${business.id}`)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-900"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => alert('Suspend functionality - requires backend')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
                                  >
                                    <Ban className="w-4 h-4 inline mr-2" />
                                    Suspend Business
                                  </button>
                                </div>
                              )}
                            </div>
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
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} businesses
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
    </>
  );
}
