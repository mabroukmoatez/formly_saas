# Design System Implementation Guide

## Overview
This document describes the implementation of the new design system for the Formly SaaS platform, specifically for the Quality Dashboard (Gestion Qualité).

## What Was Implemented

### 1. Design System Tokens ✅
**Location:** `/frontend/tailwind.css`

Added comprehensive design tokens including:
- **Colors:** Primary, secondary, status, text, background, border colors
- **Typography:** Font families (Poppins, Inter, Urbanist), fluid font sizes, weights, line heights
- **Spacing:** Responsive spacing scale (space-1 through space-10)
- **Container Sizes:** Sidebar, main, right sidebar, modal widths
- **Border Radius:** sm, md, lg, xl, full
- **Shadows:** sm, md, modal
- **Z-Index Scale:** Proper layering for modals, dropdowns, tooltips
- **Breakpoints:** xs (320px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px), 3xl (1728px)

All tokens use CSS custom properties (CSS variables) prefixed with `--` for easy access throughout the application.

### 2. New Dashboard Components ✅
**Location:** `/frontend/src/components/dashboard/`

#### A. SystemeQualiteCard.tsx
**Purpose:** Display the quality system overview with donut chart

**Features:**
- Custom SVG donut chart showing 3 segments (Procedures, Models, Evidence)
- Responsive legend with color indicators
- Statistics columns showing document counts
- Action buttons to add procedures, models, and evidence
- Responsive layout: stacks vertically on mobile, horizontal on desktop

**Props:**
```typescript
{
  totalDocuments: number;
  procedures: number;
  models: number;
  evidences: number;
  onAddProcedure?: () => void;
  onAddModel?: () => void;
  onAddEvidence?: () => void;
}
```

#### B. IndicateursQualiopi.tsx
**Purpose:** Display grid of 32 Qualiopi indicators

**Features:**
- Responsive grid: 8 columns (desktop), 4 columns (tablet), 2 columns (mobile)
- Circular indicators with active/inactive states
- Teal border (#26C9B6) for active/completed indicators
- Gray border for inactive indicators
- Click handlers for each indicator
- Settings button to configure indicators
- Accessibility: keyboard navigation support

**Props:**
```typescript
{
  indicators: Indicator[];
  onIndicatorClick?: (indicator: Indicator) => void;
  onSettingsClick?: () => void;
}
```

#### C. ActionCard.tsx
**Purpose:** Display individual task/action cards

**Features:**
- Category badges with custom colors
- Priority indicator (Faible, Moyenne, Élevée, Urgente)
- Status badge (Todo, En cours, Terminée)
- Due date display
- Responsive card layout
- Hover effects

**Props:**
```typescript
{
  task: Task;
  onClick?: (task: Task) => void;
}
```

#### D. ProchainAudit.tsx
**Purpose:** Display upcoming audit countdown widget

**Features:**
- Countdown display (J - X days)
- Audit date and type
- Auditor information
- Action buttons (edit, schedule)
- Empty state for no scheduled audits
- Responsive sizing

**Props:**
```typescript
{
  audit?: Audit | null;
  onEditClick?: () => void;
  onScheduleClick?: () => void;
  primaryColor?: string;
}
```

### 3. New Modal Components ✅
**Location:** `/frontend/src/components/modals/`

#### A. AddCollaboratorModal.tsx
**Reference:** `/new_design/reference/modal-add-collaborator.png`
**Specs:** `/new_design/layouts/modal-add-collaborator.json`

**Features:**
- Form fields: Nom, Prenom, Email
- Responsive: 770px desktop, 90vw mobile
- Field layout: 2-column desktop, 1-column mobile
- Form validation
- Submit handler with loading state
- Close button (top-right)

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { nom: string; prenom: string; email: string }) => void | Promise<void>;
}
```

#### B. ViewDocumentModal.tsx
**Reference:** `/new_design/reference/modal-view-document.png`
**Specs:** `/new_design/layouts/modal-view-document.json`

**Features:**
- Document viewer area (supports PDF, images)
- Scrollable content
- Close button (top-right)
- Validate button (bottom)
- Responsive: 876px desktop, 95vw mobile
- Handles different file types

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onValidate?: () => void | Promise<void>;
  documentTitle?: string;
  documentUrl?: string;
  children?: React.ReactNode;
}
```

## Integration Guide

### Step 1: Import Components
```typescript
import {
  SystemeQualiteCard,
  IndicateursQualiopi,
  ActionCard,
  ProchainAudit,
} from '../../components/dashboard';

import {
  AddCollaboratorModal,
  ViewDocumentModal,
} from '../../components/modals';
```

### Step 2: Replace Existing UI
See `/frontend/src/screens/Quality/GestionQualite.new.tsx` for a complete example.

**Key Replacements:**
1. **Quality System Card** → `<SystemeQualiteCard />`
2. **Indicators Grid** → `<IndicateursQualiopi />`
3. **Action Cards** → `<ActionCard />` (map over tasks)
4. **Audit Widget** → `<ProchainAudit />`

### Step 3: Maintain Backend Compatibility

**CRITICAL:** All existing functionality is preserved:
- ✅ All API calls unchanged
- ✅ All hooks unchanged (useQualityDashboard, useQualityArticles, etc.)
- ✅ All state management unchanged
- ✅ All event handlers unchanged
- ✅ All TypeScript interfaces unchanged
- ✅ All modals maintain existing submission logic

## Responsive Behavior

### Desktop (1728px+)
- 3-column layout: Sidebar | Main Content | Right Sidebar
- 8-column indicator grid
- Side-by-side action cards and recent files

### Tablet (768px - 1023px)
- 2-column layout: Main content expands, right sidebar moves below
- 4-column indicator grid
- Sidebar collapsible

### Mobile (<768px)
- Single column stack
- 2-column indicator grid
- Full-width cards
- Modal forms stack vertically

## CSS Variable Usage

All components use CSS variables from the design tokens:

```css
/* Example usage in components */
color: var(--color-primary);
font-family: var(--font-primary);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm);
padding: var(--space-6);
```

## Dark Mode Support

All components support dark mode via the `useTheme()` hook:

```typescript
const { isDark } = useTheme();

className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}
```

## File Structure

```
frontend/
├── tailwind.css                              # Design tokens added
├── src/
│   ├── components/
│   │   ├── dashboard/                        # NEW
│   │   │   ├── SystemeQualiteCard.tsx
│   │   │   ├── IndicateursQualiopi.tsx
│   │   │   ├── ActionCard.tsx
│   │   │   ├── ProchainAudit.tsx
│   │   │   └── index.ts
│   │   ├── modals/                           # NEW
│   │   │   ├── AddCollaboratorModal.tsx
│   │   │   ├── ViewDocumentModal.tsx
│   │   │   └── index.ts
│   │   └── QualityDashboard/                 # EXISTING (unchanged)
│   │       ├── AddDocumentModal.tsx
│   │       ├── AddEvidenceModal.tsx
│   │       ├── AddAuditModal.tsx
│   │       └── IndicatorSettingsModal.tsx
│   └── screens/
│       └── Quality/
│           ├── GestionQualite.tsx             # EXISTING
│           └── GestionQualite.new.tsx         # NEW (example integration)
```

## Testing Checklist

- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Modal submissions call correct API endpoints
- [ ] Indicator clicks navigate to detail pages
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Dark mode toggles correctly
- [ ] All existing modals still function
- [ ] No TypeScript errors
- [ ] No breaking changes to backend

## Next Steps

1. **Review** the implementation in `GestionQualite.new.tsx`
2. **Test** components in isolation
3. **Integrate** into main `GestionQualite.tsx` file
4. **Verify** backend compatibility
5. **Deploy** to staging environment

## Benefits

1. **Modularity:** Components are reusable across the application
2. **Maintainability:** Centralized design tokens make updates easy
3. **Consistency:** All UI elements follow the same design language
4. **Responsive:** Mobile-first approach with proper breakpoints
5. **Accessible:** Keyboard navigation, ARIA labels, proper semantic HTML
6. **Type-Safe:** Full TypeScript support with proper interfaces

## Support

For questions or issues:
- Review reference images in `/new_design/reference/`
- Check layout specs in `/new_design/layouts/`
- Examine design tokens in `/new_design/tokens/`
- See example integration in `/frontend/src/screens/Quality/GestionQualite.new.tsx`
