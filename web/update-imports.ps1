# PowerShell script to update all import paths after folder restructuring

Write-Host "Starting import path updates..." -ForegroundColor Green

# Function to update imports in a file
function Update-FileImports {
    param($FilePath, $Updates)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $originalContent = $content
        
        foreach ($update in $Updates) {
            $content = $content -replace [regex]::Escape($update.From), $update.To
        }
        
        if ($content -ne $originalContent) {
            Set-Content $FilePath $content -NoNewline
            Write-Host "Updated: $FilePath" -ForegroundColor Yellow
        }
    }
}

# Define import updates
$importUpdates = @(
    @{ From = "from '@/store/projectStore'"; To = "from '../store/projectStore'" },
    @{ From = "from '@/store/organizationStore'"; To = "from '../store/organizationStore'" },
    @{ From = "from '@/store/resourceStore'"; To = "from '../store/resourceStore'" },
    @{ From = "from '@/lib/types'"; To = "from '../types/project.types'" },
    @{ From = "import { useProjectStore } from '@/store/projectStore'"; To = "import { useProjectStore } from '../../store/projectStore'" },
    @{ From = "import { useOrganizationStore } from '@/store/organizationStore'"; To = "import { useOrganizationStore } from '../../store/organizationStore'" },
    @{ From = "import { useResourceStore } from '@/store/resourceStore'"; To = "import { useResourceStore } from '../../store/resourceStore'" }
)

# Update feature components
Write-Host "Updating feature components..." -ForegroundColor Cyan

# Update project pages
$projectPages = @(
    "src/features/projects/pages/ProjectDetailPage.tsx",
    "src/features/projects/pages/ProjectListPage.tsx",
    "src/features/projects/pages/ProjectAccessPage.tsx"
)

foreach ($file in $projectPages) {
    $fullPath = Join-Path "c:\Users\NRaes\Dev\ktrlplane\web" $file
    $pageUpdates = @(
        @{ From = "from '@/store/projectStore'"; To = "from '../store/projectStore'" },
        @{ From = "from '@/store/organizationStore'"; To = "from '../store/organizationStore'" }
    )
    Update-FileImports $fullPath $pageUpdates
}

# Update resource pages
$resourcePages = @(
    "src/features/resources/pages/ResourceDetailPage.tsx",
    "src/features/resources/pages/ResourcesPage.tsx",
    "src/features/resources/pages/ResourceAccessPage.tsx"
)

foreach ($file in $resourcePages) {
    $fullPath = Join-Path "c:\Users\NRaes\Dev\ktrlplane\web" $file
    $pageUpdates = @(
        @{ From = "from '@/store/resourceStore'"; To = "from '../store/resourceStore'" },
        @{ From = "from '@/store/projectStore'"; To = "from '../store/projectStore'" }
    )
    Update-FileImports $fullPath $pageUpdates
}

# Update organization pages
$orgPages = @(
    "src/features/organizations/pages/OrganizationDetailPage.tsx",
    "src/features/organizations/pages/OrganizationListPage.tsx",
    "src/features/organizations/pages/OrganizationAccessPage.tsx"
)

foreach ($file in $orgPages) {
    $fullPath = Join-Path "c:\Users\NRaes\Dev\ktrlplane\web" $file
    if (Test-Path $fullPath) {
        $pageUpdates = @(
            @{ From = "from '@/store/organizationStore'"; To = "from '../store/organizationStore'" },
            @{ From = "from '@/store/projectStore'"; To = "from '../store/projectStore'" }
        )
        Update-FileImports $fullPath $pageUpdates
    }
}

# Update sidebar components
Write-Host "Updating sidebar components..." -ForegroundColor Cyan

$sidebarFiles = @(
    "src/features/projects/components/sidebars/ProjectSidebarNav.tsx",
    "src/features/organizations/components/sidebars/OrganizationSidebarNav.tsx",
    "src/features/resources/components/sidebars/ResourceSidebarNav.tsx"
)

foreach ($file in $sidebarFiles) {
    $fullPath = Join-Path "c:\Users\NRaes\Dev\ktrlplane\web" $file
    if (Test-Path $fullPath) {
        $sidebarUpdates = @(
            @{ From = "import { useProjectStore } from '@/store/projectStore'"; To = "import { useProjectStore } from '../../store/projectStore'" },
            @{ From = "import { useOrganizationStore } from '@/store/organizationStore'"; To = "import { useOrganizationStore } from '../../store/organizationStore'" },
            @{ From = "import { useResourceStore } from '@/store/resourceStore'"; To = "import { useResourceStore } from '../../store/resourceStore'" }
        )
        Update-FileImports $fullPath $sidebarUpdates
    }
}

# Update layout components
Write-Host "Updating layout components..." -ForegroundColor Cyan

$layoutFiles = @(
    "src/features/projects/layouts/ProjectLayout.tsx",
    "src/features/organizations/layouts/OrganizationLayout.tsx",
    "src/features/resources/layouts/ResourceLayout.tsx"
)

foreach ($file in $layoutFiles) {
    $fullPath = Join-Path "c:\Users\NRaes\Dev\ktrlplane\web" $file
    if (Test-Path $fullPath) {
        # Already updated these files earlier
        Write-Host "Layout file already updated: $file" -ForegroundColor Green
    }
}

# Update main App.tsx
Write-Host "Updating App.tsx..." -ForegroundColor Cyan
$appUpdates = @(
    @{ From = "import ProjectLayout from './components/layouts/ProjectLayout'"; To = "import ProjectLayout from './features/projects/layouts/ProjectLayout'" },
    @{ From = "import OrganizationLayout from './components/layouts/OrganizationLayout'"; To = "import OrganizationLayout from './features/organizations/layouts/OrganizationLayout'" },
    @{ From = "import ResourceLayout from './components/layouts/ResourceLayout'"; To = "import ResourceLayout from './features/resources/layouts/ResourceLayout'" }
)
Update-FileImports "c:\Users\NRaes\Dev\ktrlplane\web\src\App.tsx" $appUpdates

# Update AppHeader to use feature stores correctly
Write-Host "Updating AppHeader.tsx..." -ForegroundColor Cyan
$headerUpdates = @(
    @{ From = "import { useOrganizationStore } from '@/store/organizationStore'"; To = "import { useOrganizationStore } from '../features/organizations/store/organizationStore'" }
)
Update-FileImports "c:\Users\NRaes\Dev\ktrlplane\web\src\components\AppHeader.tsx" $headerUpdates

Write-Host "Import path updates completed!" -ForegroundColor Green
