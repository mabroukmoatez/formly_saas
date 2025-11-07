import React from "react";
import { DashboardLayout } from "../../components/CommercialDashboard";
import { InvoiceTableSection } from "./sections/InvoiceTableSection/InvoiceTableSection";

export const GestionComercial = (): JSX.Element => {
  return (
    <DashboardLayout>
      <InvoiceTableSection />
    </DashboardLayout>
  );
};
