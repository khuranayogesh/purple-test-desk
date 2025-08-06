import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StorageManager, Project } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const data = StorageManager.loadData();
    setProjects(data.projects);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone and will remove all associated data.`)) {
      StorageManager.deleteProject(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      loadProjects();
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

  const getProjectStats = (project: Project) => {
    const totalScripts = project.importedScripts?.length || 0;
    const completedScripts = project.importedScripts?.filter(s => s.status === 'Completed').length || 0;
    const pendingScripts = project.importedScripts?.filter(s => s.status === 'Pending').length || 0;
    const issueScripts = project.importedScripts?.filter(s => s.status === 'Issues').length || 0;
    const totalIssues = project.issues?.length || 0;
    const openIssues = project.issues?.filter(i => i.status === 'Open' || i.status === 'Reopened').length || 0;

    return {
      totalScripts,
      completedScripts,
      pendingScripts,
      issueScripts,
      totalIssues,
      openIssues
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Projects Overview</h1>
        <p className="text-muted-foreground">Manage projects created by users</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects created yet</h3>
            <p className="text-muted-foreground">
              Projects will appear here when users create them in their dashboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            
            return (
              <Card key={project.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Created by: {project.createdBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(project.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Script Statistics */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Test Scripts Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-secondary rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats.totalScripts}</div>
                        <div className="text-xs text-muted-foreground">Total Scripts</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.completedScripts}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingScripts}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.issueScripts}</div>
                        <div className="text-xs text-muted-foreground">With Issues</div>
                      </div>
                    </div>
                  </div>

                  {/* Issue Statistics */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Issues Overview</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <span className="text-sm font-medium">Total Issues</span>
                        </div>
                        <Badge variant="secondary">{stats.totalIssues}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-medium">Open Issues</span>
                        </div>
                        <Badge variant="destructive">{stats.openIssues}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {stats.totalScripts > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {Math.round((stats.completedScripts / stats.totalScripts) * 100)}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(stats.completedScripts / stats.totalScripts) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {project.importedScripts && project.importedScripts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Recent Scripts</h4>
                      <div className="space-y-1">
                        {project.importedScripts.slice(0, 3).map((script) => (
                          <div key={script.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate">{script.scriptId}</span>
                            <Badge 
                              variant={
                                script.status === 'Completed' ? 'default' : 
                                script.status === 'Issues' ? 'destructive' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {script.status}
                            </Badge>
                          </div>
                        ))}
                        {project.importedScripts.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            +{project.importedScripts.length - 3} more scripts
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}