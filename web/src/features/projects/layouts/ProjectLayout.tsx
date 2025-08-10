import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import AppLayout from '@/components/AppLayout';
import ProjectSidebarNav from '../components/sidebars/ProjectSidebarNav';

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { fetchProjectById, lastProjectId, setCurrentProject, projects } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
    } else if (lastProjectId && !projectId) {
      // Auto-navigate to last project if no project is selected
      navigate(`/project/${lastProjectId}/resources`);
      return;
    }
  }, [projectId, fetchProjectById, lastProjectId, navigate]);

  // Auto-redirect to last project on login
  useEffect(() => {
    if (!projectId && lastProjectId && projects.length > 0) {
      const lastProject = projects.find(p => p.project_id === lastProjectId);
      if (lastProject) {
        setCurrentProject(lastProject);
        navigate(`/project/${lastProjectId}/resources`);
      }
    }
  }, [projects, lastProjectId, projectId, navigate, setCurrentProject]);

  return (
    <AppLayout 
      sidebarContent={<ProjectSidebarNav />}
      showProjectSelector={true}
    />
  );
}
