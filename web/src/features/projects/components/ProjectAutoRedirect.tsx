import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProjects } from "../hooks/useProjectApi";

interface ProjectAutoRedirectProps {
  children: React.ReactNode;
}

export default function ProjectAutoRedirect({
  children,
}: ProjectAutoRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: projects = [], isLoading } = useProjects();
  // lastProjectId logic: fallback to first project if needed
  const lastProjectId = projects.length > 0 ? projects[0].project_id : null;
  const hasRedirected = useRef(false);

  // No need to manually fetch, React Query handles it

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isLoading) return;
    const isRoot = location.pathname === "/";
    const isProjects = location.pathname === "/projects";
    if (!isRoot && !isProjects) return;
    if (projects.length === 1) {
      hasRedirected.current = true;
      navigate(`/projects/${projects[0].project_id}`, { replace: true });
      return;
    }
    if (projects.length > 1 && lastProjectId) {
      hasRedirected.current = true;
      navigate(`/projects/${lastProjectId}`, { replace: true });
      return;
    }
    // If no projects or no valid last project, stay on /projects
  }, [projects, isLoading, lastProjectId, location.pathname, navigate]);

  // Show loading if fetching
  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  return <>{children}</>;
}
