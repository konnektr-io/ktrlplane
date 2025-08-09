## 2. Frontend (React + Vite + shadcn + Zustand + Axios)

**Project Setup:**

```bash
# 1. Create Vite React TS project
npm create vite@latest ktrlplane-frontend --template react-ts
cd ktrlplane-frontend

# 2. Install dependencies
pnpm add axios zustand react-router-dom react-hook-form @hookform/resolvers zod lucide-react class-variance-authority clsx tailwind-merge tailwindcss-animate

# 3. Install Shadcn UI
pnpm add -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
# Configure tailwind.config.js (follow shadcn docs: https://ui.shadcn.com/docs/installation/vite)
# Configure globals.css (follow shadcn docs)
# Add shadcn components we'll use
pnpm dlx shadcn@latest add button card table dropdown-menu input label select tabs toast dialog form sidebar badge skeleton textarea sonner

# 4. Start dev server
npm run dev
```

**File Structure:**

```
web/
├── src/
│   ├── App.tsx             # Main router and layout setup
│   ├── main.tsx            # Entry point
│   ├── globals.css         # Global styles (from shadcn)
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── Layout.tsx        # Main layout with Sidebar and Header
│   │   ├── Header.tsx        # Top navigation bar
│   │   ├── SidebarNav.tsx    # Sidebar navigation component
│   │   ├── ProtectedRoute.tsx # Wrapper for authenticated routes
│   │   ├── ui/               # Shadcn UI components (auto-generated)
│   │   └── common/           # Reusable common components (e.g., DataTable, StatusBadge)
│   │       ├── DataTable.tsx
│   │       └── StatusBadge.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx # Placeholder login page
│   │   │   └── callback.tsx  # Auth0 callback handler (Placeholder)
│   │   ├── projects/
│   │   │   ├── pages/
│   │   │   │   ├── ProjectListPage.tsx
│   │   │   │   └── ProjectDetailPage.tsx
│   │   │   └── components/
│   │   │       ├── ProjectForm.tsx
│   │   │       └── ProjectSettingsTab.tsx
│   │   │       └── ProjectRbacTab.tsx    # Placeholder
│   │   ├── resources/
│   │   │   ├── pages/
│   │   │   │   └── ResourceDetailPage.tsx # Contains settings, etc.
│   │   │   └── components/
│   │   │       ├── ResourceTable.tsx     # Used in ProjectDetailPage
│   │   │       ├── ResourceForm.tsx
│   │   │       ├── ResourceSettingsTab.tsx
│   │   │       └── ResourceLogsTab.tsx   # Placeholder
│   │   └── billing/ # Placeholder
│   │       └── pages/
│   │           └── BillingPage.tsx
│   ├── hooks/
│   │   └── useAuth.ts        # Auth hook (Placeholder)
│   ├── lib/
│   │   ├── axios.ts          # Configured Axios instance
│   │   ├── utils.ts          # Shadcn utils (cn function)
│   │   └── types.ts          # Shared TypeScript types/interfaces
│   │   └── zodSchemas.ts     # Zod validation schemas
│   ├── pages/                # Simple top-level page wrappers if needed
│   │   └── NotFoundPage.tsx
│   └── store/
│       ├── authStore.ts      # Zustand store for authentication state
│       ├── projectStore.ts   # Zustand store for projects
│       └── resourceStore.ts  # Zustand store for resources
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.ts
```

**Selected Code Snippets:**

**`src/lib/axios.ts`:**

```typescript
import axios from "axios";
import { useAuthStore } from "@/store/authStore"; // Assuming authStore handles tokens

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1", // Use env var
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token; // Get token from Zustand store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for error handling (e.g., redirect on 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., clear token, redirect to login
      useAuthStore.getState().logout(); // Example logout action
      console.error("Unauthorized access - logging out.");
      // window.location.href = '/login'; // Or use react-router navigate
    }
    // You might want to show a toast notification here for other errors
    return Promise.reject(error);
  }
);

export default apiClient;
```

**`src/lib/types.ts`:** (Mirroring Go models)

```typescript
import { z } from "zod";
import {
  projectSchema,
  resourceSchema,
  createProjectSchema,
  updateProjectSchema,
  createResourceSchema,
  updateResourceSchema,
} from "./zodSchemas";

export type Project = z.infer<typeof projectSchema>;
export type Resource = z.infer<typeof resourceSchema>;

export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type CreateResourceData = z.infer<typeof createResourceSchema>;
export type UpdateResourceData = z.infer<typeof updateResourceSchema>;

// Example User type (adapt based on Auth0 claims)
export interface User {
  id: string; // subject from token
  email?: string;
  name?: string;
  picture?: string;
}
```

**`src/lib/zodSchemas.ts`:**

```typescript
import { z } from "zod";

// Basic validation for helm values being parsable JSON
const jsonString = z
  .string()
  .refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Helm values must be valid JSON" }
  )
  .optional()
  .default("{}");

const helmValuesSchema = z.record(z.any()).optional().default({}); // More flexible if backend handles agtype conversion well

export const projectSchema = z.object({
  project_id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.string(),
  created_at: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)), // Handle string or date
  updated_at: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
});

export const resourceSchema = z.object({
  resource_id: z.string(),
  project_id: z.string(), // Included from backend response context
  name: z.string().min(1, "Name is required"),
  type: z.string(), // e.g., "GraphDatabase", "Flow"
  status: z.string(),
  helm_values: z.any().transform((val) => {
    // Expect raw JSON, parse for display/edit
    try {
      if (typeof val === "string") return JSON.parse(val || "{}");
      if (typeof val === "object") return val ?? {}; // Already an object
      return {};
    } catch {
      return {}; // Default empty object if parsing fails
    }
  }),
  created_at: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
  updated_at: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
  error_message: z.string().optional(),
  access_url: z.string().optional(),
});

// --- Form Schemas ---

export const createProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial(); // All fields optional for update

export const createResourceSchema = z.object({
  name: z.string().min(3, "Resource name must be at least 3 characters"),
  type: z.enum(["GraphDatabase", "Flow"]), // Add other types as needed
  // Use a textarea for JSON initially, consider specific fields later
  helm_values: jsonString,
});

export const updateResourceSchema = z.object({
  name: z
    .string()
    .min(3, "Resource name must be at least 3 characters")
    .optional(),
  // Use a textarea for JSON initially
  helm_values: jsonString,
});
```

**`src/store/projectStore.ts`:** (Example Zustand Store)

```typescript
import { create } from "zustand";
import { Project } from "@/lib/types";
import apiClient from "@/lib/axios";
import { toast } from "sonner"; // Using sonner for notifications

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
  }) => Promise<Project | null>;
  updateProject: (
    projectId: string,
    data: Partial<{ name: string; description: string }>
  ) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoadingList: false,
  isLoadingDetail: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoadingList: true, error: null });
    try {
      const response = await apiClient.get<Project[]>("/projects");
      // Ensure dates are Date objects
      const projectsWithDates = response.data.map((p) => ({
        ...p,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at),
      }));
      set({ projects: projectsWithDates, isLoadingList: false });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to fetch projects";
      toast.error(errorMsg);
      set({ error: errorMsg, isLoadingList: false });
    }
  },

  fetchProjectById: async (projectId: string) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
      const projectWithDates = {
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
      set({ currentProject: projectWithDates, isLoadingDetail: false });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        `Failed to fetch project ${projectId}`;
      toast.error(errorMsg);
      set({ error: errorMsg, isLoadingDetail: false, currentProject: null }); // Clear current if fetch fails
    }
  },

  createProject: async (data) => {
    // Consider adding loading state for creation
    set({ error: null });
    try {
      const response = await apiClient.post<Project>("/projects", data);
      const newProject = {
        // Ensure dates are Date objects
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
      set((state) => ({ projects: [...state.projects, newProject] }));
      toast.success(`Project "${newProject.name}" created successfully.`);
      return newProject;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to create project";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return null;
    }
  },

  updateProject: async (projectId, data) => {
    set({ error: null });
    try {
      const response = await apiClient.put<Project>(
        `/projects/${projectId}`,
        data
      );
      const updatedProject = {
        // Ensure dates are Date objects
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
      set((state) => ({
        projects: state.projects.map((p) =>
          p.project_id === projectId ? updatedProject : p
        ),
        currentProject:
          state.currentProject?.project_id === projectId
            ? updatedProject
            : state.currentProject,
      }));
      toast.success(`Project "${updatedProject.name}" updated.`);
      return updatedProject;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to update project";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return null;
    }
  },

  deleteProject: async (projectId: string): Promise<boolean> => {
    set({ error: null });
    try {
      await apiClient.delete(`/projects/${projectId}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.project_id !== projectId),
        currentProject:
          state.currentProject?.project_id === projectId
            ? null
            : state.currentProject,
      }));
      toast.success(`Project deletion initiated.`);
      return true;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to delete project";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return false;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
}));
```

**`src/store/resourceStore.ts`:** (Similar structure for resources, scoped by project)

```typescript
import { create } from "zustand";
import { Resource, CreateResourceData, UpdateResourceData } from "@/lib/types";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

interface ResourceState {
  resources: Resource[];
  currentResource: Resource | null; // For detail view
  isLoading: boolean;
  error: string | null;
  fetchResources: (projectId: string) => Promise<void>;
  fetchResourceById: (projectId: string, resourceId: string) => Promise<void>;
  createResource: (
    projectId: string,
    data: CreateResourceData
  ) => Promise<Resource | null>;
  updateResource: (
    projectId: string,
    resourceId: string,
    data: UpdateResourceData
  ) => Promise<Resource | null>;
  deleteResource: (projectId: string, resourceId: string) => Promise<boolean>;
  setCurrentResource: (resource: Resource | null) => void;
  clearResources: () => void; // Clear when changing projects
}

// Helper to parse resource dates
const parseResourceDates = (resource: Resource): Resource => ({
  ...resource,
  created_at: new Date(resource.created_at),
  updated_at: new Date(resource.updated_at),
  // Ensure helm_values is an object after potential string fetch
  helm_values:
    typeof resource.helm_values === "string"
      ? JSON.parse(resource.helm_values || "{}")
      : resource.helm_values ?? {},
});

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: [],
  currentResource: null,
  isLoading: false,
  error: null,

  clearResources: () =>
    set({
      resources: [],
      currentResource: null,
      isLoading: false,
      error: null,
    }),

  fetchResources: async (projectId) => {
    if (!projectId) return;
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Resource[]>(
        `/projects/${projectId}/resources`
      );
      const resourcesWithDates = response.data.map(parseResourceDates);
      set({ resources: resourcesWithDates, isLoading: false });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to fetch resources";
      toast.error(errorMsg);
      set({ error: errorMsg, isLoading: false, resources: [] });
    }
  },

  fetchResourceById: async (projectId, resourceId) => {
    if (!projectId || !resourceId) return;
    set({ isLoading: true, error: null }); // Could use a different loading flag for detail
    try {
      const response = await apiClient.get<Resource>(
        `/projects/${projectId}/resources/${resourceId}`
      );
      const resourceWithDates = parseResourceDates(response.data);
      set({ currentResource: resourceWithDates, isLoading: false });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        `Failed to fetch resource ${resourceId}`;
      toast.error(errorMsg);
      set({ error: errorMsg, isLoading: false, currentResource: null });
    }
  },

  createResource: async (projectId, data) => {
    if (!projectId) return null;
    set({ error: null }); // Add loading state if needed
    try {
      // Prepare data: ensure helm_values is a JSON string for the backend
      const payload = {
        ...data,
        helm_values:
          typeof data.helm_values === "object"
            ? JSON.stringify(data.helm_values)
            : data.helm_values,
      };
      const response = await apiClient.post<Resource>(
        `/projects/${projectId}/resources`,
        payload
      );
      const newResource = parseResourceDates(response.data);
      set((state) => ({ resources: [...state.resources, newResource] }));
      toast.success(`Resource "${newResource.name}" created successfully.`);
      return newResource;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to create resource";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return null;
    }
  },

  updateResource: async (projectId, resourceId, data) => {
    if (!projectId || !resourceId) return null;
    set({ error: null }); // Add loading state if needed
    try {
      // Prepare data: ensure helm_values is a JSON string if it's an object
      const payload = { ...data };
      if (typeof payload.helm_values === "object") {
        payload.helm_values = JSON.stringify(payload.helm_values);
      }

      const response = await apiClient.put<Resource>(
        `/projects/${projectId}/resources/${resourceId}`,
        payload
      );
      const updatedResource = parseResourceDates(response.data);
      set((state) => ({
        resources: state.resources.map((r) =>
          r.resource_id === resourceId ? updatedResource : r
        ),
        currentResource:
          state.currentResource?.resource_id === resourceId
            ? updatedResource
            : state.currentResource,
      }));
      toast.success(`Resource "${updatedResource.name}" updated.`);
      return updatedResource;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to update resource";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return null;
    }
  },

  deleteResource: async (projectId, resourceId): Promise<boolean> => {
    if (!projectId || !resourceId) return false;
    set({ error: null });
    try {
      await apiClient.delete(`/projects/${projectId}/resources/${resourceId}`);
      set((state) => ({
        resources: state.resources.filter((r) => r.resource_id !== resourceId),
        currentResource:
          state.currentResource?.resource_id === resourceId
            ? null
            : state.currentResource,
      }));
      toast.success(`Resource deletion initiated.`);
      return true;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to delete resource";
      toast.error(errorMsg);
      set({ error: errorMsg });
      return false;
    }
  },

  setCurrentResource: (resource) => {
    set({ currentResource: resource });
  },
}));
```

**`src/App.tsx`:**

```typescript
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Layout from "@/components/Layout";
import ProjectListPage from "@/features/projects/pages/ProjectListPage";
import ProjectDetailPage from "@/features/projects/pages/ProjectDetailPage";
import ResourceDetailPage from "@/features/resources/pages/ResourceDetailPage";
import LoginPage from "@/features/auth/LoginPage";
import AuthCallbackPage from "@/features/auth/callback"; // Placeholder
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner"; // For toast notifications

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallbackPage />} />{" "}
          {/* Auth0 Callback */}
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {" "}
              {/* Layout wraps protected pages */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route
                path="/projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route
                path="/projects/:projectId/resources/:resourceId"
                element={<ResourceDetailPage />}
              />
              {/* Add other routes like /billing, /settings here */}
            </Route>
          </Route>
          {/* Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <Toaster richColors position="top-right" /> {/* Toast container */}
    </>
  );
}

export default App;
```

**`src/components/Layout.tsx`:**

```typescript
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header"; // Placeholder Header
import SidebarNav from "./SidebarNav"; // Placeholder Sidebar

export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r dark:border-neutral-800 hidden md:block">
        <SidebarNav />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Child routes render here */}
        </main>
      </div>
    </div>
  );
}
```

**`src/components/SidebarNav.tsx`:** (Basic Example using shadcn/sidebar structure concepts)

```typescript
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, FolderKanban /* Settings, CreditCard */ } from "lucide-react"; // Icons

// Define navigation items
const navItems = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  // { href: '/billing', label: 'Billing', icon: CreditCard },
  // { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <Link to="/" className="flex items-center space-x-2 px-2 mb-4">
        {/* Placeholder Logo/Brand */}
        <Home className="h-6 w-6" />
        <span className="font-bold text-lg">Ktrlplane</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "font-semibold"
              )}
              asChild // Important: Allows Button to wrap Link correctly
            >
              <Link to={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
      {/* Footer or User section could go here */}
    </div>
  );
}
```

**`src/features/projects/pages/ProjectListPage.tsx`:** (Example List Page)

```typescript
import React, { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { Project } from "@/lib/types";
import { columns } from "./_components/columns"; // Define react-table columns separately
import { DataTable } from "@/components/common/DataTable"; // Reusable DataTable component
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import ProjectForm from "../components/ProjectForm"; // Create/Edit Form

export default function ProjectListPage() {
  const { projects, isLoadingList, fetchProjects } = useProjectStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false); // Close dialog on successful creation
    fetchProjects(); // Refetch list
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
            {/* Footer removed as form handles submission/cancel */}
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        isLoading={isLoadingList}
        filterColumnId="name" // Which column to use for global filtering
        filterPlaceholder="Filter projects by name..."
      />
    </div>
  );
}
```

**`src/features/projects/pages/_components/columns.tsx`:** (Example `react-table` column definitions)

```typescript
"use client"; // Required for react-table v8 actions

import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Link
          to={`/projects/${project.project_id}`}
          className="font-medium hover:underline"
        >
          {project.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      // Basic status coloring - enhance in StatusBadge component
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      if (status === "Active") variant = "default"; // Like success
      if (status === "Deleting") variant = "destructive";

      return (
        <Badge
          variant={variant}
          className={cn(
            variant === "default" && "bg-green-500 hover:bg-green-600"
          )}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground truncate max-w-xs">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.created_at;
      return (
        <div className="text-sm">
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(project.project_id)}
            >
              Copy Project ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/projects/${project.project_id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {/* Placeholder: Edit action (could open a Dialog with ProjectForm) */}
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">
              {/* Placeholder: Delete action (could open confirmation Dialog) */}
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

**`src/features/projects/components/ProjectForm.tsx`:** (Example Form using RHF, Zod, Shadcn)

```typescript
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectData, createProjectSchema } from "@/lib/zodSchemas"; // Use update schema if editing
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

interface ProjectFormProps {
  // project?: Project; // Pass existing project data if editing
  onSuccess: (project: any) => void;
  onCancel: () => void;
}

export default function ProjectForm({
  /* project, */ onSuccess,
  onCancel,
}: ProjectFormProps) {
  // const isEditMode = !!project;
  const { createProject /*, updateProject */ } = useProjectStore(); // Add updateProject for editing

  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema), // Use update schema if isEditMode
    defaultValues: {
      name: /* project?.name ?? */ "",
      description: /* project?.description ?? */ "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: CreateProjectData) => {
    try {
      // if (isEditMode && project) {
      //   const updated = await updateProject(project.project_id, data);
      //   if (updated) onSuccess(updated);
      // } else {
      const created = await createProject(data);
      if (created) onSuccess(created);
      // }
    } catch (error) {
      // Error handling is likely done in the store, but catch specific form errors if needed
      toast.error("An unexpected error occurred in the form submission.");
      console.error("Project form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of what this project is for."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {
              isSubmitting
                ? "Saving..."
                : /* isEditMode ? */ "Save Changes" /* : "Create Project" */
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**Schema-driven Forms Idea:**

For `helm_values`, instead of a simple `Textarea`, you could:

1. **Store a JSON Schema:** Alongside the resource type definition (maybe in your AGE model or a config map), store a JSON Schema describing the expected `helm_values` for that resource type (e.g., `GraphDatabase`).
2. **Fetch Schema:** When rendering the `ResourceForm`, fetch this schema.
3. **Use a Form Generator:** Use a library like `@rjsf/core` (React JSON Schema Form) along with a theme like `@rjsf/shadcn` (you might need to create this theme or adapt an existing one) to automatically generate the form fields based on the fetched schema.
4. **RHF Integration:** Integrate the schema-generated form with `react-hook-form` for validation and submission state.

This adds complexity but makes the UI highly adaptable to new resource types and configuration changes without manual frontend updates for every parameter. Start with the `Textarea` and evolve if needed.

---
