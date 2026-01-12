import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Key, Trash2, Copy, Plus, Users, CheckCircle, XCircle, Calendar, Clock } from "lucide-react";

interface GeneratedKey {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  createdAt: any;
  expiryDate: any;
  isActive: boolean;
}

const AdminKeyGeneration = () => {
  const [keys, setKeys] = useState<GeneratedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxUses, setMaxUses] = useState<number>(10);
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const q = query(collection(db, "adminGeneratedKeys"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const keysData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedKey[];
      setKeys(keysData);
    } catch (error) {
      console.error("Error fetching keys:", error);
      toast.error("Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateKey = async () => {
    if (maxUses < 1) {
      toast.error("Max uses must be at least 1");
      return;
    }

    if (expiryHours < 1) {
      toast.error("Expiry time must be at least 1 hour");
      return;
    }

    setGenerating(true);
    try {
      const code = generateRandomCode();
      const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
      
      await addDoc(collection(db, "adminGeneratedKeys"), {
        code,
        maxUses,
        usedCount: 0,
        createdAt: new Date(),
        expiryDate,
        isActive: true
      });

      toast.success("Key generated successfully!");
      fetchKeys();
    } catch (error) {
      console.error("Error generating key:", error);
      toast.error("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await deleteDoc(doc(db, "adminGeneratedKeys", keyId));
      toast.success("Key deleted successfully!");
      fetchKeys();
    } catch (error) {
      console.error("Error deleting key:", error);
      toast.error("Failed to delete key");
    }
  };

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "adminGeneratedKeys", keyId), {
        isActive: !currentStatus
      });
      toast.success(`Key ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchKeys();
    } catch (error) {
      console.error("Error toggling key:", error);
      toast.error("Failed to update key status");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const formatTimeRemaining = (expiryDate: any) => {
    if (!expiryDate) return "No expiry";
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const isExpiredByTime = (expiryDate: any) => {
    if (!expiryDate) return false;
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    return expiry.getTime() < Date.now();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate Bypass Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                  placeholder="Enter max uses"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryHours">Expiry (Hours)</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiryHours"
                  type="number"
                  min="1"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseInt(e.target.value) || 1)}
                  placeholder="Hours until expiry"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Key will expire after {maxUses} uses OR after {expiryHours} hours (whichever comes first).
          </p>
          <Button onClick={handleGenerateKey} disabled={generating} className="mt-4 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate Key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No keys generated yet. Create your first key above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => {
                    const isUsesExpired = key.usedCount >= key.maxUses;
                    const isTimeExpired = isExpiredByTime(key.expiryDate);
                    const isExpired = isUsesExpired || isTimeExpired;
                    
                    return (
                      <TableRow key={key.id} className={isExpired ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {key.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(key.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isUsesExpired ? "text-destructive" : ""}>
                            {key.usedCount}/{key.maxUses}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={isTimeExpired ? "text-destructive" : "text-green-600"}>
                            {formatTimeRemaining(key.expiryDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <XCircle className="h-3 w-3" /> Expired
                            </span>
                          ) : key.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!isExpired && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleToggleActive(key.id, key.isActive)}
                              >
                                {key.isActive ? "Off" : "On"}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKeyGeneration;
