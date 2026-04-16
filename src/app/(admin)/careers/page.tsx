'use client';

import { useState, useEffect } from 'react';
import { adminQuery, adminInsert, adminUpdate, adminDelete } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  apply_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const EMPTY_FORM = {
  title: '',
  department: '',
  location: '',
  employment_type: 'Full-time',
  description: '',
  apply_url: '',
  is_active: true,
  display_order: 0,
};

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JobPosting>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const result = await adminQuery({
      table: 'job_postings',
      order: 'display_order',
      ascending: true,
    });
    if (result.data) setJobs(result.data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newJob.title.trim() || !newJob.department.trim() || !newJob.location.trim()) return;
    setSaving(true);
    const result = await adminInsert({
      table: 'job_postings',
      data: {
        ...newJob,
        title: newJob.title.trim(),
        department: newJob.department.trim(),
        location: newJob.location.trim(),
        description: newJob.description.trim() || null,
        apply_url: newJob.apply_url.trim() || null,
      },
    });
    if (!result.error) {
      fetchJobs();
      setShowAddForm(false);
      setNewJob(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    const result = await adminUpdate({
      table: 'job_postings',
      id,
      data: {
        title: editForm.title,
        department: editForm.department,
        location: editForm.location,
        employment_type: editForm.employment_type,
        description: editForm.description,
        apply_url: editForm.apply_url,
        is_active: editForm.is_active,
        display_order: editForm.display_order,
      },
    });
    if (!result.error) {
      fetchJobs();
      setEditingId(null);
      setEditForm({});
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    const result = await adminDelete('job_postings', id);
    if (!result.error) fetchJobs();
  }

  async function handleToggleActive(id: string, current: boolean) {
    const result = await adminUpdate({
      table: 'job_postings',
      id,
      data: { is_active: !current },
    });
    if (!result.error) fetchJobs();
  }

  function startEditing(job: JobPosting) {
    setEditingId(job.id);
    setEditForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description || '',
      apply_url: job.apply_url || '',
      is_active: job.is_active,
      display_order: job.display_order,
    });
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Careers</h1>
          <p className="mt-1 text-gray-500">Manage job postings shown on the public careers page</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Job Posting
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Job Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Senior Full Stack Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <input
                  type="text"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Remote, New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={newJob.employment_type}
                  onChange={(e) => setNewJob({ ...newJob, employment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Short description or bullet points"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL or Email</label>
                <input
                  type="text"
                  value={newJob.apply_url}
                  onChange={(e) => setNewJob({ ...newJob, apply_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mailto:careers@anytradesmen.com or https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={newJob.display_order}
                  onChange={(e) => setNewJob({ ...newJob, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newJob.is_active}
                    onChange={(e) => setNewJob({ ...newJob, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active (visible on careers page)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowAddForm(false); setNewJob(EMPTY_FORM); }}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving || !newJob.title.trim()}>
                {saving ? 'Saving...' : 'Add Job Posting'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Postings ({jobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No job postings yet</p>
              <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Job Posting
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {editingId === job.id ? (
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{job.title}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {editingId === job.id ? (
                          <input
                            type="text"
                            value={editForm.department || ''}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          job.department
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {editingId === job.id ? (
                          <input
                            type="text"
                            value={editForm.location || ''}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          job.location
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {editingId === job.id ? (
                          <select
                            value={editForm.employment_type || 'Full-time'}
                            onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                          </select>
                        ) : (
                          job.employment_type
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(job.id, job.is_active)}
                          className={`px-2 py-1 text-xs rounded ${
                            job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {job.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {editingId === job.id ? (
                            <>
                              <Button size="sm" onClick={() => handleUpdate(job.id)} disabled={saving}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditingId(null); setEditForm({}); }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => startEditing(job)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(job.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
          )}
        </CardContent>
      </Card>
    </>
  );
}
