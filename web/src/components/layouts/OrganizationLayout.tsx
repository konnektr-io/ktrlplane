import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useOrganizationStore } from '@/store/organizationStore';
import AppLayout from '@/components/AppLayout';
import OrganizationSidebarNav from '@/components/sidebars/OrganizationSidebarNav';

export default function OrganizationLayout() {
  const { orgId } = useParams<{ orgId: string }>();
  const { fetchOrganizationById } = useOrganizationStore();

  useEffect(() => {
    if (orgId) {
      fetchOrganizationById(orgId);
    }
  }, [orgId, fetchOrganizationById]);

  return (
    <AppLayout 
      sidebarContent={<OrganizationSidebarNav />}
      showProjectSelector={false}
    />
  );
}
