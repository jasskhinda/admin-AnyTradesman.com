'use client';

import { useState, useEffect, useRef } from 'react';
import { adminQuery, adminInsert, adminUpdate, adminDelete, adminUpload, adminDeleteFile } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Video,
  Layers,
  Save,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface HeroConfig {
  id: string;
  display_mode: 'slider' | 'video';
  video_url: string | null;
  autoplay_interval: number;
}

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function HomepagePage() {
  const [config, setConfig] = useState<HeroConfig | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; subtitle: string; sort_order: number }>({ title: '', subtitle: '', sort_order: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state for config
  const [displayMode, setDisplayMode] = useState<'slider' | 'video'>('slider');
  const [videoUrl, setVideoUrl] = useState('');
  const [autoplayInterval, setAutoplayInterval] = useState(5);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [configResult, slidesResult] = await Promise.all([
      adminQuery({ table: 'hero_config' }),
      adminQuery({ table: 'hero_slides', order: 'sort_order', ascending: true }),
    ]);

    if (configResult.data?.[0]) {
      const c = configResult.data[0] as HeroConfig;
      setConfig(c);
      setDisplayMode(c.display_mode);
      setVideoUrl(c.video_url || '');
      setAutoplayInterval(c.autoplay_interval / 1000);
    }
    if (slidesResult.data) {
      setSlides(slidesResult.data);
    }
    setLoading(false);
  }

  async function handleSaveConfig() {
    if (!config) return;
    setSavingConfig(true);
    await adminUpdate({
      table: 'hero_config',
      id: config.id,
      data: {
        display_mode: displayMode,
        video_url: videoUrl || null,
        autoplay_interval: autoplayInterval * 1000,
      },
    });
    setConfig({ ...config, display_mode: displayMode, video_url: videoUrl || null, autoplay_interval: autoplayInterval * 1000 });
    setSavingConfig(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadResult = await adminUpload(file);

    if (uploadResult.error) {
      alert('Upload failed: ' + uploadResult.error);
      setUploading(false);
      return;
    }

    // Insert slide record
    const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;
    await adminInsert({
      table: 'hero_slides',
      data: {
        image_url: uploadResult.url,
        sort_order: nextOrder,
        is_active: true,
      },
    });

    await fetchData();
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDeleteSlide(slide: HeroSlide) {
    if (!confirm('Delete this slide?')) return;

    // Extract filename from URL for storage deletion
    const urlParts = slide.image_url.split('/');
    const filename = urlParts[urlParts.length - 1];
    if (filename) {
      await adminDeleteFile(filename);
    }

    await adminDelete('hero_slides', slide.id);
    await fetchData();
  }

  async function handleToggleSlide(slide: HeroSlide) {
    await adminUpdate({
      table: 'hero_slides',
      id: slide.id,
      data: { is_active: !slide.is_active },
    });
    await fetchData();
  }

  function startEditing(slide: HeroSlide) {
    setEditingSlide(slide.id);
    setEditForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      sort_order: slide.sort_order,
    });
  }

  async function handleSaveSlide(slideId: string) {
    await adminUpdate({
      table: 'hero_slides',
      id: slideId,
      data: {
        title: editForm.title || null,
        subtitle: editForm.subtitle || null,
        sort_order: editForm.sort_order,
      },
    });
    setEditingSlide(null);
    await fetchData();
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading homepage settings...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
        <p className="mt-1 text-gray-500">Manage the hero section of the homepage</p>
      </div>

      {/* Display Mode Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Hero Display Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Display Mode</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setDisplayMode('slider')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    displayMode === 'slider'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Image Slider</div>
                    <div className="text-xs opacity-75">Rotate through multiple images</div>
                  </div>
                </button>
                <button
                  onClick={() => setDisplayMode('video')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    displayMode === 'video'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Video Background</div>
                    <div className="text-xs opacity-75">YouTube or Vimeo video</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Video URL (shown when video mode) */}
            {displayMode === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Paste a YouTube or Vimeo video URL</p>
              </div>
            )}

            {/* Autoplay Interval (shown when slider mode) */}
            {displayMode === 'slider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slide Duration (seconds)</label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={autoplayInterval}
                  onChange={(e) => setAutoplayInterval(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Time each slide is displayed before transitioning</p>
              </div>
            )}

            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              <Save className="w-4 h-4 mr-1" />
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slides Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Slides ({slides.length})
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {slides.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No slides yet. Upload an image to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    slide.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-48 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={slide.image_url}
                      alt={slide.title || 'Slide'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {editingSlide === slide.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title (optional)"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <input
                          type="text"
                          value={editForm.subtitle}
                          onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                          placeholder="Subtitle (optional)"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Order:</label>
                          <input
                            type="number"
                            value={editForm.sort_order}
                            onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveSlide(slide.id)}>
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSlide(null)}>
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900">{slide.title || 'No title'}</p>
                        <p className="text-sm text-gray-500">{slide.subtitle || 'No subtitle'}</p>
                        <p className="text-xs text-gray-400 mt-1">Order: {slide.sort_order}</p>
                        <button
                          onClick={() => startEditing(slide)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Edit details
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSlide(slide)}
                      title={slide.is_active ? 'Hide slide' : 'Show slide'}
                    >
                      {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSlide(slide)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
