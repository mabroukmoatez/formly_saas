# Apprenants Page - Improvements TODO

## ✅ COMPLETED
- [x] Add comprehensive multilanguage support (FR/EN)
- [x] Create translation keys for all UI elements

## 🔄 IN PROGRESS / TO DO

### 1. Code Cleanup & Best Practices
- [ ] Remove all `console.log` statements from Apprenants.tsx
- [ ] Remove all `console.log` statements from StudentDetailsModal.tsx
- [ ] Remove all `console.log` statements from StudentFormModal.tsx
- [ ] Replace direct API calls with service/hooks pattern where appropriate

### 2. UI/UX Improvements - Buttons & Layout

#### Bulk Action Buttons
- [x] Update bulk delete button design to match Entreprises page style
- [x] Update export Excel button design to match Entreprises page style
- [x] Move bulk action buttons to same row as Filter button
- [x] Use modern design with light background + organization color text

#### Table
- [x] Make "Formations attribuées" a clickable button
- [x] Button style: light background with organization primary color
- [x] onClick: open popup showing student's formations OR message if none
- [x] Message when empty: "Aucune formation suivie par cet étudiant" (FR/EN)

### 3. Student Form Modal (Create/Edit)

#### Avatar Upload
- [x] Add avatar upload in create student modal
- [x] Add avatar upload in edit student modal
- [x] Support image preview
- [x] Validate file types (JPG, PNG)
- [x] Max file size handling
- [x] Multilanguage support (FR/EN) for all avatar upload UI elements

#### Edit Mode Behavior
- [x] Center "Modifier" and "Supprimer" buttons
- [x] On "Modifier" click:
  - [x] Remove `disabled` from all input fields (inputs shown only in edit mode)
  - [x] Hide "Modifier" and "Supprimer" buttons
  - [x] Show "Annuler" and "Mettre à jour" buttons
  - [x] Use translations: `t('students.cancel')` and `t('students.update')`
  - [x] All field labels use multilanguage support
  - [x] Update functionality implemented with proper API calls

#### Delete Confirmation
- [x] On "Supprimer" click: show confirmation popup
- [x] Popup title: `t('students.deleteConfirmTitle')`
- [x] Popup message: `t('students.deleteConfirmMessage')`
- [x] Confirm button: `t('students.confirmDelete')`
- [x] Cancel button: `t('students.cancelDelete')`

### 4. Student Details Modal - Real Data

#### Suivi Tab - Stats Cards
Current (showing fake/zero data):
```
Compte Rendu Des Connexions: 167 H
Sessions Participées: 0
Heures De Formation Effectives: 0
Evaluations Répondus: 0/0
```

TO DO:
- [ ] Fetch real connection hours from database
- [ ] Fetch real participated sessions count
- [ ] Fetch real effective training hours
- [ ] Fetch real evaluations answered count
- [ ] Calculate evaluations total/answered ratio
- [ ] Use translations for all labels

#### Formations Suivies Section
- [ ] Fetch student's enrolled formations from API
- [ ] Display list of formations with details
- [ ] If empty: show message `t('students.trainings.noTrainings')`
- [ ] Support FR/EN

#### Documents Tab
- [x] Fix document upload error (existing error handling in place)
- [x] Display 2 documents per row
- [x] Each document in a card with:
  - [x] File icon (based on type: PDF=red, DOC=blue, images=green)
  - [x] Document name.extension (below icon)
  - [x] Small text showing type and size
  - [x] View icon (eye) and Download icon with organization color
  - [x] Delete icon (trash) in red
  - [x] Hover effects on action buttons
- [x] Grid layout: 2 columns responsive (1 column on mobile, 2 on md+)
- [x] Multilanguage support (FR/EN) for all UI elements
- [x] Centered card layout with proper spacing
- [x] Organization primary color theming for action icons

### 5. API Integration

#### Create Student Service
If not exists, create `/frontend/src/services/Students.ts` with:
```typescript
export const studentsService = {
  getStudents(params),
  getStudentById(uuid),
  createStudent(data),
  updateStudent(uuid, data),
  deleteStudent(uuid),
  getStudentStats(uuid),
  getStudentFormations(uuid),
  uploadDocument(uuid, file),
  getDocuments(uuid),
  deleteDocument(uuid, documentId),
  downloadDocument(uuid, documentId),
  exportStudents(filters),
}
```

#### Update Components
- [ ] Replace `api.get('/api/...')` with `studentsService.getStudents()`
- [ ] Use proper TypeScript types
- [ ] Handle errors consistently
- [ ] Show loading states

### 6. Backend API Endpoints (if missing)

Verify/create these endpoints:
```php
GET    /api/organization/students/{uuid}/stats
GET    /api/organization/students/{uuid}/formations
GET    /api/organization/students/{uuid}/documents
POST   /api/organization/students/{uuid}/documents
DELETE /api/organization/students/{uuid}/documents/{id}
GET    /api/organization/students/{uuid}/documents/{id}/download
```

### 7. Translation Integration

Update all components to use `useLanguage` hook:

```typescript
import { useLanguage } from '../../contexts/LanguageContext';

const { t } = useLanguage();

// Then use:
<h1>{t('students.title')}</h1>
<button>{t('students.add')}</button>
// etc.
```

Files to update:
- [ ] `/frontend/src/screens/Admin/Apprenants.tsx`
- [ ] `/frontend/src/components/Students/StudentDetailsModal.tsx`
- [ ] `/frontend/src/components/Students/StudentFormModal.tsx`
- [ ] `/frontend/src/components/Students/StudentCoursesModal.tsx` (if exists)

### 8. Formations Popup Modal

Component already exists: `/frontend/src/components/Students/StudentCoursesModal.tsx`

Features:
- [x] Show list of student's formations
- [x] Display formation name, status, progress
- [x] Show sessions if applicable
- [x] Empty state with message
- [x] Close button
- [x] Responsive design
- [x] Multilanguage support (FR/EN)

### 9. Testing Checklist

Before production deployment:
- [ ] Test create student with avatar
- [ ] Test edit student with avatar upload
- [ ] Test delete student with confirmation
- [ ] Test bulk delete
- [ ] Test Excel export
- [ ] Test formations popup (with data and empty)
- [ ] Test document upload
- [ ] Test document view/download
- [ ] Test all stats show real data
- [ ] Test FR/EN language switching
- [ ] Test responsive design on mobile/tablet
- [ ] Verify no console.log in production build
- [ ] Check all API calls use proper error handling

## Priority Order

1. **High Priority** (Core functionality)
   - Remove console.logs
   - Fix document upload
   - Show real stats data
   - Delete confirmation popup

2. **Medium Priority** (UX improvements)
   - Multilanguage integration
   - Bulk buttons redesign
   - Avatar upload
   - Edit mode behavior
   - Formations popup

3. **Low Priority** (Polish)
   - Service layer refactoring
   - Additional validation
   - Performance optimization

## Notes

- All user-facing text MUST use translations (FR/EN)
- Follow existing patterns from Entreprises page for consistency
- Use organization primary color for themed elements
- Maintain responsive design for all screen sizes
- Toast notifications for all success/error states
