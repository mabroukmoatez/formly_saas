# Claude Code Implementation Prompt

## Step 1: Analyze First (CRITICAL)

claude-code "Before making ANY changes, please analyze the existing codebase:

1. Find and list ALL files in frontend/src/pages/ that contain 'quality' or 'dashboard'
2. Find and list ALL modal components in frontend/src/components/
3. Find and list ALL API service files
4. Show me the structure of the main dashboard page
5. Show me existing TypeScript interfaces for:
   - Quality/Dashboard data
   - Collaborator data
   - Document data

STOP and show me your findings before proceeding."

## Step 2: Implementation Plan

claude-code "Based on the existing codebase analysis, implement the Dashboard Qualité redesign:

### INPUT SOURCES:
1. Design reference: /new_design/reference/dashboard-quality-full.png
2. Modal references: 
   - /new_design/reference/modal-add-collaborator.png
   - /new_design/reference/modal-view-document.png
3. Design tokens: /new_design/tokens/*.css
4. Layout specs: /new_design/layouts/*.json

### STRATEGY:

#### A. UPDATE Existing Components (List from analysis):
For each EXISTING component you found:
- [Component Path 1]: Update styles to match new design
- [Component Path 2]: Apply responsive layout
- [Component Path 3]: Use design tokens
- ❌ DO NOT change: props, interfaces, API calls, data logic

#### B. CREATE Missing Components Only:
ONLY create components that DON'T exist. For each missing component:

##### IF "System Quality Card" is MISSING:
```typescript
// frontend/src/components/dashboard/SystemeQualiteCard.tsx
import React from 'react';
// Use existing API service
import { useQualityData } from '@/services/qualityService'; // Or whatever exists

export const SystemeQualiteCard: React.FC = () => {
  const { data } = useQualityData(); // Connect to EXISTING API
  
  return (
    <div className="systeme-qualite-card">
      {/* Donut chart with data from existing API */}
      {/* Match design from reference PNG */}
    </div>
  );
};
```

##### IF "Add Collaborator Modal" is MISSING:
```typescript
// frontend/src/components/modals/AddCollaboratorModal.tsx
import React from 'react';
// Use existing API service
import { useCreateCollaborator } from '@/services/collaboratorService';

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Keep any other existing props
}

export const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { mutate: createCollab } = useCreateCollaborator(); // EXISTING API
  
  const handleSubmit = (data) => {
    createCollab(data); // Use EXISTING mutation
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Match design from modal-add-collaborator.png */}
      {/* Form fields: Nom, Prenom, Email */}
      {/* Responsive: 770px → 90vw */}
    </Modal>
  );
};
```

### IMPLEMENTATION STEPS:

1. **Import Design Tokens**:
   - Add tokens to global CSS
   - Configure CSS variables

2. **Update Layout** (if page exists):
   - Apply responsive grid
   - Use design tokens for spacing
   - Match reference PNG

3. **Update Each Existing Component**:
   - Apply new styles
   - Keep ALL existing logic
   - Test that API calls still work

4. **Create ONLY Missing Components**:
   - Follow existing component patterns
   - Connect to existing APIs
   - Match design references
   - Make responsive

5. **Responsive Behavior**:
   - Mobile: 320px - 767px (stack)
   - Tablet: 768px - 1023px (2-col)
   - Desktop: 1024px+ (3-col match Figma)

### CONSTRAINTS:
- ❌ DO NOT modify backend files
- ❌ DO NOT change API endpoints
- ❌ DO NOT alter TypeScript data interfaces
- ❌ DO NOT change service layer
- ✅ ONLY update UI/styles/components
- ✅ CREATE only what's missing
- ✅ MAINTAIN all existing functionality

### OUTPUT:
Show me:
1. List of files UPDATED (with summary of changes)
2. List of files CREATED (with why they were needed)
3. Confirmation that all APIs still work

Please implement step-by-step."