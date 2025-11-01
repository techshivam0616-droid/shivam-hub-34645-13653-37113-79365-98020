import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUpload } from '@/components/Admin/AdminUpload';
import { AdminEdit } from '@/components/Admin/AdminEdit';
import { AdminUsers } from '@/components/Admin/AdminUsers';
import { AdminLeaderboard } from '@/components/Admin/AdminLeaderboard';
import { AdminNotifications } from '@/components/Admin/AdminNotifications';
import { AdminMaintenance } from '@/components/Admin/AdminMaintenance';
import { AdminMessages } from '@/components/Admin/AdminMessages';
import { AdminVerification } from '@/components/Admin/AdminVerification';
import { AdminWebsiteSettings } from '@/components/Admin/AdminWebsiteSettings';
import { AdminNotice } from '@/components/Admin/AdminNotice';
import { Shield } from 'lucide-react';

const Admin = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 overflow-x-auto">
            <TabsTrigger value="upload" className="whitespace-nowrap text-sm">Upload</TabsTrigger>
            <TabsTrigger value="edit" className="whitespace-nowrap text-sm">Edit</TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap text-sm">Users</TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap text-sm">Settings</TabsTrigger>
            <TabsTrigger value="notice" className="whitespace-nowrap text-sm">Notice</TabsTrigger>
            <TabsTrigger value="leaderboard" className="whitespace-nowrap text-sm">Leaderboard</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="maintenance" className="whitespace-nowrap text-sm">Maintenance</TabsTrigger>
            <TabsTrigger value="messages" className="whitespace-nowrap text-sm">Messages</TabsTrigger>
            <TabsTrigger value="verification" className="whitespace-nowrap text-sm">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <AdminUpload />
          </TabsContent>

          <TabsContent value="edit">
            <AdminEdit />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="settings">
            <AdminWebsiteSettings />
          </TabsContent>

          <TabsContent value="notice">
            <AdminNotice />
          </TabsContent>

          <TabsContent value="leaderboard">
            <AdminLeaderboard />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="maintenance">
            <AdminMaintenance />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessages />
          </TabsContent>

          <TabsContent value="verification">
            <AdminVerification />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
