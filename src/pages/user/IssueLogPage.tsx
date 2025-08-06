import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StorageManager, Project, Issue, Screenshot } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Eye, CheckCircle, RotateCcw, Calendar, FileText } from 'lucide-react';

export default function IssueLogPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

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

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolution(issue.resolution || '');
    setViewDialogOpen(true);
  };

  const handleMarkAsFixed = () => {
    if (!selectedIssue || !project) return;

    const updatedIssues = project.issues?.map(issue =>
      issue.id === selectedIssue.id
        ? {
            ...issue,
            status: 'Fixed' as const,
            resolution: resolution.trim() || undefined,
            resolvedAt: new Date().toISOString()
          }
        : issue
    ) || [];

    StorageManager.updateProject(project.id, {
      ...project,
      issues: updatedIssues
    });

    toast({
      title: "Success",
      description: "Issue marked as fixed"
    });

    setViewDialogOpen(false);
    loadProject();
  };

  const handleReopen = () => {
    if (!selectedIssue || !project) return;

    const updatedIssues = project.issues?.map(issue =>
      issue.id === selectedIssue.id
        ? {
            ...issue,
            status: 'Reopened' as const,
            resolution: resolution.trim() || undefined,
            resolvedAt: undefined
          }
        : issue
    ) || [];

    StorageManager.updateProject(project.id, {
      ...project,
      issues: updatedIssues
    });

    toast({
      title: "Success",
      description: "Issue reopened"
    });

    setViewDialogOpen(false);
    loadProject();
  };

  const handleSaveResolution = () => {
    if (!selectedIssue || !project) return;

    const updatedIssues = project.issues?.map(issue =>
      issue.id === selectedIssue.id
        ? {
            ...issue,
            resolution: resolution.trim() || undefined
          }
        : issue
    ) || [];

    StorageManager.updateProject(project.id, {
      ...project,
      issues: updatedIssues
    });

    toast({
      title: "Success",
      description: "Resolution details saved"
    });

    setViewDialogOpen(false);
    loadProject();
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setCurrentScreenshot(screenshot);
    setImagePreviewOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fixed': return 'bg-green-600';
      case 'Reopened': return 'bg-orange-600';
      case 'Open': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLinkedScripts = (issue: Issue) => {
    return project?.importedScripts?.filter(script => 
      issue.linkedScripts.includes(script.id)
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

  const issues = project.issues || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Issue Log</h1>
        <p className="text-muted-foreground">
          Project: <span className="font-medium">{project.name}</span>
        </p>
      </div>

      {/* Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{issues.length}</div>
              <div className="text-xs text-muted-foreground">Total Issues</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {issues.filter(i => i.status === 'Open').length}
              </div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {issues.filter(i => i.status === 'Reopened').length}
              </div>
              <div className="text-xs text-muted-foreground">Reopened</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {issues.filter(i => i.status === 'Fixed').length}
              </div>
              <div className="text-xs text-muted-foreground">Fixed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No issues found</h3>
            <p className="text-muted-foreground">
              Issues will appear here when they are raised during test execution
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => {
            const linkedScripts = getLinkedScripts(issue);
            
            return (
              <Card key={issue.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          Issue #{issue.issueNumber}: {issue.title}
                        </CardTitle>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created: {formatDate(issue.createdAt)}
                        </div>
                        {issue.resolvedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Resolved: {formatDate(issue.resolvedAt)}
                          </div>
                        )}
                      </div>
                      {linkedScripts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Linked to {linkedScripts.length} script(s):
                          </span>
                          <div className="flex gap-1">
                            {linkedScripts.slice(0, 2).map(script => (
                              <Badge key={script.id} variant="outline" className="text-xs">
                                {script.scriptId}
                              </Badge>
                            ))}
                            {linkedScripts.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{linkedScripts.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewIssue(issue)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardHeader>
                
                {issue.resolution && (
                  <CardContent className="pt-0">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Resolution: </span>
                      <span className="text-sm text-green-700">{issue.resolution}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* View Issue Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Issue #{selectedIssue?.issueNumber}: {selectedIssue?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(selectedIssue.status)}>
                  {selectedIssue.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created: {formatDate(selectedIssue.createdAt)}
                </span>
                {selectedIssue.resolvedAt && (
                  <span className="text-sm text-muted-foreground">
                    Resolved: {formatDate(selectedIssue.resolvedAt)}
                  </span>
                )}
              </div>

              <div>
                <Label className="font-medium">Description:</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                  {selectedIssue.description}
                </p>
              </div>

              {selectedIssue.screenshot && (
                <div>
                  <Label className="font-medium">Screenshot:</Label>
                  <div className="mt-2">
                    <img
                      src={selectedIssue.screenshot.path}
                      alt="Issue screenshot"
                      className="max-w-md h-48 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => handleViewScreenshot(selectedIssue.screenshot!)}
                    />
                    {selectedIssue.screenshot.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedIssue.screenshot.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Linked Scripts */}
              {getLinkedScripts(selectedIssue).length > 0 && (
                <div>
                  <Label className="font-medium">Linked Scripts:</Label>
                  <div className="mt-2 space-y-2">
                    {getLinkedScripts(selectedIssue).map(script => (
                      <div key={script.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{script.scriptId}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {script.shortDescription}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          📁 {script.folderPath}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="font-medium">Resolution Details:</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Add resolution details..."
                  className="bg-background min-h-[100px]"
                />
                
                <div className="flex gap-4">
                  {selectedIssue.status !== 'Fixed' && (
                    <Button 
                      onClick={handleMarkAsFixed}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Fixed
                    </Button>
                  )}
                  
                  {selectedIssue.status === 'Fixed' && (
                    <Button 
                      onClick={handleReopen}
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reopen
                    </Button>
                  )}
                  
                  <Button onClick={handleSaveResolution} variant="outline">
                    Save Resolution
                  </Button>
                  
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
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