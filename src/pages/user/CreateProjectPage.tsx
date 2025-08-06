import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageManager, Project } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Calendar, ArrowRight } from 'lucide-react';

export default function CreateProjectPage() {
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const user = StorageManager.getCurrentUser();
    if (user) {
      setCurrentUser(user.username);
      loadUserProjects(user.username);
    }
  }, []);

  const loadUserProjects = (username: string) => {
    const data = StorageManager.loadData();
    const userProjects = data.projects.filter(p => p.createdBy === username);
    setProjects(userProjects);
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    const existingProject = projects.find(p => 
      p.name.toLowerCase() === projectName.trim().toLowerCase()
    );

    if (existingProject) {
      toast({
        title: "Error",
        description: "A project with this name already exists",
        variant: "destructive"
      });
      return;
    }

    const newProject: Project = {
      id: StorageManager.generateId(),
      name: projectName.trim(),
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      importedScripts: [],
      issues: []
    };

    StorageManager.addProject(newProject);
    
    toast({
      title: "Success",
      description: "Project created successfully"
    });

    setProjectName('');
    loadUserProjects(currentUser);
    navigate(`/user/project/${newProject.id}/import`);
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/user/project/${projectId}/import`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
        <p className="text-muted-foreground">Create and manage your testing projects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="bg-background"
            />
          </div>
          <Button 
            onClick={handleCreateProject} 
            className="bg-primary hover:bg-primary-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
        
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects created yet</h3>
              <p className="text-muted-foreground">Create your first project to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created {formatDate(project.createdAt)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewProject(project.id)}
                    >
                      Open Project
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}