import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProjectStore } from "../store/projectStore";

interface ProjectAutoRedirectProps {
  children: React.ReactNode;
}

export default function ProjectAutoRedirect({
  children,
}: ProjectAutoRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, isLoadingList, fetchProjects, lastProjectId } =
    useProjectStore();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only fetch if projects are not loaded
    if (projects.length === 0 && !isLoadingList) {
      fetchProjects();
    }
  }, [projects.length, isLoadingList, fetchProjects]);

  useEffect(() => {
    // Prevent redirect loops
    if (hasRedirected.current) return;
    if (isLoadingList) return;
    // Only redirect from root or /projects
    const isRoot = location.pathname === "/";
    const isProjects = location.pathname === "/projects";
    if (!isRoot && !isProjects) return;
    if (projects.length === 1) {
      hasRedirected.current = true;
      navigate(`/projects/${projects[0].project_id}`, { replace: true });
      return;
    }
    if (projects.length > 1 && lastProjectId) {
      const lastProject = projects.find((p) => p.project_id === lastProjectId);
      if (lastProject) {
        hasRedirected.current = true;
        navigate(`/projects/${lastProjectId}`, { replace: true });
        return;
      }
    }
    // If no projects or no valid last project, stay on /projects
  }, [projects, isLoadingList, lastProjectId, location.pathname, navigate]);

  // Show loading if fetching
  if (isLoadingList) {
    return <div>Loading projects...</div>;
  }

  return <>{children}</>;
}
