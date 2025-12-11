'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Calendar,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface Credential {
  id: string;
  business_id: string;
  credential_type: string;
  credential_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    email: string | null;
  };
}

const ITEMS_PER_PAGE = 10;

export default function VerificationsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, [currentPage, statusFilter]);

  async function fetchCredentials() {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('business_credentials')
      .select(`
        *,
        business:businesses(id, name, email)
      `, { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('verification_status', statusFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (!error && data) {
      setCredentials(data as Credential[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  async function handleVerification(credentialId: string, status: 'verified' | 'rejected') {
    setProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('business_credentials')
      .update({
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
      })
      .eq('id', credentialId);

    if (!error) {
      if (status === 'verified') {
        const credential = credentials.find(c => c.id === credentialId);
        if (credential?.business_id) {
          await supabase
            .from('businesses')
            .update({ is_verified: true })
            .eq('id', credential.business_id);
        }
      }
      fetchCredentials();
      setSelectedCredential(null);
    }
    setProcessing(false);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="mt-1 text-gray-500">Review and verify business credentials</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Credentials ({totalCount})
            {statusFilter === 'pending' && totalCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                {totalCount} awaiting review
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading credentials...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No credentials found</p>
              {statusFilter === 'pending' && (
                <p className="text-sm mt-1">All caught up! No pending verifications.</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Business</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Credential Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Number</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Expiry</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map((credential) => (
                      <tr key={credential.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {credential.business?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {credential.business?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize">{credential.credential_type.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {credential.credential_number || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {credential.expiry_date ? (
                            <span className={`flex items-center gap-1 ${
                              new Date(credential.expiry_date) < new Date() ? 'text-red-600' : ''
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(credential.expiry_date).toLocaleDateString()}
                              {new Date(credential.expiry_date) < new Date() && (
                                <AlertCircle className="w-3 h-3 text-red-600" />
                              )}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded w-fit ${getStatusColor(credential.verification_status)}`}>
                            {getStatusIcon(credential.verification_status)}
                            {credential.verification_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(credential.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCredential(credential)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {credential.verification_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleVerification(credential.id, 'verified')}
                                  disabled={processing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerification(credential.id, 'rejected')}
                                  disabled={processing}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
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
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
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

      {/* Credential Detail Modal */}
      {selectedCredential && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Credential Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business</p>
                  <p className="font-medium">{selectedCredential.business?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">
                    {selectedCredential.credential_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credential Number</p>
                  <p className="font-medium">{selectedCredential.credential_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issuing Authority</p>
                  <p className="font-medium">{selectedCredential.issuing_authority || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium">
                    {selectedCredential.issue_date
                      ? new Date(selectedCredential.issue_date).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className={`font-medium ${
                    selectedCredential.expiry_date && new Date(selectedCredential.expiry_date) < new Date()
                      ? 'text-red-600' : ''
                  }`}>
                    {selectedCredential.expiry_date
                      ? new Date(selectedCredential.expiry_date).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>

              {selectedCredential.document_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Document</p>
                  <a
                    href={selectedCredential.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    View/Download Document
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <span className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${getStatusColor(selectedCredential.verification_status)}`}>
                  {getStatusIcon(selectedCredential.verification_status)}
                  {selectedCredential.verification_status}
                </span>
                {selectedCredential.verified_at && (
                  <span className="text-sm text-gray-500">
                    on {new Date(selectedCredential.verified_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {selectedCredential.verification_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleVerification(selectedCredential.id, 'rejected')}
                      disabled={processing}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleVerification(selectedCredential.id, 'verified')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedCredential(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
