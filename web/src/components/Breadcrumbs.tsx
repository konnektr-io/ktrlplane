import { useLocation, useParams, Link } from 'react-router-dom';
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { useOrganizationStore } from "../features/organizations/store/organizationStore";
import { useProjectStore } from "../features/projects/store/projectStore";
import { useResourceStore } from "../features/resources/store/resourceStore";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const { organizations } = useOrganizationStore();
  const { projects } = useProjectStore();
  const { resources } = useResourceStore();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0) {
      return breadcrumbs;
    }

    // Handle different route patterns
    if (pathSegments[0] === "organizations" && params.orgId) {
      const org = organizations.find((o) => o.org_id === params.orgId);
      breadcrumbs.push({
        label: org?.name || "Organization",
        href: `/organizations/${params.orgId}`,
      });

      if (pathSegments[2] === "access") {
        breadcrumbs.push({
          label: "Access & Permissions",
          isActive: true,
        });
      } else if (pathSegments[2] === "projects") {
        breadcrumbs.push({
          label: "Projects",
          isActive: true,
        });
      } else if (pathSegments[2] === "billing") {
        breadcrumbs.push({
          label: "Billing",
          isActive: true,
        });
      } else if (pathSegments[2] === "settings") {
        breadcrumbs.push({
          label: "Settings",
          isActive: true,
        });
      }
    }

    if (pathSegments[0] === "projects" && params.projectId) {
      const project = projects.find((p) => p.project_id === params.projectId);

      breadcrumbs.push({
        label: project?.name || "Project",
        href: `/projects/${params.projectId}`,
      });

      if (pathSegments[2] === "resources") {
        if (params.resourceId) {
          const resource = resources.find(
            (r) => r.resource_id === params.resourceId
          );
          breadcrumbs.push({
            label: resource?.name || "Resource",
            href: `/projects/${params.projectId}/resources/${params.resourceId}`,
          });

          if (pathSegments[4] === "access") {
            breadcrumbs.push({
              label: "Access & Permissions",
              isActive: true,
            });
          } else if (pathSegments[4] === "logs") {
            breadcrumbs.push({
              label: "Logs",
              isActive: true,
            });
          } else if (pathSegments[4] === "monitoring") {
            breadcrumbs.push({
              label: "Monitoring",
              isActive: true,
            });
          } else if (pathSegments[4] === "settings") {
            breadcrumbs.push({
              label: "Settings",
              isActive: true,
            });
          }
        } else {
          breadcrumbs.push({
            label: "Resources",
            isActive: true,
          });
        }
      } else if (pathSegments[2] === "access") {
        breadcrumbs.push({
          label: "Access & Permissions",
          isActive: true,
        });
      } else if (pathSegments[2] === "billing") {
        breadcrumbs.push({
          label: "Billing",
          isActive: true,
        });
      } else if (pathSegments[2] === "settings") {
        breadcrumbs.push({
          label: "Settings",
          isActive: true,
        });
      }
    }

    if (pathSegments[0] === "projects" && !params.projectId) {
      breadcrumbs.push({
        label: "All Projects",
        isActive: true,
      });
    }

    // Handle create access routes
    if (pathSegments.includes("create-access")) {
      breadcrumbs.push({
        label: "Grant Access",
        isActive: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => [
          index > 0 && <BreadcrumbSeparator key={`separator-${index}`} />,
          <BreadcrumbItem key={`item-${index}`}>
            {item.href && !item.isActive ? (
              <BreadcrumbLink asChild>
                <Link to={item.href}>
                  {index === 0 ? <Home className="h-4 w-4" /> : item.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>
                {index === 0 ? <Home className="h-4 w-4" /> : item.label}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>,
        ])}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
