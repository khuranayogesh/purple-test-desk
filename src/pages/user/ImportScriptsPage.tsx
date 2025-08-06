import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StorageManager, Script, Project, ImportedScript, Folder } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search, Filter, Check, FileText } from 'lucide-react';

export default function ImportScriptsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [importedScriptIds, setImportedScriptIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  useEffect(() => {
    filterScripts();
  }, [scripts, selectedFolder, searchTerm]);

  const loadData = () => {
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
    setScripts(data.scripts);
    setFolders(data.folders);
    
    // Track which scripts are already imported
    const imported = new Set(currentProject.importedScripts?.map(s => s.id) || []);
    setImportedScriptIds(imported);
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

  const handleImportScript = (script: Script) => {
    if (!project) return;

    // Create imported script with default status
    const importedScript: ImportedScript = {
      ...script,
      status: 'Pending',
      linkedIssues: []
    };

    // Update project with imported script
    const updatedProject = {
      ...project,
      importedScripts: [...(project.importedScripts || []), importedScript]
    };

    StorageManager.updateProject(project.id, updatedProject);
    
    toast({
      title: "Success",
      description: `Script "${script.scriptId}" imported successfully`
    });

    // Update local state
    setImportedScriptIds(prev => new Set([...prev, script.id]));
    setProject(updatedProject);
  };

  const folderOptions = getFolderOptions();

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
        <h1 className="text-3xl font-bold text-foreground">Import Test Scripts</h1>
        <p className="text-muted-foreground">
          Project: <span className="font-medium">{project.name}</span>
        </p>
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

      {/* Import Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{scripts.length}</div>
              <div className="text-xs text-muted-foreground">Total Scripts</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredScripts.length}</div>
              <div className="text-xs text-muted-foreground">Filtered Results</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importedScriptIds.size}</div>
              <div className="text-xs text-muted-foreground">Already Imported</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {filteredScripts.filter(s => !importedScriptIds.has(s.id)).length}
              </div>
              <div className="text-xs text-muted-foreground">Available to Import</div>
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
              {scripts.length === 0 ? 'No scripts available' : 'No scripts match your filters'}
            </h3>
            <p className="text-muted-foreground">
              {scripts.length === 0 
                ? 'Scripts need to be created in the Admin dashboard first'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map((script) => {
            const isImported = importedScriptIds.has(script.id);
            
            return (
              <Card key={script.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{script.scriptId}</CardTitle>
                        <Badge variant="outline">{script.testType}</Badge>
                        <Badge variant="secondary">{script.testEnvironment}</Badge>
                        {isImported && (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{script.shortDescription}</p>
                      <p className="text-sm text-muted-foreground">📁 {script.folderPath}</p>
                      {script.purpose && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          Purpose: {script.purpose}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={isImported ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleImportScript(script)}
                        disabled={isImported}
                        className={isImported ? "bg-green-100 text-green-700" : "bg-primary hover:bg-primary-glow"}
                      >
                        {isImported ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Already Imported
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(script.screenshots.length > 0 || script.assumptions.length > 0) && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {script.screenshots.length > 0 && (
                        <span>📷 {script.screenshots.length} screenshot(s)</span>
                      )}
                      {script.assumptions.length > 0 && (
                        <span>📝 {script.assumptions.length} assumption(s)</span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}