import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StorageManager, Project, ImportedScript, Screenshot, Issue } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Play, Eye, RotateCcw, CheckCircle, AlertTriangle, Upload, Save, X, Camera } from 'lucide-react';

export default function TestLabPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [filteredScripts, setFilteredScripts] = useState<ImportedScript[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedScript, setSelectedScript] = useState<ImportedScript | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  
  // Execution form states
  const [remarks, setRemarks] = useState('');
  const [newScreenshots, setNewScreenshots] = useState<Screenshot[]>([]);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    filterScripts();
  }, [project, statusFilter]);

  const loadProject = () => {
    const data = StorageManager.loadData();
    const currentProject = data.projects.find(p => p.id === projectId);
    
    if (!currentProject) {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive"
      });
      return;
    }

    setProject(currentProject);
  };

  const filterScripts = () => {
    if (!project || !project.importedScripts) {
      setFilteredScripts([]);
      return;
    }

    let filtered = project.importedScripts;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(script => script.status === statusFilter);
    }

    setFilteredScripts(filtered);
  };

  const handleViewScript = (script: ImportedScript) => {
    setSelectedScript(script);
    setViewDialogOpen(true);
  };

  const handleExecuteScript = (script: ImportedScript, mode: 'start' | 'resume' | 'retarget') => {
    setSelectedScript(script);
    
    // Pre-fill form for resume/retarget
    if (mode === 'resume' || mode === 'retarget') {
      setRemarks(script.remarks || '');
      setNewScreenshots(script.additionalScreenshots || []);
    } else {
      setRemarks('');
      setNewScreenshots([]);
    }
    
    setSelectedIssue('');
    setNewIssueTitle('');
    setNewIssueDescription('');
    setShowNewIssueForm(false);
    setExecuteDialogOpen(true);
  };

  const handleMarkComplete = () => {
    if (!selectedScript || !project) return;

    const updatedScripts = project.importedScripts?.map(script =>
      script.id === selectedScript.id
        ? {
            ...script,
            status: 'Completed' as const,
            remarks,
            additionalScreenshots: newScreenshots,
            executionDate: new Date().toISOString()
          }
        : script
    ) || [];

    StorageManager.updateProject(project.id, {
      ...project,
      importedScripts: updatedScripts
    });

    toast({
      title: "Success",
      description: "Script marked as completed"
    });

    setExecuteDialogOpen(false);
    loadProject();
  };

  const handleRaiseIssue = () => {
    if (!selectedScript || !project) return;

    let issueId = selectedIssue;
    let updatedProject = { ...project };
    
    // Create new issue if needed
    if (showNewIssueForm && newIssueTitle.trim()) {
      const newIssue: Issue = {
        id: StorageManager.generateId(),
        issueNumber: (project.issues?.length || 0) + 1,
        title: newIssueTitle.trim(),
        description: newIssueDescription.trim(),
        status: 'Open',
        linkedScripts: [selectedScript.id],
        createdAt: new Date().toISOString()
      };

      updatedProject = {
        ...project,
        issues: [...(project.issues || []), newIssue]
      };
      issueId = newIssue.id;
    }

    // Update script with issue
    const updatedScripts = updatedProject.importedScripts?.map(script =>
      script.id === selectedScript.id
        ? {
            ...script,
            status: 'Issues' as const,
            remarks,
            additionalScreenshots: newScreenshots,
            linkedIssues: [...(script.linkedIssues || []), issueId].filter(Boolean)
          }
        : script
    ) || [];

    // Save the complete updated project with both issues and scripts
    const finalProject = {
      ...updatedProject,
      importedScripts: updatedScripts
    };

    StorageManager.updateProject(project.id, finalProject);

    toast({
      title: "Success",
      description: "Issue raised and linked to script"
    });

    setExecuteDialogOpen(false);
    loadProject();
  };

  const handleSave = () => {
    if (!selectedScript || !project) return;

    const updatedScripts = project.importedScripts?.map(script =>
      script.id === selectedScript.id
        ? {
            ...script,
            remarks,
            additionalScreenshots: newScreenshots
          }
        : script
    ) || [];

    StorageManager.updateProject(project.id, {
      ...project,
      importedScripts: updatedScripts
    });

    toast({
      title: "Success",
      description: "Changes saved successfully"
    });

    setExecuteDialogOpen(false);
    loadProject();
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
          setNewScreenshots(prev => [...prev, newScreenshot]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setCurrentScreenshot(screenshot);
    setImagePreviewOpen(true);
  };

  const handleRemoveScreenshot = (id: string) => {
    setNewScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const updateScreenshotDescription = (id: string, description: string) => {
    setNewScreenshots(prev => 
      prev.map(s => s.id === id ? { ...s, description } : s)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-600';
      case 'Issues': return 'bg-red-600';
      case 'Pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getIssuesForScript = (scriptId: string) => {
    return project?.issues?.filter(issue => 
      issue.linkedScripts.includes(scriptId)
    ) || [];
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Loading project...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Test Lab</h1>
        <p className="text-muted-foreground">
          Project: <span className="font-medium">{project.name}</span>
        </p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="status-filter">Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">All Scripts</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Issues">Scripts with Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {project.importedScripts?.length === 0 
                ? 'No scripts imported yet' 
                : 'No scripts match the selected filter'
              }
            </h3>
            <p className="text-muted-foreground">
              {project.importedScripts?.length === 0
                ? 'Import scripts first to start testing'
                : 'Try selecting a different status filter'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map((script) => {
            const linkedIssues = getIssuesForScript(script.id);
            
            return (
              <Card key={script.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{script.scriptId}</CardTitle>
                        <Badge className={getStatusColor(script.status)}>
                          {script.status}
                        </Badge>
                        <Badge variant="outline">{script.testType}</Badge>
                        {linkedIssues.length > 0 && (
                          <Badge variant="destructive">
                            {linkedIssues.length} Issue(s)
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{script.shortDescription}</p>
                      <p className="text-sm text-muted-foreground">📁 {script.folderPath}</p>
                      {script.executionDate && (
                        <p className="text-xs text-muted-foreground">
                          Executed: {new Date(script.executionDate).toLocaleString()}
                        </p>
                      )}
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
                      
                      {script.status === 'Pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecuteScript(script, 'start')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {script.status === 'Issues' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecuteScript(script, 'resume')}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      
                      {script.status === 'Completed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecuteScript(script, 'retarget')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Retarget
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {(script.remarks || linkedIssues.length > 0) && (
                  <CardContent className="pt-0">
                    {script.remarks && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Remarks: </span>
                        <span className="text-sm text-muted-foreground">{script.remarks}</span>
                      </div>
                    )}
                    {linkedIssues.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Linked Issues:</span>
                        {linkedIssues.map(issue => (
                          <div key={issue.id} className="text-sm text-muted-foreground">
                            Issue #{issue.issueNumber}: {issue.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
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
                  <Label className="font-medium">Status:</Label>
                  <Badge className={getStatusColor(selectedScript.status)}>
                    {selectedScript.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-medium">Short Description:</Label>
                <p className="text-sm text-muted-foreground">{selectedScript.shortDescription}</p>
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
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedScript.scriptDetails}</p>
                </div>
              )}

              {selectedScript.remarks && (
                <div>
                  <Label className="font-medium">Execution Remarks:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedScript.remarks}</p>
                </div>
              )}

              {selectedScript.screenshots.length > 0 && (
                <div>
                  <Label className="font-medium">Original Screenshots:</Label>
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

              {selectedScript.additionalScreenshots && selectedScript.additionalScreenshots.length > 0 && (
                <div>
                  <Label className="font-medium">Additional Screenshots:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {selectedScript.additionalScreenshots.map((screenshot) => (
                      <div key={screenshot.id} className="space-y-2">
                        <img
                          src={screenshot.path}
                          alt="Additional Screenshot"
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

      {/* Execute Script Dialog */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent className="max-w-4xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execute Script: {selectedScript?.scriptId}</DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-6">
              {/* Show linked issues if any */}
              {selectedScript.linkedIssues && selectedScript.linkedIssues.length > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Linked Issues:</span>
                  </div>
                  {selectedScript.linkedIssues.map(issueId => {
                    const issue = project?.issues?.find(i => i.id === issueId);
                    return issue ? (
                      <div key={issue.id} className="text-sm text-orange-700">
                        Issue #{issue.issueNumber}: {issue.title}
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Script Information Summary */}
              <div className="p-4 bg-secondary rounded-lg">
                <h4 className="font-medium mb-2">Script Summary:</h4>
                <p className="text-sm text-muted-foreground mb-1">{selectedScript.shortDescription}</p>
                <p className="text-xs text-muted-foreground">📁 {selectedScript.folderPath}</p>
              </div>

              {/* Original Screenshots */}
              {selectedScript.screenshots.length > 0 && (
                <div>
                  <Label className="font-medium">Original Screenshots:</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {selectedScript.screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="relative">
                        <img
                          src={screenshot.path}
                          alt="Original"
                          className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => handleViewScreenshot(screenshot)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => handleViewScreenshot(screenshot)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add execution remarks..."
                    className="bg-background min-h-[80px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Add Screenshots</Label>
                    <div>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="execution-file-upload"
                      />
                      <Label htmlFor="execution-file-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Camera className="h-4 w-4 mr-1" />
                            Add Images
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {newScreenshots.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {newScreenshots.map((screenshot) => (
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
                                <X className="h-3 w-3" />
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
                            onChange={(e) => updateScreenshotDescription(screenshot.id, e.target.value)}
                            className="bg-background text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Issue Management */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Issue Management</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewIssueForm(!showNewIssueForm)}
                    >
                      {showNewIssueForm ? 'Select Existing' : 'Create New Issue'}
                    </Button>
                  </div>

                  {showNewIssueForm ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Issue title"
                        value={newIssueTitle}
                        onChange={(e) => setNewIssueTitle(e.target.value)}
                        className="bg-background"
                      />
                      <Textarea
                        placeholder="Issue description"
                        value={newIssueDescription}
                        onChange={(e) => setNewIssueDescription(e.target.value)}
                        className="bg-background min-h-[60px]"
                      />
                    </div>
                  ) : (
                    <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select existing issue (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {project?.issues?.length === 0 ? (
                          <SelectItem value="no-issues" disabled>
                            No issues available in Issue Log
                          </SelectItem>
                        ) : (
                          project?.issues?.filter(i => i.status !== 'Fixed').map((issue) => (
                            <SelectItem key={issue.id} value={issue.id}>
                              Issue #{issue.issueNumber}: {issue.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleMarkComplete} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedScript.status === 'Completed'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Complete
                </Button>
                
                <Button 
                  onClick={handleRaiseIssue}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  disabled={!selectedIssue && (!showNewIssueForm || !newIssueTitle.trim())}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Raise Issue
                </Button>
                
                <Button onClick={handleSave} variant="outline">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                
                <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
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