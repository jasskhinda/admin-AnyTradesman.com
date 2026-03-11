'use client';

import { useState, useEffect } from 'react';
import { adminQuery, adminUpdate } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  Eye,
  X,
  Mail,
  Phone,
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  address: string | null;
  city: string;
  state: string;
  zip_code: string;
  preferred_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'open' | 'matched' | 'in_progress' | 'completed' | 'canceled';
  created_at: string;
}

interface CustomerProfile {
  full_name: string | null;
  email: string;
  phone: string | null;
}

const ITEMS_PER_PAGE = 10;

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  matched: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  matched: 'Matched',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  async function fetchRequests() {
    setLoading(true);

    const filters: Array<{ type: string; column?: string; value?: string }> = [];

    if (statusFilter !== 'all') {
      filters.push({ type: 'eq', column: 'status', value: statusFilter });
    }

    if (searchQuery) {
      filters.push({ type: 'or', value: `title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%` });
    }

    const result = await adminQuery({
      table: 'service_requests',
      filters,
      order: 'created_at',
      ascending: false,
      from: (currentPage - 1) * ITEMS_PER_PAGE,
      to: currentPage * ITEMS_PER_PAGE - 1,
      count: true,
    });

    if (result.data) {
      setRequests(result.data);
      setTotalCount(result.count || 0);
    }
    setLoading(false);
  }

  async function handleUpdateStatus(requestId: string, newStatus: string) {
    setUpdatingStatus(true);
    const result = await adminUpdate({
      table: 'service_requests',
      id: requestId,
      data: { status: newStatus },
    });

    if (!result.error) {
      fetchRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as ServiceRequest['status'] });
      }
    }
    setUpdatingStatus(false);
  }

  async function handleViewRequest(req: ServiceRequest) {
    setSelectedRequest(req);
    setCustomerProfile(null);
    setLoadingCustomer(true);

    const result = await adminQuery({
      table: 'profiles',
      select: 'full_name,email,phone',
      filters: [{ type: 'eq', column: 'id', value: req.customer_id }],
    });

    if (result.data && result.data.length > 0) {
      setCustomerProfile(result.data[0]);
    }
    setLoadingCustomer(false);
  }

  function formatBudget(min: number | null, max: number | null): string {
    if (!min && !max) return '-';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max!.toLocaleString()}`;
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <p className="mt-1 text-gray-500">View and manage all customer service requests</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, city, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchRequests(); } }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="matched">Matched</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
            <Button onClick={() => { setCurrentPage(1); fetchRequests(); }}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Requests ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-700">
              No service requests found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Budget</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[250px]">{req.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[250px]">{req.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {req.city}, {req.state} {req.zip_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatBudget(req.budget_min, req.budget_max)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[req.status] || req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRequest(req)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
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
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} requests
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

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedRequest.title}</h3>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${STATUS_STYLES[selectedRequest.status]}`}>
                  {STATUS_LABELS[selectedRequest.status]}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedRequest.address && `${selectedRequest.address}, `}
                    {selectedRequest.city}, {selectedRequest.state} {selectedRequest.zip_code}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    {formatBudget(selectedRequest.budget_min, selectedRequest.budget_max)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.preferred_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preferred Date</label>
                    <p className="mt-1 text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(selectedRequest.preferred_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                {loadingCustomer ? (
                  <div className="mt-1 flex items-center gap-2 text-gray-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading...
                  </div>
                ) : customerProfile ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {customerProfile.full_name || 'Unnamed'}
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {customerProfile.email}
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {customerProfile.phone || 'No phone provided'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500 text-sm">Customer not found</p>
                )}
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {['open', 'matched', 'in_progress', 'completed', 'canceled'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedRequest.status === status ? 'primary' : 'outline'}
                      size="sm"
                      disabled={selectedRequest.status === status || updatingStatus}
                      onClick={() => handleUpdateStatus(selectedRequest.id, status)}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
