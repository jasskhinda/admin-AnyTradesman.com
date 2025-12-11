'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleAddCategory() {
    if (!newCategory.name.trim()) return;

    setSaving(true);
    const supabase = createClient();

    const slug = newCategory.slug || generateSlug(newCategory.name);
    const maxOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order))
      : 0;

    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategory.name.trim(),
        slug,
        description: newCategory.description.trim() || null,
        icon: newCategory.icon.trim() || null,
        is_active: newCategory.is_active,
        sort_order: maxOrder + 1,
      });

    if (!error) {
      fetchCategories();
      setShowAddForm(false);
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        icon: '',
        is_active: true,
      });
    }
    setSaving(false);
  }

  async function handleUpdateCategory(id: string) {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('categories')
      .update({
        name: editForm.name,
        slug: editForm.slug,
        description: editForm.description,
        icon: editForm.icon,
        is_active: editForm.is_active,
      })
      .eq('id', id);

    if (!error) {
      fetchCategories();
      setEditingId(null);
      setEditForm({});
    }
    setSaving(false);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? This may affect existing businesses.')) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchCategories();
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchCategories();
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      is_active: category.is_active,
    });
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="mt-1 text-gray-500">Manage service categories displayed on the platform</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({
                    ...newCategory,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Plumbing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., plumbing"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Lucide icon name)
                </label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., wrench, zap, home"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCategory.is_active}
                    onChange={(e) => setNewCategory({ ...newCategory, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active (visible on site)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={saving || !newCategory.name.trim()}>
                {saving ? 'Saving...' : 'Add Category'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No categories found</p>
              <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Category
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 w-8"></th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Slug</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </td>
                      <td className="py-3 px-4">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{category.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editForm.slug || ''}
                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <span className="text-sm">{category.description || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(category.id, category.is_active)}
                          className={`px-2 py-1 text-xs rounded ${
                            category.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {editingId === category.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateCategory(category.id)}
                                disabled={saving}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(category)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
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
