import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageManager, Folder } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, Folder as FolderIcon, Edit, Trash2, FolderOpen } from 'lucide-react';

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    const data = StorageManager.loadData();
    setFolders(data.folders);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive"
      });
      return;
    }

    if (editingFolder) {
      StorageManager.updateFolder(editingFolder.id, {
        name: folderName,
        parentId: parentId || undefined
      });
      toast({
        title: "Success",
        description: "Folder updated successfully"
      });
    } else {
      const newFolder: Folder = {
        id: StorageManager.generateId(),
        name: folderName,
        parentId: parentId || undefined
      };
      StorageManager.addFolder(newFolder);
      toast({
        title: "Success",
        description: "Folder created successfully"
      });
    }

    setDialogOpen(false);
    resetForm();
    loadFolders();
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setParentId(folder.parentId || '');
    setDialogOpen(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? This will also delete all subfolders.')) {
      StorageManager.deleteFolder(folderId);
      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
      loadFolders();
    }
  };

  const resetForm = () => {
    setEditingFolder(null);
    setFolderName('');
    setParentId('');
  };

  const getParentFolders = () => {
    return folders.filter(f => !f.parentId);
  };

  const getSubfolders = (parentId: string) => {
    return folders.filter(f => f.parentId === parentId);
  };

  const getFolderPath = (folder: Folder): string => {
    if (!folder.parentId) return folder.name;
    const parent = folders.find(f => f.id === folder.parentId);
    return parent ? `${parent.name} > ${folder.name}` : folder.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Folder Management</h1>
          <p className="text-muted-foreground">Organize your test scripts with folders and subfolders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-glow" onClick={resetForm}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle>
                {editingFolder ? 'Edit Folder' : 'Add New Folder'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentFolder">Parent Folder (Optional)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select parent folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="">No Parent (Root Folder)</SelectItem>
                    {getParentFolders().map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveFolder} className="bg-primary hover:bg-primary-glow">
                  {editingFolder ? 'Update' : 'Create'} Folder
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No folders created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first folder to start organizing your test scripts
            </p>
            <Button 
              onClick={() => setDialogOpen(true)} 
              className="bg-primary hover:bg-primary-glow"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create First Folder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Root Folders */}
          {getParentFolders().map((folder) => (
            <Card key={folder.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Root Folder</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFolder(folder)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Subfolders */}
              {getSubfolders(folder.id).length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Subfolders:</h4>
                    <div className="grid gap-2">
                      {getSubfolders(folder.id).map((subfolder) => (
                        <div key={subfolder.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                          <div className="flex items-center gap-2">
                            <FolderIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm">{getFolderPath(subfolder)}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFolder(subfolder)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFolder(subfolder.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}