import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { EvenementsEdit } from '../screens/Admin/EvenementsEdit';

const EvenementsEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>ID d'événement manquant</div>;
  }

  return (
    <DashboardLayout>
      <EvenementsEdit eventId={id} />
    </DashboardLayout>
  );
};

export default EvenementsEditPage;
