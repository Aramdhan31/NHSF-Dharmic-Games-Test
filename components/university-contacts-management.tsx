"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  AlertCircle,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  DollarSign
} from 'lucide-react';
import { collection, getDocs, getDoc, doc, updateDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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

interface ContactInfo {
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
}

interface TeamPayment {
  confirmed?: boolean;
  total?: number;
  paymentLinkSent?: boolean;
  paid?: boolean;
  contactPerson?: string; // Which contact manages this team
  contactEmail?: string;
  contactPhone?: string;
}

interface UniversityContact {
  id: string;
  name: string;
  zone: string;
  isCompeting?: boolean;
  status?: string;
  sports?: string[];
  teamInfo?: any; // Team A/B information
  contactPerson?: string; // Legacy single contact (for backward compatibility)
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contacts?: ContactInfo[]; // Array of multiple contacts
  contactDetails?: any;
  // Payment and confirmation fields - per team
  teamPayments?: { [sport: string]: TeamPayment };
  // Legacy university-level fields (for backward compatibility)
  confirmed?: boolean;
  total?: number;
  paymentLinkSent?: boolean;
  paid?: boolean;
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
  const [originalData, setOriginalData] = useState<ContactDetails>({}); // Store original values for undo
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || 
                  user?.email?.includes('admin') || user?.email?.includes('superadmin');

  useEffect(() => {
    // Set up real-time listener for universities (replaces loadUniversities)
    const universitiesRef = collection(db, 'universities');
    const q = query(universitiesRef, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔄 Universities data changed in contact management - AUTO-UPDATING');
      
      let universitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Log contacts array for debugging
        if (data.contacts) {
          if (Array.isArray(data.contacts)) {
            console.log(`📊 ${data.name}: Found ${data.contacts.length} contacts in Firestore:`, data.contacts);
          } else {
            console.log(`⚠️ ${data.name}: contacts is not an array:`, typeof data.contacts, data.contacts);
          }
        } else {
          console.log(`📊 ${data.name}: No contacts array in Firestore`);
        }
        return {
          id: doc.id,
          ...data,
          // Ensure contacts is always an array if it exists
          contacts: data.contacts && Array.isArray(data.contacts) ? data.contacts : (data.contacts ? [data.contacts] : undefined)
        };
      }) as UniversityContact[];
      
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
            contactRole: staticUni.contactRole || '',
            contacts: staticUni.contacts || (staticUni.contactPerson ? [{ 
              contactPerson: staticUni.contactPerson, 
              contactEmail: staticUni.contactEmail, 
              contactPhone: staticUni.contactPhone, 
              contactRole: staticUni.contactRole 
            }] : [])
          });
          existingNames.add(nameLower);
        } else {
          // Update existing university with static data if missing contact details or sports
          const existingIndex = universitiesData.findIndex(uni => 
            (uni.name || '').toLowerCase() === nameLower
          );
          if (existingIndex >= 0) {
            const existing = universitiesData[existingIndex];
            universitiesData[existingIndex] = {
              ...existing,
              // Ensure isCompeting is set if static says it should be competing
              isCompeting: existing.isCompeting || staticUni.isCompeting || false,
              status: existing.status || (staticUni.isCompeting ? 'competing' : existing.status),
              // Merge sports from static if missing or empty in Firestore
              sports: (existing.sports && existing.sports.length > 0 && existing.sports[0] !== 'TBD')
                ? existing.sports
                : (staticUni.sports || existing.sports || []),
              teamInfo: existing.teamInfo || staticUni.teamInfo || {},
              // Merge contact details from static if missing in Firestore
              contactPerson: existing.contactPerson || staticUni.contactPerson || '',
              contactEmail: existing.contactEmail || staticUni.contactEmail || '',
              contactPhone: existing.contactPhone || staticUni.contactPhone || '',
              contactRole: existing.contactRole || staticUni.contactRole || '',
              // CRITICAL: Prioritize Firestore contacts (from Excel upload) over static
              // If Firestore has contacts array, ALWAYS use those (they're from Excel upload)
              // Only use static contacts if Firestore has NO contacts array
              contacts: (existing.contacts && Array.isArray(existing.contacts) && existing.contacts.length > 0)
                ? existing.contacts  // Use Firestore contacts (from Excel) - these are the most up-to-date
                : (staticUni.contacts && Array.isArray(staticUni.contacts) && staticUni.contacts.length > 0 
                  ? staticUni.contacts 
                  : (staticUni.contactPerson || existing.contactPerson ? [{ 
                      contactPerson: existing.contactPerson || staticUni.contactPerson, 
                      contactEmail: existing.contactEmail || staticUni.contactEmail, 
                      contactPhone: existing.contactPhone || staticUni.contactPhone, 
                      contactRole: existing.contactRole || staticUni.contactRole 
                    }] : []))
            };
            
            // Debug logging for contacts merge
            if (existing.contacts && Array.isArray(existing.contacts) && existing.contacts.length > 0) {
              console.log(`✅ ${existing.name}: Using Firestore contacts (${existing.contacts.length} contacts) - NOT overwriting with static`);
            } else if (staticUni.contacts && Array.isArray(staticUni.contacts) && staticUni.contacts.length > 0) {
              console.log(`📊 ${existing.name}: Using static contacts (${staticUni.contacts.length} contacts) - Firestore has no contacts array`);
            }
          }
        }
      });
      
      // Filter to only competing universities and sort alphabetically
      const competingOnly = universitiesData
        .filter(uni => uni.isCompeting === true || uni.status === 'competing')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setUniversities(competingOnly);
      setLoading(false);
      console.log('📊 Updated competing universities (real-time, sorted alphabetically):', competingOnly.length);
      console.log('📊 Sample university with contacts:', competingOnly.find(u => u.contactPerson || u.contactEmail));
    }, (error) => {
      console.error('❌ Error in universities listener:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const loadUniversities = async () => {
    // This function is kept for manual refresh if needed, but real-time listener handles updates
    try {
      setLoading(true);
      const universitiesRef = collection(db, 'universities');
      const q = query(universitiesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      let universitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure sports array is properly included
          sports: data.sports || [],
          teamInfo: data.teamInfo || {}
        } as UniversityContact;
      });

      // Merge with static universities to include contact details and sports
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
            contactRole: staticUni.contactRole || '',
            contacts: staticUni.contacts || (staticUni.contactPerson ? [{ 
              contactPerson: staticUni.contactPerson, 
              contactEmail: staticUni.contactEmail, 
              contactPhone: staticUni.contactPhone, 
              contactRole: staticUni.contactRole 
            }] : [])
          });
          existingNames.add(nameLower);
        } else {
          // Update existing university with static data if missing contact details or sports
          const existingIndex = universitiesData.findIndex(uni => 
            (uni.name || '').toLowerCase() === nameLower
          );
          if (existingIndex >= 0) {
            const existing = universitiesData[existingIndex];
            universitiesData[existingIndex] = {
              ...existing,
              // Ensure isCompeting is set if static says it should be competing
              isCompeting: existing.isCompeting || staticUni.isCompeting || false,
              status: existing.status || (staticUni.isCompeting ? 'competing' : existing.status),
              // Merge sports from static if missing or empty in Firestore
              sports: (existing.sports && existing.sports.length > 0 && existing.sports[0] !== 'TBD')
                ? existing.sports
                : (staticUni.sports || existing.sports || []),
              teamInfo: existing.teamInfo || staticUni.teamInfo || {},
              // Merge contact details from static if missing in Firestore
              contactPerson: existing.contactPerson || staticUni.contactPerson || '',
              contactEmail: existing.contactEmail || staticUni.contactEmail || '',
              contactPhone: existing.contactPhone || staticUni.contactPhone || '',
              contactRole: existing.contactRole || staticUni.contactRole || '',
              // CRITICAL: Prioritize Firestore contacts (from Excel upload) over static
              // If Firestore has contacts array, ALWAYS use those (they're from Excel upload)
              // Only use static contacts if Firestore has NO contacts array
              contacts: (existing.contacts && Array.isArray(existing.contacts) && existing.contacts.length > 0)
                ? existing.contacts  // Use Firestore contacts (from Excel) - these are the most up-to-date
                : (staticUni.contacts && Array.isArray(staticUni.contacts) && staticUni.contacts.length > 0 
                  ? staticUni.contacts 
                  : (staticUni.contactPerson || existing.contactPerson ? [{ 
                      contactPerson: existing.contactPerson || staticUni.contactPerson, 
                      contactEmail: existing.contactEmail || staticUni.contactEmail, 
                      contactPhone: existing.contactPhone || staticUni.contactPhone, 
                      contactRole: existing.contactRole || staticUni.contactRole 
                    }] : []))
            };
            
            // Debug logging for contacts merge
            if (existing.contacts && Array.isArray(existing.contacts) && existing.contacts.length > 0) {
              console.log(`✅ ${existing.name}: Using Firestore contacts (${existing.contacts.length} contacts) - NOT overwriting with static`);
            } else if (staticUni.contacts && Array.isArray(staticUni.contacts) && staticUni.contacts.length > 0) {
              console.log(`📊 ${existing.name}: Using static contacts (${staticUni.contacts.length} contacts) - Firestore has no contacts array`);
            }
          }
        }
      });

      // Filter to only competing universities and sort alphabetically
      const competingOnly = universitiesData
        .filter(uni => uni.isCompeting === true || uni.status === 'competing')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setUniversities(competingOnly);
      console.log('📊 Loaded competing universities (sorted alphabetically):', competingOnly.length);
      console.log('📊 Universities with contact details:', competingOnly.filter(u => u.contactPerson || u.contactEmail).length);
      console.log('📊 Sample university:', competingOnly.find(u => u.contactPerson || u.contactEmail));
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
          text: `Successfully uploaded ${result.data.saved.total} university contacts (${result.data.saved.updated} updated, ${result.data.saved.created} created). Changes will appear automatically.` 
        });
        // No need to call loadUniversities() - real-time listener will update automatically
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
    const originalValues = {
      contactPerson: university.contactPerson || '',
      contactEmail: university.contactEmail || '',
      contactPhone: university.contactPhone || '',
      contactRole: university.contactRole || ''
    };
    setEditingId(university.id);
    setEditingData(originalValues);
    setOriginalData(originalValues); // Store original values for undo
  };

  const handleSave = (id: string) => {
    // Show confirmation dialog before saving
    setPendingSaveId(id);
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    if (!pendingSaveId) return;
    
    try {
      const universityRef = doc(db, 'universities', pendingSaveId);
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
        const universityRealtimeRef = ref(realtimeDb, `universities/${pendingSaveId}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }

      setMessage({ type: 'success', text: 'Contact details updated successfully! Changes will appear immediately.' });
      setEditingId(null);
      setEditingData({});
      setOriginalData({});
      setShowConfirmDialog(false);
      setPendingSaveId(null);
      // Universities will automatically update via real-time listener
    } catch (error: any) {
      console.error('❌ Error saving contact details:', error);
      setMessage({ type: 'error', text: 'Failed to save contact details' });
      setShowConfirmDialog(false);
      setPendingSaveId(null);
    }
  };

  const handleUndo = () => {
    // Revert to original values
    setEditingData({ ...originalData });
    setMessage({ type: 'success', text: 'Changes reverted to original values.' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const hasChanges = () => {
    return JSON.stringify(editingData) !== JSON.stringify(originalData);
  };

  const handleTeamCheckboxChange = async (universityId: string, sport: string, field: 'confirmed' | 'paymentLinkSent' | 'paid', value: boolean) => {
    if (!isAdmin) return;
    
    try {
      const universityRef = doc(db, 'universities', universityId);
      const universityDoc = await getDoc(universityRef);
      const currentData = universityDoc.data() || {};
      const currentTeamPayments = currentData.teamPayments || {};
      
      const updateData = {
        teamPayments: {
          ...currentTeamPayments,
          [sport]: {
            ...currentTeamPayments[sport],
            [field]: value,
            lastUpdated: new Date().toISOString()
          }
        },
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore FIRST (listeners are watching Firestore)
      await updateDoc(universityRef, updateData);
      console.log(`✅ Updated ${field} for ${sport} team at ${universityId} - changes will appear immediately`);
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }
      
      setMessage({ type: 'success', text: `${field === 'confirmed' ? 'Confirmed' : field === 'paymentLinkSent' ? 'Payment Link Sent' : 'Paid'} status updated for ${sport}!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error(`❌ Error updating ${field} for team:`, error);
      setMessage({ type: 'error', text: `Failed to update ${field} status` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTeamTotalChange = async (universityId: string, sport: string, value: number) => {
    if (!isAdmin) return;
    
    try {
      const universityRef = doc(db, 'universities', universityId);
      const universityDoc = await getDoc(universityRef);
      const currentData = universityDoc.data() || {};
      const currentTeamPayments = currentData.teamPayments || {};
      
      const updateData = {
        teamPayments: {
          ...currentTeamPayments,
          [sport]: {
            ...currentTeamPayments[sport],
            total: value,
            lastUpdated: new Date().toISOString()
          }
        },
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore FIRST (listeners are watching Firestore)
      await updateDoc(universityRef, updateData);
      console.log(`✅ Updated total for ${sport} team at ${universityId} - changes will appear immediately`);
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }
      
      setMessage({ type: 'success', text: `Total updated for ${sport}!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('❌ Error updating team total:', error);
      setMessage({ type: 'error', text: 'Failed to update total' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Legacy handlers for backward compatibility
  const handleCheckboxChange = async (universityId: string, field: 'confirmed' | 'paymentLinkSent' | 'paid', value: boolean) => {
    if (!isAdmin) return;
    
    try {
      const universityRef = doc(db, 'universities', universityId);
      const updateData = {
        [field]: value,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore FIRST (listeners are watching Firestore)
      await updateDoc(universityRef, updateData);
      console.log(`✅ Updated ${field} for university ${universityId} - changes will appear immediately`);
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }
      
      setMessage({ type: 'success', text: `${field === 'confirmed' ? 'Confirmed' : field === 'paymentLinkSent' ? 'Payment Link Sent' : 'Paid'} status updated!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error(`❌ Error updating ${field}:`, error);
      setMessage({ type: 'error', text: `Failed to update ${field} status` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTotalChange = async (universityId: string, value: number) => {
    if (!isAdmin) return;
    
    try {
      const universityRef = doc(db, 'universities', universityId);
      const updateData = {
        total: value,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore FIRST (listeners are watching Firestore)
      await updateDoc(universityRef, updateData);
      console.log(`✅ Updated total for university ${universityId} - changes will appear immediately`);
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`);
        await update(universityRealtimeRef, updateData);
        console.log('✅ Updated Realtime Database');
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError);
      }
      
      setMessage({ type: 'success', text: 'Total updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('❌ Error updating total:', error);
      setMessage({ type: 'error', text: 'Failed to update total' });
      setTimeout(() => setMessage(null), 3000);
    }
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

  // All filtered universities are competing - sort alphabetically by name
  const competingUniversities = filteredUniversities.sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );
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
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to the contact details? This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setPendingSaveId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

      {/* Competing Universities Only - Auto-updates when universities are added */}
      {competingUniversities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Competing Universities ({competingUniversities.length})</span>
              <Badge variant="outline" className="ml-2 text-xs">
                Auto-updates
              </Badge>
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
                  originalData={originalData}
                  onEdit={() => handleEdit(uni)}
                  onSave={() => handleSave(uni.id)}
                  onCancel={handleCancel}
                  onUndo={handleUndo}
                  onEditChange={(data) => setEditingData(data)}
                  onView={() => setViewingId(viewingId === uni.id ? null : uni.id)}
                  isViewing={viewingId === uni.id}
                  hasChanges={hasChanges()}
                  onCheckboxChange={handleCheckboxChange}
                  onTotalChange={handleTotalChange}
                  onTeamCheckboxChange={handleTeamCheckboxChange}
                  onTeamTotalChange={handleTeamTotalChange}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {competingUniversities.length === 0 && !loading && (
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
  originalData: ContactDetails;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUndo: () => void;
  onEditChange: (data: ContactDetails) => void;
  onView: () => void;
  isViewing: boolean;
  hasChanges: boolean;
  onCheckboxChange: (universityId: string, field: 'confirmed' | 'paymentLinkSent' | 'paid', value: boolean) => void;
  onTotalChange: (universityId: string, value: number) => void;
  onTeamCheckboxChange: (universityId: string, sport: string, field: 'confirmed' | 'paymentLinkSent' | 'paid', value: boolean) => void;
  onTeamTotalChange: (universityId: string, sport: string, value: number) => void;
}

function UniversityContactCard({
  university,
  isAdmin,
  isEditing,
  editingData,
  onEdit,
  onSave,
  onCancel,
  onUndo,
  originalData,
  onEditChange,
  onView,
  isViewing,
  onTeamCheckboxChange,
  onTeamTotalChange
}: UniversityContactCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold">{university.name}</h3>
                <Badge variant={university.isCompeting ? 'default' : 'secondary'}>
                  {university.zone}
                </Badge>
                {university.isCompeting && (
                  <Badge className="bg-green-500">Competing</Badge>
                )}
              </div>
              {university.sports && university.sports.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Sports:</span>
                  <div className="flex flex-wrap gap-1">
                    {university.sports.map((sport, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                  </div>
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
                {/* Display multiple contacts if available, otherwise fall back to single contact */}
                {(() => {
                  // Debug logging
                  console.log(`📊 ${university.name}: contacts array:`, university.contacts);
                  console.log(`📊 ${university.name}: contacts is array:`, Array.isArray(university.contacts));
                  console.log(`📊 ${university.name}: contacts length:`, university.contacts?.length);
                  
                  const contactsList = university.contacts && Array.isArray(university.contacts) && university.contacts.length > 0 
                    ? university.contacts 
                    : (university.contactPerson || university.contactEmail || university.contactPhone 
                      ? [{ 
                          contactPerson: university.contactPerson, 
                          contactEmail: university.contactEmail, 
                          contactPhone: university.contactPhone, 
                          contactRole: university.contactRole 
                        }] 
                      : []);
                  
                  console.log(`📊 ${university.name}: Final contactsList length:`, contactsList.length);
                  
                  if (contactsList.length === 0) {
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-500 flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>No contact details available. {isAdmin && 'Click Edit to add contact information.'}</span>
                        </p>
                      </div>
                    );
                  }
                  
                  return contactsList.map((contact, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      {contactsList.length > 1 && (
                        <div className="text-xs font-medium text-blue-700 mb-2">
                          Contact {index + 1} {contactsList.length > 1 ? `of ${contactsList.length}` : ''}
                        </div>
                      )}
                      {contact.contactPerson && (
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.contactPerson}</span>
                            {contact.contactRole && (
                              <span className="text-gray-500 text-xs">({contact.contactRole})</span>
                            )}
                          </div>
                        </div>
                      )}
                      {contact.contactEmail && (
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${contact.contactEmail}`} className="text-blue-600 hover:underline">
                            {contact.contactEmail}
                          </a>
                        </div>
                      )}
                      {contact.contactPhone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <a href={`tel:${contact.contactPhone}`} className="text-blue-600 hover:underline">
                            {contact.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  ));
                })()}

                {/* Payment and Confirmation Checkboxes - Per Team - Always visible for admins */}
                {isAdmin && university.sports && university.sports.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment & Confirmation (Per Team)</h4>
                    {(() => {
                      const contactsList = university.contacts && Array.isArray(university.contacts) && university.contacts.length > 0 
                        ? university.contacts 
                        : (university.contactPerson || university.contactEmail || university.contactPhone 
                          ? [{ 
                              contactPerson: university.contactPerson, 
                              contactEmail: university.contactEmail, 
                              contactPhone: university.contactPhone, 
                              contactRole: university.contactRole 
                            }] 
                          : []);
                      
                      // For Imperial and other universities with multiple contacts, split by contact
                      const hasMultipleContacts = contactsList.length > 1;
                      
                      if (hasMultipleContacts && university.name === 'Imperial') {
                        // Split Imperial by contact - determine which contact manages which team
                        const contactTeamMap: { [contactEmail: string]: string[] } = {};
                        const allTeams = [...(university.sports || [])];
                        const assignedTeams = new Set<string>();
                        
                        contactsList.forEach(contact => {
                          const email = contact.contactEmail || '';
                          if (!contactTeamMap[email]) {
                            contactTeamMap[email] = [];
                          }
                          // Assign teams based on contact role
                          if (contact.contactRole?.toLowerCase().includes('football')) {
                            contactTeamMap[email].push('Football');
                            assignedTeams.add('Football');
                          }
                        });
                        
                        // Assign all remaining teams to the first contact that doesn't have Football
                        const remainingTeams = allTeams.filter(sport => !assignedTeams.has(sport));
                        const firstNonFootballContact = contactsList.find(contact => 
                          !contact.contactRole?.toLowerCase().includes('football')
                        );
                        if (firstNonFootballContact && remainingTeams.length > 0) {
                          const email = firstNonFootballContact.contactEmail || '';
                          if (!contactTeamMap[email]) {
                            contactTeamMap[email] = [];
                          }
                          contactTeamMap[email].push(...remainingTeams);
                        }
                        
                        // Display payment fields grouped by contact
                        return contactsList.map((contact, contactIndex) => {
                          const managedTeams = contactTeamMap[contact.contactEmail || ''] || [];
                          if (managedTeams.length === 0) return null;
                          
                          return (
                            <div key={contactIndex} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="mb-3 pb-2 border-b border-gray-300">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold text-sm text-gray-700">
                                    {contact.contactPerson} ({contact.contactRole})
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Managing: {managedTeams.join(', ')}
                                </div>
                              </div>
                              {managedTeams.map((sport) => {
                                const teamPayment = university.teamPayments?.[sport] || {};
                                return (
                                  <div key={sport} className="mb-4 p-3 bg-white rounded border border-gray-200">
                                    <div className="font-medium text-sm text-gray-700 mb-3">{sport}</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`confirmed-${university.id}-${sport}`}
                                          checked={teamPayment.confirmed || false}
                                          onCheckedChange={(checked) => {
                                            onTeamCheckboxChange(university.id, sport, 'confirmed', checked === true);
                                          }}
                                        />
                                        <Label htmlFor={`confirmed-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                          Confirmed?
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`paymentLinkSent-${university.id}-${sport}`}
                                          checked={teamPayment.paymentLinkSent || false}
                                          onCheckedChange={(checked) => {
                                            onTeamCheckboxChange(university.id, sport, 'paymentLinkSent', checked === true);
                                          }}
                                        />
                                        <Label htmlFor={`paymentLinkSent-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                          Payment Link Sent?
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`paid-${university.id}-${sport}`}
                                          checked={teamPayment.paid || false}
                                          onCheckedChange={(checked) => {
                                            onTeamCheckboxChange(university.id, sport, 'paid', checked === true);
                                          }}
                                        />
                                        <Label htmlFor={`paid-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                          Paid?
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                        <Input
                                          type="number"
                                          placeholder="Total"
                                          value={teamPayment.total || ''}
                                          onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                            onTeamTotalChange(university.id, sport, value);
                                          }}
                                          className="w-24 h-8 text-sm"
                                        />
                                        <Label className="text-sm">Total</Label>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      } else {
                        // For universities with single contact or no special splitting needed
                        return university.sports.map((sport) => {
                          const teamPayment = university.teamPayments?.[sport] || {};
                          return (
                            <div key={sport} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                              <div className="font-medium text-sm text-gray-700 mb-3">{sport}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`confirmed-${university.id}-${sport}`}
                                    checked={teamPayment.confirmed || false}
                                    onCheckedChange={(checked) => {
                                      onTeamCheckboxChange(university.id, sport, 'confirmed', checked === true);
                                    }}
                                  />
                                  <Label htmlFor={`confirmed-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                    Confirmed?
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`paymentLinkSent-${university.id}-${sport}`}
                                    checked={teamPayment.paymentLinkSent || false}
                                    onCheckedChange={(checked) => {
                                      onTeamCheckboxChange(university.id, sport, 'paymentLinkSent', checked === true);
                                    }}
                                  />
                                  <Label htmlFor={`paymentLinkSent-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                    Payment Link Sent?
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`paid-${university.id}-${sport}`}
                                    checked={teamPayment.paid || false}
                                    onCheckedChange={(checked) => {
                                      onTeamCheckboxChange(university.id, sport, 'paid', checked === true);
                                    }}
                                  />
                                  <Label htmlFor={`paid-${university.id}-${sport}`} className="cursor-pointer text-sm">
                                    Paid?
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    placeholder="Total"
                                    value={teamPayment.total || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      onTeamTotalChange(university.id, sport, value);
                                    }}
                                    className="w-24 h-8 text-sm"
                                  />
                                  <Label className="text-sm">Total</Label>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      }
                    })()}
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

