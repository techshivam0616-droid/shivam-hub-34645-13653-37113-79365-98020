import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { CheckCircle2, X, Loader2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AdminBlueTickRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(
        collection(db, 'bluetick_requests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(reqs);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    try {
      const expiryDate = new Date();
      if (request.plan === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      // Add to verified_users
      await setDoc(doc(db, 'verified_users', request.userEmail), {
        email: request.userEmail,
        verifiedAt: new Date().toISOString(),
        verified: true,
        expiresAt: expiryDate.toISOString(),
        plan: request.plan
      });

      // Update request status
      await updateDoc(doc(db, 'bluetick_requests', request.id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      toast.success('Request approved successfully!');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
      console.error(error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'bluetick_requests', requestId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
      console.error(error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>King Badge Purchase Requests</CardTitle>
          <CardDescription>Approve or reject King Badge purchase requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={request.plan === 'yearly' ? 'default' : 'secondary'}>
                        {request.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{request.transactionId}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">User Email</p>
                <p className="text-sm">{selectedRequest.userEmail}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Plan</p>
                <Badge variant={selectedRequest.plan === 'yearly' ? 'default' : 'secondary'}>
                  {selectedRequest.plan}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono">{selectedRequest.transactionId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Submitted At</p>
                <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
