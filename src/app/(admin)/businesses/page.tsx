'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  rating: number;
  review_count: number;
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

  useEffect(() => {
    fetchBusinesses();
  }, [currentPage, verifiedFilter]);

  async function fetchBusinesses() {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' });

    if (verifiedFilter === 'verified') {
      query = query.eq('is_verified', true);
    } else if (verifiedFilter === 'unverified') {
      query = query.eq('is_verified', false);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (!error && data) {
      setBusinesses(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  async function handleVerifyBusiness(businessId: string, verify: boolean) {
    const supabase = createClient();

    const { error } = await supabase
      .from('businesses')
      .update({ is_verified: verify })
      .eq('id', businessId);

    if (!error) {
      fetchBusinesses();
    }
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
                onKeyDown={(e) => e.key === 'Enter' && fetchBusinesses()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Businesses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
            <Button onClick={() => fetchBusinesses()}>
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
            <div className="text-center py-8 text-gray-500">
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
                            {business.rating.toFixed(1)} ({business.review_count})
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
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                >
                                  View Details
                                </button>
                                {business.is_verified ? (
                                  <button
                                    onClick={() => handleVerifyBusiness(business.id, false)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-orange-600"
                                  >
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Remove Verification
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyBusiness(business.id, true)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-green-600"
                                  >
                                    <Shield className="w-4 h-4 inline mr-2" />
                                    Verify Business
                                  </button>
                                )}
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
