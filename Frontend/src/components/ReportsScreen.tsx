import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FolderOpen, 
  FileText, 
  Image as ImageIcon, 
  Download,
  Eye,
  Calendar,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { apiCreateRecord, apiListRecords } from '../api/client';

interface ReportsScreenProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function ReportsScreen({ user, onNavigate, onLogout }: ReportsScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListRecords();
        setRecords(res.data || []);
      } catch {
        setRecords([]);
      }
    })();
  }, []);

  const refresh = async () => {
    const res = await apiListRecords();
    setRecords(res.data || []);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('patientName', user?.name || 'Unknown');
      form.append('surgeryType', 'General');
      form.append('recordProgress', 'report');
      form.append('followUpDate', new Date().toISOString());
      form.append('notes', `Uploaded: ${selectedFile.name}`);
      form.append('fileUpload', selectedFile);
      await apiCreateRecord(form);
      setSelectedFile(null);
      setShowUpload(false);
      await refresh();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filtered = (records || [])
  // ✅ Only include image logs
  .filter((r) => r?.file?.filePath?.match(/\.(png|jpe?g|webp)$/i))
  // ✅ Apply search filter
  .filter((r) => {
    const name = r.patientName || '';
    const st = r.surgeryType || '';
    const note = r.notes || '';
    return [name, st, note].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getFileIcon = (r: any) => {
    const isImage = r?.file?.filePath?.match(/\.(png|jpe?g|webp)$/i);
    return isImage ? ImageIcon : FileText;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('patient-dashboard')}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl">Medical Reports</h1>
                <p className="text-sm text-gray-600">{filtered.length} files available</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowUpload(!showUpload)}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        {showUpload && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-primary" />
                <span>Upload New Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, JPG, PNG up to 50MB
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl cursor-pointer transition-colors"
                  >
                    Choose Files
                  </Label>
                </div>
              </div>
              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button onClick={handleUpload} className="rounded-xl" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((rec) => {
            const FileIcon = getFileIcon(rec);
            const filePath = rec?.file?.filePath ? `${API_BASE}/${rec.file.filePath.replace(/^\//, '')}` : '';
            const name = rec?.file?.originalName || `${rec.patientName} - ${rec.surgeryType}`;
            const size = rec?.file ? '' : '';
            const uploaded = rec?.file?.uploadDate ? new Date(rec.file.uploadDate).toISOString().slice(0, 10) : '';
            const type = rec?.file?.filePath?.match(/\.(png|jpe?g|webp)$/i) ? 'image' : 'pdf';
            const status = 'reviewed';

            return (
              <Card key={rec._id} className="rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg line-clamp-2">{name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{uploaded}</span>
                        </div>
                        {size && <span>{size}</span>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {rec.patientName} • {rec.surgeryType}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      {filePath && (
                        <>
                          <a href={filePath} target="_blank" rel="noreferrer" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full rounded-xl">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </a>
                          <a href={filePath} download className="flex-1">
                            <Button variant="outline" size="sm" className="w-full rounded-xl">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg text-gray-600 mb-2">No reports found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload your first medical report to get started'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <Button onClick={() => setShowUpload(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Report
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="reports" 
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}