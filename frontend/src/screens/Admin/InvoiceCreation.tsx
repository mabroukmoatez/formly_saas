// This file will import and render InvoiceCreationContent
// The actual content will be in a separate file to avoid circular dependencies
import React from 'react';
import { InvoiceCreationContent } from './InvoiceCreationContent';

export const InvoiceCreation: React.FC = () => {
  return <InvoiceCreationContent />;
};

