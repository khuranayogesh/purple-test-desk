import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import FoldersPage from "./pages/admin/FoldersPage";
import AddScriptPage from "./pages/admin/AddScriptPage";
import ScriptListingPage from "./pages/admin/ScriptListingPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import CreateProjectPage from "./pages/user/CreateProjectPage";
import ImportScriptsPage from "./pages/user/ImportScriptsPage";
import TestLabPage from "./pages/user/TestLabPage";
import IssueLogPage from "./pages/user/IssueLogPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            {/* Admin Routes */}
            <Route path="/admin/folders" element={<FoldersPage />} />
            <Route path="/admin/scripts/add" element={<AddScriptPage />} />
            <Route path="/admin/scripts" element={<ScriptListingPage />} />
            <Route path="/admin/projects" element={<ProjectsPage />} />
            
            {/* User Routes */}
            <Route path="/user/create-project" element={<CreateProjectPage />} />
            <Route path="/user/project/:projectId/import" element={<ImportScriptsPage />} />
            <Route path="/user/project/:projectId/test-lab" element={<TestLabPage />} />
            <Route path="/user/project/:projectId/issues" element={<IssueLogPage />} />
            
            {/* Default redirect */}
            <Route path="/" element={<CreateProjectPage />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;