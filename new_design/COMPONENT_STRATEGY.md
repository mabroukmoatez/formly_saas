# Component Implementation Strategy

## 1. UPDATE Existing Components

### Existing Dashboard Page (e.g., `DashboardQuality.tsx`)
**Action**: UPDATE STYLES ONLY
- ✅ Update layout structure to responsive 3-column grid
- ✅ Apply new design tokens
- ✅ Add responsive breakpoints
- ❌ DO NOT change props/interfaces
- ❌ DO NOT change data fetching logic
- ❌ DO NOT change API calls

### Existing Sidebar Component
**Action**: UPDATE STYLES ONLY
- ✅ Apply new colors/spacing
- ✅ Add responsive collapse behavior
- ❌ Keep navigation structure
- ❌ Keep routing logic

### Existing Cards/Widgets
**Action**: UPDATE STYLES + RESTRUCTURE HTML
- ✅ Match new card design (borders, shadows, radius)
- ✅ Update typography
- ✅ Adjust spacing
- ❌ Keep data binding
- ❌ Keep event handlers

---

## 2. CREATE Missing Components

### IF "Système Qualité Card" doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/dashboard/SystemeQualiteCard.tsx`
- Features: Donut chart, legend, stats
- Connect to existing API

### IF "Indicateurs Qualiopi" doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/dashboard/IndicateursQualiopi.tsx`
- Features: 32 circular indicators grid
- Connect to existing indicator API

### IF "Add Collaborator Modal" doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/modals/AddCollaboratorModal.tsx`
- Connect to existing collaborator API

### IF "View Document Modal" doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/modals/ViewDocumentModal.tsx`
- Connect to existing document API

---

## 3. Reusable Base Components

### IF Base Modal Component doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/common/Modal.tsx`
- Reusable modal wrapper
- Responsive behavior built-in

### IF Card Component doesn't exist:
**Action**: CREATE NEW
- File: `frontend/src/components/common/Card.tsx`
- Reusable card wrapper
- Apply design system tokens

---

## Decision Tree
```
For each UI element in Figma:
│
├─ Does it exist in codebase?
│  │
│  ├─ YES → UPDATE styles/layout only
│  │         Keep all logic/props/API calls
│  │
│  └─ NO  → CREATE new component
│            Connect to existing API
│            Follow existing patterns
```