import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StorageManager, Script, Screenshot, Folder } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, Edit, Trash2, Search, Filter, X, Plus, Upload } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function ScriptListingPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  
  // Edit form states
  const [editForm, setEditForm] = useState<Partial<Script>>({});
  const [editAssumptions, setEditAssumptions] = useState<string[]>([]);
  const [editScreenshots, setEditScreenshots] = useState<Screenshot[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterScripts();
  }, [scripts, selectedFolder, searchTerm]);

  const loadData = () => {
    const data = StorageManager.loadData();
    setScripts(data.scripts);
    setFolders(data.folders);
  };

  const filterScripts = () => {
    let filtered = scripts;

    if (selectedFolder !== 'all') {
      filtered = filtered.filter(script => script.subfolderId === selectedFolder);
    }

    if (searchTerm) {
      filtered = filtered.filter(script =>
        script.scriptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.folderPath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredScripts(filtered);
  };

  const getFolderOptions = () => {
    return folders
      .filter(f => f.parentId)
      .map(subfolder => {
        const parent = folders.find(p => p.id === subfolder.parentId);
        return {
          id: subfolder.id,
          path: parent ? `${parent.name} > ${subfolder.name}` : subfolder.name
        };
      });
  };

  const handleViewScript = (script: Script) => {
    setSelectedScript(script);
    setViewDialogOpen(true);
  };

  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    setEditForm(script);
    setEditAssumptions(script.assumptions);
    setEditScreenshots([...script.screenshots]);
    setEditDialogOpen(true);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (confirm('Are you sure you want to delete this script? This action cannot be undone.')) {
      StorageManager.deleteScript(scriptId);
      toast({
        title: "Success",
        description: "Script deleted successfully"
      });
      loadData();
    }
  };

  const handleUpdateScript = () => {
    if (!selectedScript || !editForm.scriptId?.trim() || !editForm.shortDescription?.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedScript: Partial<Script> = {
      ...editForm,
      assumptions: editAssumptions.filter(a => a.trim()),
      screenshots: editScreenshots
    };

    StorageManager.updateScript(selectedScript.id, updatedScript);
    
    toast({
      title: "Success",
      description: "Script updated successfully"
    });

    setEditDialogOpen(false);
    loadData();
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setCurrentScreenshot(screenshot);
    setImagePreviewOpen(true);
  };

  const handleAddAssumption = () => {
    setEditAssumptions([...editAssumptions, '']);
  };

  const handleUpdateAssumption = (index: number, value: string) => {
    const updated = [...editAssumptions];
    updated[index] = value;
    setEditAssumptions(updated);
  };

  const handleRemoveAssumption = (index: number) => {
    if (editAssumptions.length > 1) {
      setEditAssumptions(editAssumptions.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newScreenshot: Screenshot = {
            id: StorageManager.generateId(),
            fileName: file.name,
            description: '',
            path: e.target?.result as string
          };
          setEditScreenshots(prev => [...prev, newScreenshot]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleUpdateScreenshotDescription = (id: string, description: string) => {
    setEditScreenshots(prev => 
      prev.map(s => s.id === id ? { ...s, description } : s)
    );
  };

  const handleRemoveScreenshot = (id: string) => {
    setEditScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const folderOptions = getFolderOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Script Listing</h1>
        <p className="text-muted-foreground">View, modify, and delete test scripts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Scripts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID, description, or folder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-filter">Filter by Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all">All Folders</SelectItem>
                  {folderOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {scripts.length === 0 ? 'No scripts created yet' : 'No scripts match your filters'}
            </h3>
            <p className="text-muted-foreground">
              {scripts.length === 0 
                ? 'Create your first test script to get started'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{script.scriptId}</CardTitle>
                      <Badge variant="outline">{script.testType}</Badge>
                      <Badge variant="secondary">{script.testEnvironment}</Badge>
                    </div>
                    <p className="text-muted-foreground">{script.shortDescription}</p>
                    <p className="text-sm text-muted-foreground">📁 {script.folderPath}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewScript(script)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditScript(script)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteScript(script.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {script.screenshots.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>📷 {script.screenshots.length} screenshot(s)</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* View Script Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Script: {selectedScript?.scriptId}</DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Script ID:</Label>
                  <p className="text-sm text-muted-foreground">{selectedScript.scriptId}</p>
                </div>
                <div>
                  <Label className="font-medium">Folder:</Label>
                  <p className="text-sm text-muted-foreground">{selectedScript.folderPath}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Short Description:</Label>
                <p className="text-sm text-muted-foreground">{selectedScript.shortDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Test Environment:</Label>
                  <Badge variant="secondary">{selectedScript.testEnvironment}</Badge>
                </div>
                <div>
                  <Label className="font-medium">Test Type:</Label>
                  <Badge variant="outline">{selectedScript.testType}</Badge>
                </div>
              </div>

              {selectedScript.purpose && (
                <div>
                  <Label className="font-medium">Purpose:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedScript.purpose}</p>
                </div>
              )}

              {selectedScript.assumptions.length > 0 && (
                <div>
                  <Label className="font-medium">Assumptions:</Label>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedScript.assumptions.map((assumption, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScript.expectedResults && (
                <div>
                  <Label className="font-medium">Expected Results:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedScript.expectedResults}</p>
                </div>
              )}

              {selectedScript.scriptDetails && (
                <div>
                  <Label className="font-medium">Script Details:</Label>
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <RichTextEditor
                      value={selectedScript.scriptDetails}
                      readOnly={true}
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {selectedScript.screenshots.length > 0 && (
                <div>
                  <Label className="font-medium">Screenshots:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {selectedScript.screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="space-y-2">
                        <img
                          src={screenshot.path}
                          alt="Screenshot"
                          className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => handleViewScreenshot(screenshot)}
                        />
                        <p className="text-xs text-muted-foreground">{screenshot.description || screenshot.fileName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Script Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Script: {selectedScript?.scriptId}</DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-scriptId">Script ID *</Label>
                  <Input
                    id="edit-scriptId"
                    value={editForm.scriptId || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, scriptId: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subfolder">Sub-folder</Label>
                  <Select 
                    value={editForm.subfolderId || ''} 
                    onValueChange={(value) => {
                      const folderPath = folderOptions.find(f => f.id === value)?.path || '';
                      setEditForm(prev => ({ ...prev, subfolderId: value, folderPath }));
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {folderOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Short Description *</Label>
                <Input
                  id="edit-description"
                  value={editForm.shortDescription || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Environment</Label>
                  <Select 
                    value={editForm.testEnvironment || 'Online'} 
                    onValueChange={(value: 'Online' | 'Batch' | 'Online & Batch') => 
                      setEditForm(prev => ({ ...prev, testEnvironment: value }))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Batch">Batch</SelectItem>
                      <SelectItem value="Online & Batch">Online & Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select 
                    value={editForm.testType || 'Positive'} 
                    onValueChange={(value: 'Positive' | 'Negative') => 
                      setEditForm(prev => ({ ...prev, testType: value }))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="Positive">Positive</SelectItem>
                      <SelectItem value="Negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-purpose">Purpose</Label>
                <Textarea
                  id="edit-purpose"
                  value={editForm.purpose || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className="bg-background min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Assumptions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddAssumption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editAssumptions.map((assumption, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={assumption}
                        onChange={(e) => handleUpdateAssumption(index, e.target.value)}
                        placeholder={`Assumption ${index + 1}`}
                        className="bg-background"
                      />
                      {editAssumptions.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveAssumption(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expectedResults">Expected Results</Label>
                <Textarea
                  id="edit-expectedResults"
                  value={editForm.expectedResults || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expectedResults: e.target.value }))}
                  className="bg-background min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-scriptDetails">Script Details</Label>
                <RichTextEditor
                  value={editForm.scriptDetails || ''}
                  onChange={(value) => setEditForm(prev => ({ ...prev, scriptDetails: value }))}
                  className="bg-background"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Screenshots</Label>
                  <div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="edit-file-upload"
                    />
                    <Label htmlFor="edit-file-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          Add Images
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {editScreenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {editScreenshots.map((screenshot) => (
                      <div key={screenshot.id} className="border border-border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{screenshot.fileName}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewScreenshot(screenshot)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveScreenshot(screenshot.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <img
                          src={screenshot.path}
                          alt="Preview"
                          className="w-full h-20 object-cover rounded border cursor-pointer"
                          onClick={() => handleViewScreenshot(screenshot)}
                        />
                        <Input
                          placeholder="Description..."
                          value={screenshot.description}
                          onChange={(e) => handleUpdateScreenshotDescription(screenshot.id, e.target.value)}
                          className="bg-background text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleUpdateScript} className="bg-primary hover:bg-primary-glow">
                  Update Script
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl bg-background">
          <DialogHeader>
            <DialogTitle>{currentScreenshot?.fileName}</DialogTitle>
          </DialogHeader>
          {currentScreenshot && (
            <div className="space-y-4">
              <img
                src={currentScreenshot.path}
                alt="Full size preview"
                className="w-full max-h-[70vh] object-contain rounded border"
              />
              {currentScreenshot.description && (
                <div className="p-3 bg-secondary rounded">
                  <p className="text-sm">{currentScreenshot.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}