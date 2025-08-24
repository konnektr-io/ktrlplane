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
    }
  }, [projectId, fetchProjectById]);

  return (
    <AppLayout 
      sidebarContent={<ProjectSidebarNav />}
      showProjectSelector={true}
    />
  );
}
