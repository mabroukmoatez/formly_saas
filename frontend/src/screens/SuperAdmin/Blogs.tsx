import React from 'react';
import { Newspaper } from 'lucide-react';
import { GenericManagementPage } from './GenericManagementPage';

export const Blogs: React.FC = () => {
  return (
    <GenericManagementPage
      title="Blog Management"
      description="Manage blog posts and articles"
      icon={Newspaper}
      iconColor="text-violet-500"
      buttonText="Create Post"
      searchPlaceholder="Search blog posts..."
      filters={[
        { value: 'all', label: 'All Posts' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Drafts' },
      ]}
    />
  );
};

