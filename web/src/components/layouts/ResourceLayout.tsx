import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useResourceStore } from '@/store/resourceStore';
import AppLayout from '@/components/AppLayout';
import ResourceSidebarNav from '@/components/sidebars/ResourceSidebarNav';

export default function ResourceLayout() {
  const { projectId, resourceId } = useParams<{ projectId: string; resourceId: string }>();
  const { fetchResourceById } = useResourceStore();

  useEffect(() => {
    if (projectId && resourceId) {
      fetchResourceById(projectId, resourceId);
    }
  }, [projectId, resourceId, fetchResourceById]);

  return (
    <AppLayout 
      sidebarContent={<ResourceSidebarNav />}
      showProjectSelector={true}
    />
  );
}
