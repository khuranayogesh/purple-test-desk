// Local storage utilities for the Regression Assistant
export interface User {
  username: string;
  password: string;
  userType: 'User' | 'Administrator';
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
}

export interface Script {
  id: string;
  scriptId: string;
  shortDescription: string;
  subfolderId: string;
  folderPath: string;
  testEnvironment: 'Online' | 'Batch' | 'Online & Batch';
  testType: 'Positive' | 'Negative';
  purpose: string;
  assumptions: string[];
  expectedResults: string;
  scriptDetails: string;
  screenshots: Screenshot[];
  createdAt: string;
}

export interface Screenshot {
  id: string;
  fileName: string;
  description: string;
  path: string;
}

export interface Project {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  importedScripts: ImportedScript[];
  issues: Issue[];
}

export interface ImportedScript extends Script {
  status: 'Pending' | 'Completed' | 'Issues';
  remarks?: string;
  additionalScreenshots?: Screenshot[];
  executionDate?: string;
  linkedIssues: string[];
}

export interface Issue {
  id: string;
  issueNumber: number;
  title: string;
  description: string;
  screenshot?: Screenshot;
  status: 'Open' | 'Fixed' | 'Reopened';
  linkedScripts: string[];
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AppData {
  users: User[];
  folders: Folder[];
  scripts: Script[];
  projects: Project[];
  currentUser?: User;
}

const DEFAULT_USERS: User[] = [
  { username: 'admin', password: 'admin', userType: 'Administrator' },
  { username: 'user01', password: 'user01', userType: 'User' }
];

export class StorageManager {
  private static readonly STORAGE_KEY = 'regression_assistant_data';

  static loadData(): AppData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          users: data.users || DEFAULT_USERS,
          folders: data.folders || [],
          scripts: data.scripts || [],
          projects: data.projects || [],
          currentUser: data.currentUser
        };
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    return {
      users: DEFAULT_USERS,
      folders: [],
      scripts: [],
      projects: []
    };
  }

  static saveData(data: AppData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear some data or use fewer/smaller screenshots.');
      }
      throw error;
    }
  }

  static authenticateUser(username: string, password: string): User | null {
    const data = this.loadData();
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      data.currentUser = user;
      this.saveData(data);
      return user;
    }
    return null;
  }

  static logout(): void {
    const data = this.loadData();
    data.currentUser = undefined;
    this.saveData(data);
  }

  static getCurrentUser(): User | null {
    const data = this.loadData();
    return data.currentUser || null;
  }

  static addFolder(folder: Folder): void {
    const data = this.loadData();
    data.folders.push(folder);
    this.saveData(data);
  }

  static updateFolder(folderId: string, updates: Partial<Folder>): void {
    const data = this.loadData();
    const index = data.folders.findIndex(f => f.id === folderId);
    if (index !== -1) {
      data.folders[index] = { ...data.folders[index], ...updates };
      this.saveData(data);
    }
  }

  static deleteFolder(folderId: string): void {
    const data = this.loadData();
    data.folders = data.folders.filter(f => f.id !== folderId && f.parentId !== folderId);
    this.saveData(data);
  }

  static addScript(script: Script): void {
    const data = this.loadData();
    data.scripts.push(script);
    this.saveData(data);
  }

  static updateScript(scriptId: string, updates: Partial<Script>): void {
    const data = this.loadData();
    const index = data.scripts.findIndex(s => s.id === scriptId);
    if (index !== -1) {
      data.scripts[index] = { ...data.scripts[index], ...updates };
      this.saveData(data);
    }
  }

  static deleteScript(scriptId: string): void {
    const data = this.loadData();
    data.scripts = data.scripts.filter(s => s.id !== scriptId);
    this.saveData(data);
  }

  static addProject(project: Project): void {
    const data = this.loadData();
    data.projects.push(project);
    this.saveData(data);
  }

  static updateProject(projectId: string, updates: Partial<Project>): void {
    const data = this.loadData();
    const index = data.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      data.projects[index] = { ...data.projects[index], ...updates };
      this.saveData(data);
    }
  }

  static deleteProject(projectId: string): void {
    const data = this.loadData();
    data.projects = data.projects.filter(p => p.id !== projectId);
    this.saveData(data);
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}