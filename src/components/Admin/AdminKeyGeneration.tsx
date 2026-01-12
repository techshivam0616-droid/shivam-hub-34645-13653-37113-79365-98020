import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Key, Trash2, Copy, Plus, Users, CheckCircle, XCircle } from "lucide-react";

interface GeneratedKey {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  createdAt: any;
  isActive: boolean;
}

const AdminKeyGeneration = () => {
  const [keys, setKeys] = useState<GeneratedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxUses, setMaxUses] = useState<number>(10);
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

    setGenerating(true);
    try {
      const code = generateRandomCode();
      
      await addDoc(collection(db, "adminGeneratedKeys"), {
        code,
        maxUses,
        usedCount: 0,
        createdAt: new Date(),
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
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
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
              <p className="text-xs text-muted-foreground">
                Users can use this key to bypass shortener. Key becomes invalid after {maxUses} uses.
              </p>
            </div>
            <Button onClick={handleGenerateKey} disabled={generating}>
              <Plus className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Generate Key"}
            </Button>
          </div>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => {
                    const isExpired = key.usedCount >= key.maxUses;
                    return (
                      <TableRow key={key.id} className={isExpired ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {key.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(key.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isExpired ? "text-destructive" : ""}>
                            {key.usedCount} / {key.maxUses}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <span className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" /> Expired
                            </span>
                          ) : key.isActive ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!isExpired && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(key.id, key.isActive)}
                              >
                                {key.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
