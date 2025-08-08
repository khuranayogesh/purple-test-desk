import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StorageManager, Folder, Script, Screenshot } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, X, Eye, Plus, Trash2, Table } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableEditor } from '@/components/TableEditor';

export default function AddScriptPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [testEnvironment, setTestEnvironment] = useState<'Online' | 'Batch' | 'Online & Batch'>('Online');
  const [testType, setTestType] = useState<'Positive' | 'Negative'>('Positive');
  const [purpose, setPurpose] = useState('');
  const [assumptions, setAssumptions] = useState<string[]>(['']);
  const [expectedResults, setExpectedResults] = useState('');
  const [scriptDetails, setScriptDetails] = useState('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableColumns, setTableColumns] = useState('3');
  const [tables, setTables] = useState<{ id: string; data: string[][] }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const data = StorageManager.loadData();
    setFolders(data.folders);
  }, []);

  const getSubfolderOptions = () => {
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

  const handleAddAssumption = () => {
    setAssumptions([...assumptions, '']);
  };

  const handleUpdateAssumption = (index: number, value: string) => {
    const updated = [...assumptions];
    updated[index] = value;
    setAssumptions(updated);
  };

  const handleRemoveAssumption = (index: number) => {
    if (assumptions.length > 1) {
      setAssumptions(assumptions.filter((_, i) => i !== index));
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
          setScreenshots(prev => [...prev, newScreenshot]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleUpdateScreenshotDescription = (id: string, description: string) => {
    setScreenshots(prev => 
      prev.map(s => s.id === id ? { ...s, description } : s)
    );
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setCurrentScreenshot(screenshot);
    setImagePreviewOpen(true);
  };

  const handleInsertTable = () => {
    setTableDialogOpen(true);
  };

  const handleCreateTable = () => {
    const rows = parseInt(tableRows);
    const cols = parseInt(tableColumns);
    
    if (rows < 1 || cols < 1 || rows > 20 || cols > 10) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers (Rows: 1-20, Columns: 1-10)",
        variant: "destructive"
      });
      return;
    }

    const newTable = {
      id: StorageManager.generateId(),
      data: [] as string[][]
    };

    setTables(prev => [...prev, newTable]);
    setTableDialogOpen(false);
    setTableRows('3');
    setTableColumns('3');
    
    toast({
      title: "Table Added",
      description: `${rows}x${cols} table added below`
    });
  };

  const handleTableChange = (tableId: string, tableData: string[][]) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, data: tableData } : table
      )
    );
  };

  const handleRemoveTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleSaveScript = () => {
    if (!selectedSubfolder || !scriptId.trim() || !shortDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const selectedFolder = getSubfolderOptions().find(f => f.id === selectedSubfolder);
    if (!selectedFolder) {
      toast({
        title: "Error",
        description: "Please select a valid subfolder",
        variant: "destructive"
      });
      return;
    }

    const newScript: Script = {
      id: StorageManager.generateId(),
      scriptId,
      shortDescription,
      subfolderId: selectedSubfolder,
      folderPath: selectedFolder.path,
      testEnvironment,
      testType,
      purpose,
      assumptions: assumptions.filter(a => a.trim()),
      expectedResults,
      scriptDetails,
      screenshots,
      createdAt: new Date().toISOString()
    };

    StorageManager.addScript(newScript);
    
    toast({
      title: "Success",
      description: "Script created successfully"
    });

    // Reset form
    setSelectedSubfolder('');
    setScriptId('');
    setShortDescription('');
    setTestEnvironment('Online');
    setTestType('Positive');
    setPurpose('');
    setAssumptions(['']);
    setExpectedResults('');
    setScriptDetails('');
    setScreenshots([]);
    setTables([]);
  };

  const subfolderOptions = getSubfolderOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Test Script</h1>
        <p className="text-muted-foreground">Create a new test script with detailed information</p>
      </div>

      {subfolderOptions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No subfolders available</h3>
            <p className="text-muted-foreground">
              You need to create folders and subfolders before adding scripts
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Script Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subfolder">Sub-folder Selection *</Label>
                <Select value={selectedSubfolder} onValueChange={setSelectedSubfolder}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select subfolder" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {subfolderOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scriptId">Script ID *</Label>
                <Input
                  id="scriptId"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  placeholder="Enter script ID"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description *</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Enter short description"
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testEnvironment">Test Environment</Label>
                <Select value={testEnvironment} onValueChange={(value: 'Online' | 'Batch' | 'Online & Batch') => setTestEnvironment(value)}>
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
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={(value: 'Positive' | 'Negative') => setTestType(value)}>
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
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter test purpose"
                className="bg-background min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assumptions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAssumption}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {assumptions.map((assumption, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={assumption}
                      onChange={(e) => handleUpdateAssumption(index, e.target.value)}
                      placeholder={`Assumption ${index + 1}`}
                      className="bg-background"
                    />
                    {assumptions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAssumption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedResults">Expected Results</Label>
              <Textarea
                id="expectedResults"
                value={expectedResults}
                onChange={(e) => setExpectedResults(e.target.value)}
                placeholder="Enter expected results"
                className="bg-background min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="scriptDetails">Script Details</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInsertTable}
                >
                  <Table className="h-4 w-4 mr-1" />
                  Insert Table
                </Button>
              </div>
              <Textarea
                id="scriptDetails"
                value={scriptDetails}
                onChange={(e) => setScriptDetails(e.target.value)}
                placeholder="Enter detailed script information"
                className="bg-background min-h-[150px]"
              />
            </div>

            {/* Tables Section */}
            {tables.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Tables:</h4>
                <div className="space-y-4">
                  {tables.map((table) => (
                    <TableEditor
                      key={table.id}
                      initialRows={parseInt(tableRows)}
                      initialColumns={parseInt(tableColumns)}
                      onTableChange={(data) => handleTableChange(table.id, data)}
                      onRemove={() => handleRemoveTable(table.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Label>Screenshots</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click to upload screenshots or drag and drop
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </Label>
                </div>
              </div>

              {screenshots.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Uploaded Screenshots:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{screenshot.fileName}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewScreenshot(screenshot)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveScreenshot(screenshot.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <img
                          src={screenshot.path}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded border cursor-pointer"
                          onClick={() => handleViewScreenshot(screenshot)}
                        />
                        <Input
                          placeholder="Add description..."
                          value={screenshot.description}
                          onChange={(e) => handleUpdateScreenshotDescription(screenshot.id, e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSaveScript} className="bg-primary hover:bg-primary-glow">
                Save Script
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Table Creation Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Insert Table
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableRows">Rows</Label>
                <Input
                  id="tableRows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableColumns">Columns</Label>
                <Input
                  id="tableColumns"
                  type="number"
                  min="1"
                  max="10"
                  value={tableColumns}
                  onChange={(e) => setTableColumns(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTableDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTable}>
                Insert Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}