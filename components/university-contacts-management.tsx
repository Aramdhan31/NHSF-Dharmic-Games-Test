"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Search, 
  Edit, 
  Save, 
  X, 
  Eye,
  Building2,
  Mail,
  Phone,
  User,
  Briefcase,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, update } from 'firebase/database';
import { db, realtimeDb } from '@/lib/firebase';
import { useFirebase } from '@/lib/firebase-context';
import { universities as staticUniversities } from '@/app/teams/page';

interface ContactDetails {
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contactDetails?: any;
  [key: string]: any;
}

interface UniversityContact {
  id: string;
  name: string;
  zone: string;
  isCompeting?: boolean;
  status?: string;
  sports?: string[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contactDetails?: any;
}

interface UniversityContactsManagementProps {
  currentUser?: any;
}

export function UniversityContactsManagement({ currentUser }: UniversityContactsManagementProps) {
  const { user } = useFirebase();
  const [universities, setUniversities] = useState<UniversityContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<ContactDetails>({});
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || 
                  user?.email?.includes('admin') || user?.email?.includes('superadmin');

  useEffect(() => {
    loadUniversities();
    
    // Set up real-time listener for universities
    const universitiesRef = collection(db, 'universities');
    const q = query(universitiesRef, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const universitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UniversityContact[];
      
      // Merge with static universities to include contact details
      const staticCompetingUnis = staticUniversities.filter(uni => uni.isCompeting === true);
      const existingNames = new Set(universitiesData.map(uni => (uni.name || '').toLowerCase()));
      
      staticCompetingUnis.forEach(staticUni => {
        const nameLower = staticUni.name.toLowerCase();
        if (!existingNames.has(nameLower)) {
          // Add static university to the list
          universitiesData.push({
            id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: staticUni.name,
            zone: staticUni.zone,
            isCompeting: true,
            status: 'competing',
            sports: staticUni.sports || [],
            contactPerson: staticUni.contactPerson || '',
            contactEmail: staticUni.contactEmail || '',
            contactPhone: staticUni.contactPhone || '',
            contactRole: staticUni.contactRole || ''
          });
          existingNames.add(nameLower);
        } else {
          // Update existing university with static data if missing contact details
          const existingIndex = universitiesData.findIndex(uni => 
            (uni.name || '').toLowerCase() === nameLower
          );
          if (existingIndex >= 0) {
            const existing = universitiesData[existingIndex];
            universitiesData[existingIndex] = {
              ...existing,
              // Merge contact details from static if missing in Firestore
              contactPerson: existing.contactPerson || staticUni.contactPerson || '',
              contactEmail: existing.contactEmail || staticUni.contactEmail || '',
              contactPhone: existing.contactPhone || staticUni.contactPhone || '',
              contactRole: existing.contactRole || staticUni.contactRole || ''
            };
          }
        }
      });
      
      setUniversities(universitiesData);
      console.log('📊 Updated universities (real-time):', universitiesData.length);
      console.log('📊 Sample university with contacts:', universitiesData.find(u => u.contactPerson || u.contactEmail));
    }, (error) => {
      console.error('❌ Error in universities listener:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const universitiesRef = collection(db, 'universities');
      const q = query(universitiesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      let universitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UniversityContact[];

      // Merge with static universities to include contact details
      const staticCompetingUnis = staticUniversities.filter(uni => uni.isCompeting === true);
      const existingNames = new Set(universitiesData.map(uni => (uni.name || '').toLowerCase()));
      
      staticCompetingUnis.forEach(staticUni => {
        const nameLower = staticUni.name.toLowerCase();
        if (!existingNames.has(nameLower)) {
          // Add static university to the list
          universitiesData.push({
            id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: staticUni.name,
            zone: staticUni.zone,
            isCompeting: true,
            status: 'competing',
            sports: staticUni.sports || [],
            contactPerson: staticUni.contactPerson || '',
            contactEmail: staticUni.contactEmail || '',
            contactPhone: staticUni.contactPhone || '',
            contactRole: staticUni.contactRole || ''
          });
          existingNames.add(nameLower);
        } else {
          // Update existing university with static data if missing contact details
          const existingIndex = universitiesData.findIndex(uni => 
            (uni.name || '').toLowerCase() === nameLower
          );
          if (existingIndex >= 0) {
            const existing = universitiesData[existingIndex];
            universitiesData[existingIndex] = {
              ...existing,
              // Merge contact details from static if missing in Firestore
              contactPerson: existing.contactPerson || staticUni.contactPerson || '',
              contactEmail: existing.contactEmail || staticUni.contactEmail || '',
              contactPhone: existing.contactPhone || staticUni.contactPhone || '',
              contactRole: existing.contactRole || staticUni.contactRole || ''
            };
          }
        }
      });

      setUniversities(universitiesData);
      console.log('📊 Loaded universities:', universitiesData.length);
      console.log('📊 Universities with contact details:', universitiesData.filter(u => u.contactPerson || u.contactEmail).length);
      console.log('📊 Sample university:', universitiesData.find(u => u.contactPerson || u.contactEmail));
    } catch (error: any) {
      console.error('❌ Error loading universities:', error);
      setMessage({ type: 'error', text: 'Failed to load universities' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: 'Please upload an Excel file (.xlsx or .xls)' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-university-contacts', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully uploaded ${result.data.saved.total} university contacts (${result.data.saved.updated} updated, ${result.data.saved.created} created)` 
        });
        await loadUniversities();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload file' });
      }
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload file' });
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleEdit = (university: UniversityContact) => {
    if (!isAdmin) return;
    setEditingId(university.id);
    setEditingData({
      contactPerson: university.contactPerson || '',
      contactEmail: university.contactEmail || '',
      contactPhone: university.contactPhone || '',
      contactRole: university.contactRole || ''
    });
  };

  const handleSave = async (id: string) => {
    try {
      const universityRef = doc(db, 'universities', id);
      const updateData = {
        ...editingData,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore FIRST (listeners are watching Firestore)
      await updateDoc(universityRef, updateData);
      console.log('✅ Updated Firestore - changes will appear immediately');
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${id}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }

      setMessage({ type: 'success', text: 'Contact details updated successfully! Changes will appear immediately.' });
      setEditingId(null);
      setEditingData({});
      // Universities will automatically update via real-time listener
    } catch (error: any) {
      console.error('❌ Error saving contact details:', error);
      setMessage({ type: 'error', text: 'Failed to save contact details' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Only show competing universities in contact management
  const filteredUniversities = universities.filter(uni => {
    const isCompeting = uni.isCompeting === true || uni.status === 'competing';
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'all' || uni.zone === selectedZone;
    return isCompeting && matchesSearch && matchesZone;
  });

  // All filtered universities are competing (no need to group)
  const competingUniversities = filteredUniversities;
  const nonCompetingUniversities: UniversityContact[] = []; // Empty - only show competing

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>University Contacts Management</span>
            </span>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild variant="outline" className="cursor-pointer">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Excel
                    </span>
                  </Button>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by university name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Zones</option>
              <option value="NZ+CZ">NZ+CZ</option>
              <option value="LZ+SZ">LZ+SZ</option>
            </select>
          </div>

          {uploading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
              <span>Uploading and processing Excel file...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competing Universities */}
      {competingUniversities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Competing Universities ({competingUniversities.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competingUniversities.map((uni) => (
                <UniversityContactCard
                  key={uni.id}
                  university={uni}
                  isAdmin={isAdmin}
                  isEditing={editingId === uni.id}
                  editingData={editingData}
                  onEdit={() => handleEdit(uni)}
                  onSave={() => handleSave(uni.id)}
                  onCancel={handleCancel}
                  onEditChange={(data) => setEditingData(data)}
                  onView={() => setViewingId(viewingId === uni.id ? null : uni.id)}
                  isViewing={viewingId === uni.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Competing Universities */}
      {nonCompetingUniversities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              <span>Other Universities ({nonCompetingUniversities.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nonCompetingUniversities.map((uni) => (
                <UniversityContactCard
                  key={uni.id}
                  university={uni}
                  isAdmin={isAdmin}
                  isEditing={editingId === uni.id}
                  editingData={editingData}
                  onEdit={() => handleEdit(uni)}
                  onSave={() => handleSave(uni.id)}
                  onCancel={handleCancel}
                  onEditChange={(data) => setEditingData(data)}
                  onView={() => setViewingId(viewingId === uni.id ? null : uni.id)}
                  isViewing={viewingId === uni.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredUniversities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No universities found matching your search criteria.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface UniversityContactCardProps {
  university: UniversityContact;
  isAdmin: boolean;
  isEditing: boolean;
  editingData: ContactDetails;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditChange: (data: ContactDetails) => void;
  onView: () => void;
  isViewing: boolean;
}

function UniversityContactCard({
  university,
  isAdmin,
  isEditing,
  editingData,
  onEdit,
  onSave,
  onCancel,
  onEditChange,
  onView,
  isViewing
}: UniversityContactCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg font-semibold">{university.name}</h3>
              <Badge variant={university.isCompeting ? 'default' : 'secondary'}>
                {university.zone}
              </Badge>
              {university.isCompeting && (
                <Badge className="bg-green-500">Competing</Badge>
              )}
              {university.sports && university.sports.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {university.sports.map((sport, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {sport}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={editingData.contactPerson || ''}
                    onChange={(e) => onEditChange({ ...editingData, contactPerson: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={editingData.contactEmail || ''}
                    onChange={(e) => onEditChange({ ...editingData, contactEmail: e.target.value })}
                    placeholder="contact@university.ac.uk"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    type="tel"
                    value={editingData.contactPhone || ''}
                    onChange={(e) => onEditChange({ ...editingData, contactPhone: e.target.value })}
                    placeholder="+44 7123 456789"
                  />
                </div>
                <div>
                  <Label>Contact Role</Label>
                  <Input
                    value={editingData.contactRole || ''}
                    onChange={(e) => onEditChange({ ...editingData, contactRole: e.target.value })}
                    placeholder="e.g., President, Secretary"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={onSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={onCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(university.contactPerson || university.contactEmail || university.contactPhone) ? (
                  <>
                    {university.contactPerson && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{university.contactPerson}</span>
                          {university.contactRole && (
                            <span className="text-gray-500 text-xs">({university.contactRole})</span>
                          )}
                        </div>
                      </div>
                    )}
                    {university.contactEmail && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${university.contactEmail}`} className="text-blue-600 hover:underline">
                          {university.contactEmail}
                        </a>
                      </div>
                    )}
                    {university.contactPhone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${university.contactPhone}`} className="text-blue-600 hover:underline">
                          {university.contactPhone}
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-500 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>No contact details available. {isAdmin && 'Click Edit to add contact information.'}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isAdmin && !isEditing && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button onClick={onView} variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded View */}
        {isViewing && university.contactDetails && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Additional Details</h4>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
              {JSON.stringify(university.contactDetails, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

