# Frontend Folder Structure

## Overview

This document defines the consistent folder structure for the frontend application. We follow a feature-based architecture where each domain has its own self-contained module, while keeping shared utilities in the existing src/ structure.

## Root Structure

```
src/
├── components/            # Shared components (shadcn/ui + common)
│   ├── ui/               # shadcn/ui components
│   ├── layouts/          # Shared layout components
│   └── common/           # Custom shared components
├── lib/                  # Shared utilities, API client, constants
├── types/                # Global type definitions
├── hooks/                # Shared custom hooks
├── features/             # Feature modules (domains)
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── resources/
│   └── access/
├── pages/                # Top-level page components (if needed)
└── app/                  # App configuration (main.tsx, App.tsx)
```

## Feature Module Structure

Each feature follows this consistent pattern:

```
features/{domain}/
├── components/           # Feature-specific components
│   ├── {Domain}List.tsx
│   ├── {Domain}Detail.tsx
│   ├── {Domain}Form.tsx
│   └── sidebars/        # Feature-specific sidebars
├── pages/               # Page components for this feature
│   ├── {Domain}ListPage.tsx
│   └── {Domain}DetailPage.tsx
├── hooks/               # Feature-specific hooks
├── store/               # Feature-specific state management
│   └── {domain}Store.ts
├── types/               # Feature-specific types
│   └── {domain}.types.ts
├── services/            # API calls and business logic
│   └── {domain}.service.ts
└── layouts/             # Feature-specific layouts
    └── {Domain}Layout.tsx
```

## Rules and Conventions

### 1. No Barrel Exports

- Use explicit imports to avoid circular dependencies
- Import from specific files, not from index.ts files

### 2. Shared vs Feature-Specific

- **Shared**: `src/components/`, `src/lib/`, `src/types/`, `src/hooks/`
- **Feature-specific**: Everything in `features/{domain}/`
- Cross-feature dependencies should go through shared utilities

### 3. Import Paths

```typescript
// Shared utilities and components
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { User } from "@/types/user";

// Feature-specific imports
import { useProjectStore } from "@/features/projects/store/projectStore";
import { ProjectFormData } from "@/features/projects/types/project.types";
```

### 4. Migration Plan

1. Move stores from `src/store/` to `features/{domain}/store/`
2. Move types from `src/lib/types.ts` to appropriate feature types
3. Move layouts from `src/components/layouts/` to appropriate features
4. Move sidebars from `src/components/sidebars/` to appropriate features
5. Update all imports
6. Remove barrel exports

This structure ensures:

- ✅ Leverages existing shared structure
- ✅ Clear feature boundaries
- ✅ No circular import issues
- ✅ Easy to find and modify code
