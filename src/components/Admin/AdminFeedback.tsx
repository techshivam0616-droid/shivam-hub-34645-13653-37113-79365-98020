import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Star, MessageSquare, Trash2, BarChart3, TrendingUp, Users } from 'lucide-react';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  feedback: string;
  createdAt: number;
  page: string;
}

export function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Feedback[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : Date.now()
      })) as Feedback[];
      setFeedbacks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteFeedback = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'feedback', id));
      toast.success('Feedback deleted');
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const clearAllFeedback = async () => {
    if (!confirm('Are you sure you want to delete all feedback?')) return;
    try {
      const snapshot = await getDocs(collection(db, 'feedback'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      toast.success('All feedback cleared');
    } catch (error) {
      toast.error('Failed to clear feedback');
    }
  };

  // Calculate stats
  const totalFeedback = feedbacks.length;
  const averageRating = totalFeedback > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
    : '0';
  const uniqueUsers = new Set(feedbacks.map(f => f.userEmail)).size;
  const positiveRatings = feedbacks.filter(f => f.rating >= 4).length;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 5) return { label: 'Excellent', variant: 'default' as const };
    if (rating === 4) return { label: 'Good', variant: 'secondary' as const };
    if (rating === 3) return { label: 'Average', variant: 'outline' as const };
    if (rating === 2) return { label: 'Poor', variant: 'destructive' as const };
    return { label: 'Bad', variant: 'destructive' as const };
  };

  const emojis = ['😢', '😕', '😐', '😊', '😍'];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalFeedback}</p>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{averageRating}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {totalFeedback > 0 ? Math.round((positiveRatings / totalFeedback) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Positive (4-5 stars)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = feedbacks.filter(f => f.rating === rating).length;
              const percentage = totalFeedback > 0 ? (count / totalFeedback) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    <span className="text-xl">{emojis[rating - 1]}</span>
                    <span className="text-sm font-medium">{rating} star</span>
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        rating >= 4 ? 'bg-green-500' : rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Management</CardTitle>
          <CardDescription>View and manage user feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={clearAllFeedback}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No feedback yet</TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((fb) => {
                    const badge = getRatingBadge(fb.rating);
                    return (
                      <TableRow key={fb.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fb.userName}</p>
                            <p className="text-xs text-muted-foreground">{fb.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{emojis[fb.rating - 1]}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= fb.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {fb.feedback || <span className="text-muted-foreground italic">No comment</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{fb.page}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(fb.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteFeedback(fb.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
