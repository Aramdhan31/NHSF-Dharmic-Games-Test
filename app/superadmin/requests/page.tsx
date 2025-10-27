"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  User, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Users,
  AlertCircle
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase-context';
import { useRouter } from 'next/navigation';

interface AdminRequest {
  id: string;
  name: string;
  email: string;
  university: string;
  zone: string;
  role: string;
  reason: string;
  experience?: string;
  availability?: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  createdAt: number;
  lastUpdated: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getRoleBadge = (role: string) => {
  const roleColors = {
    'zone-admin': 'bg-blue-100 text-blue-800',
    'tournament-admin': 'bg-purple-100 text-purple-800',
    'match-admin': 'bg-green-100 text-green-800',
    'general-admin': 'bg-orange-100 text-orange-800'
  };
  
  return (
    <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
      {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
};

export default function SuperAdminRequestsPage() {
  const { user, loading } = useFirebase();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const createTestData = async () => {
    try {
      setProcessing('test-data');
      console.log('🔄 Creating test admin request...');
      
      const testRequest = {
        name: 'Test Admin User',
        email: 'test@example.com',
        university: 'Test University',
        zone: 'LZ+SZ',
        role: 'zone-admin',
        reason: 'Testing admin request functionality',
        experience: '5 years in event management',
        availability: 'Weekends and evenings',
        userId: 'test-user-123',
        userEmail: 'test@example.com',
        requestedAt: new Date().toISOString()
      };

      const response = await fetch('/api/admin-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({type: 'success', text: 'Test admin request created successfully!'});
        // Reload requests to show the new one
        await loadRequests();
      } else {
        setMessage({type: 'error', text: `Failed to create test data: ${result.error}`});
      }
    } catch (error: any) {
      console.error('❌ Error creating test data:', error);
      setMessage({type: 'error', text: `Failed to create test data: ${error.message}`});
    } finally {
      setProcessing(null);
    }
  };

  // Check if user is superadmin
  useEffect(() => {
    if (!loading && user) {
      // Allow access for any authenticated user
      // This removes the email restriction and allows role-based access
      console.log('✅ Superadmin access check for:', user.email);
      
      // For now, allow all authenticated users to access superadmin dashboard
      // This is a temporary fix to allow Preetham and other users access
      // TODO: In production, implement proper role checking from Firebase
      console.log('✅ Superadmin access granted:', user.email);
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      setMessage(null); // Clear any previous messages
      
      console.log('🔄 Loading admin requests...');
      const response = await fetch('/api/admin-requests');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success) {
        setRequests(result.requests || []);
        console.log('✅ Admin requests loaded:', result.requests?.length || 0);
        
        // If no requests, show helpful message
        if (!result.requests || result.requests.length === 0) {
          console.log('ℹ️ No admin requests found in database');
        }
      } else {
        console.error('❌ API returned error:', result.error);
        setMessage({type: 'error', text: `Failed to load requests: ${result.error}`});
      }
    } catch (error: any) {
      console.error('❌ Error loading requests:', error);
      setMessage({type: 'error', text: `Failed to load requests: ${error.message}`});
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessing(requestId);
      setMessage(null);

      const response = await fetch('/api/admin-requests/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          reviewedBy: user?.email,
          reviewNotes: notes,
          reviewedAt: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
        });
        await loadRequests();
        setSelectedRequest(null);
      } else {
        setMessage({
          type: 'error',
          text: result.error || `Failed to ${action} request`
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Failed to ${action} request: ${error.message}`
      });
    } finally {
      setProcessing(null);
    }
  };


  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <Button 
              onClick={createTestData}
              disabled={processing === 'test-data'}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {processing === 'test-data' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>Create Test Data</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-gray-600">Manage admin access requests and user permissions</p>
        </div>

        {/* Message Display */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Pending ({pendingRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Approved ({approvedRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Rejected ({rejectedRequests.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending admin requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onView={() => setSelectedRequest(request)}
                    onApprove={() => handleRequestAction(request.id, 'approve')}
                    onReject={() => handleRequestAction(request.id, 'reject')}
                    processing={processing === request.id}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="space-y-4">
              {approvedRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No approved admin requests</p>
                  </CardContent>
                </Card>
              ) : (
                approvedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onView={() => setSelectedRequest(request)}
                    showActions={false}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="space-y-4">
              {rejectedRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No rejected admin requests</p>
                  </CardContent>
                </Card>
              ) : (
                rejectedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onView={() => setSelectedRequest(request)}
                    showActions={false}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={() => handleRequestAction(selectedRequest.id, 'approve')}
            onReject={() => handleRequestAction(selectedRequest.id, 'reject')}
            processing={processing === selectedRequest.id}
          />
        )}
      </div>
    </div>
  );
}

// Request Card Component
function RequestCard({ 
  request, 
  onView, 
  onApprove, 
  onReject, 
  processing, 
  showActions = true 
}: {
  request: AdminRequest;
  onView: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  processing?: boolean;
  showActions?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold">{request.name}</h3>
              {getStatusBadge(request.status)}
              {getRoleBadge(request.role)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{request.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{request.university}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{request.zone}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-2">{request.reason}</p>
            </div>
            
            <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Requested {new Date(request.requestedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {showActions && request.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  onClick={onApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={onReject}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Request Detail Modal Component
function RequestDetailModal({ 
  request, 
  onClose, 
  onApprove, 
  onReject, 
  processing 
}: {
  request: AdminRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  processing?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>Admin Request Details</span>
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {request.name}</div>
                <div><strong>Email:</strong> {request.email}</div>
                <div><strong>University:</strong> {request.university}</div>
                <div><strong>Zone:</strong> {request.zone}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Request Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Role:</strong> {getRoleBadge(request.role)}</div>
                <div><strong>Status:</strong> {getStatusBadge(request.status)}</div>
                <div><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}</div>
                {request.reviewedAt && (
                  <div><strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Reason */}
          <div>
            <h3 className="font-semibold mb-3">Reason for Admin Access</h3>
            <p className="text-sm bg-gray-50 p-4 rounded-lg">{request.reason}</p>
          </div>
          
          {/* Experience */}
          {request.experience && (
            <div>
              <h3 className="font-semibold mb-3">Relevant Experience</h3>
              <p className="text-sm bg-gray-50 p-4 rounded-lg">{request.experience}</p>
            </div>
          )}
          
          {/* Availability */}
          {request.availability && (
            <div>
              <h3 className="font-semibold mb-3">Availability</h3>
              <p className="text-sm bg-gray-50 p-4 rounded-lg">{request.availability}</p>
            </div>
          )}
          
          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button 
                variant="destructive"
                onClick={onReject}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
              <Button 
                onClick={onApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}