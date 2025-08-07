import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, FolderPlus, FileText, List, Briefcase, Plus, Upload, Clipboard, AlertTriangle, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorageManager, User } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const user = StorageManager.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    if (user.userType === 'User') {
      const data = StorageManager.loadData();
      setProjects(data.projects.filter(p => p.createdBy === user.username));
    }
  }, [navigate]);

  const handleLogout = () => {
    StorageManager.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the system."
    });
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    // Check for exact match first
    if (location.pathname === path) return true;
    
    // For paths that can have sub-routes, check if current path starts with the path + '/'
    // but exclude cases where another path starts with the same prefix
    const pathSegments = path.split('/');
    const currentSegments = location.pathname.split('/');
    
    // If current path has more segments than the check path, it could be a sub-route
    if (currentSegments.length > pathSegments.length) {
      // Check if all segments of the check path match the beginning of current path
      return pathSegments.every((segment, index) => segment === currentSegments[index]);
    }
    
    return false;
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  if (!currentUser) return null;

  const adminMenuItems = [
    { path: '/admin/folders', icon: FolderPlus, label: 'Add Folder' },
    { path: '/admin/scripts/add', icon: FileText, label: 'Add Script' },
    { path: '/admin/scripts', icon: List, label: 'Script Listing' },
    { path: '/admin/projects', icon: Briefcase, label: 'Projects' }
  ];

  const userMenuItems = [
    { path: '/user/create-project', icon: Plus, label: 'Create Project' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-secondary"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Regression Assistant
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Welcome, {currentUser.username} ({currentUser.userType})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r border-border shadow-sm min-h-[calc(100vh-73px)]">
            <nav className="p-4 space-y-2">
              {currentUser.userType === 'Administrator' ? (
                <>
                  {adminMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActivePath(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActivePath(item.path) 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                </>
              ) : (
                <>
                  {userMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActivePath(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActivePath(item.path) 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                  
                  {projects.length > 0 && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Projects</h3>
                      {projects.map((project) => {
                        const isExpanded = expandedProjects[project.id] ?? false;
                        const hasActiveSubRoute = isActivePath(`/user/project/${project.id}`);
                        
                        return (
                          <div key={project.id} className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between text-sm font-medium hover:bg-secondary"
                              onClick={() => toggleProjectExpansion(project.id)}
                            >
                              <span className="flex items-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 mr-2" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 mr-2" />
                                )}
                                {project.name}
                              </span>
                            </Button>
                            
                            {isExpanded && (
                              <div className="ml-6 space-y-1">
                                <Button
                                  variant={isActivePath(`/user/project/${project.id}/import`) ? "default" : "ghost"}
                                  size="sm"
                                  className={`w-full justify-start text-xs ${
                                    isActivePath(`/user/project/${project.id}/import`) 
                                      ? "bg-primary text-primary-foreground" 
                                      : "hover:bg-secondary"
                                  }`}
                                  onClick={() => navigate(`/user/project/${project.id}/import`)}
                                >
                                  <Upload className="h-3 w-3 mr-2" />
                                  Import Scripts
                                </Button>
                                <Button
                                  variant={isActivePath(`/user/project/${project.id}/test-lab`) ? "default" : "ghost"}
                                  size="sm"
                                  className={`w-full justify-start text-xs ${
                                    isActivePath(`/user/project/${project.id}/test-lab`) 
                                      ? "bg-primary text-primary-foreground" 
                                      : "hover:bg-secondary"
                                  }`}
                                  onClick={() => navigate(`/user/project/${project.id}/test-lab`)}
                                >
                                  <Clipboard className="h-3 w-3 mr-2" />
                                  Test Lab
                                </Button>
                                <Button
                                  variant={isActivePath(`/user/project/${project.id}/issues`) ? "default" : "ghost"}
                                  size="sm"
                                  className={`w-full justify-start text-xs ${
                                    isActivePath(`/user/project/${project.id}/issues`) 
                                      ? "bg-primary text-primary-foreground" 
                                      : "hover:bg-secondary"
                                  }`}
                                  onClick={() => navigate(`/user/project/${project.id}/issues`)}
                                >
                                  <AlertTriangle className="h-3 w-3 mr-2" />
                                  Issue Log
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${!sidebarOpen ? 'ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}