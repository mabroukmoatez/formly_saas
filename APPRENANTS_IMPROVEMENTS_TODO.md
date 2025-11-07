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
- [ ] Update bulk delete button design to match Entreprises page style
- [ ] Update export Excel button design to match Entreprises page style
- [ ] Move bulk action buttons to same row as Filter button
- [ ] Use modern design with light background + organization color text

#### Table
- [ ] Make "Formations attribuées" a clickable button
- [ ] Button style: light background with organization primary color
- [ ] onClick: open popup showing student's formations OR message if none
- [ ] Message when empty: "Aucune formation suivie par cet étudiant" (FR/EN)

### 3. Student Form Modal (Create/Edit)

#### Avatar Upload
- [ ] Add avatar upload in create student modal
- [ ] Add avatar upload in edit student modal
- [ ] Support image preview
- [ ] Validate file types (JPG, PNG)
- [ ] Max file size handling

#### Edit Mode Behavior
- [ ] Center "Modifier" and "Supprimer" buttons
- [ ] On "Modifier" click:
  - Remove `disabled` from all input fields
  - Hide "Modifier" and "Supprimer" buttons
  - Show "Annuler" and "Mettre à jour" buttons
  - Use translations: `t('students.cancel')` and `t('students.update')`

#### Delete Confirmation
- [ ] On "Supprimer" click: show confirmation popup
- [ ] Popup title: `t('students.deleteConfirmTitle')`
- [ ] Popup message: `t('students.deleteConfirmMessage')`
- [ ] Confirm button: `t('students.confirmDelete')`
- [ ] Cancel button: `t('students.cancelDelete')`

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
- [ ] Fix document upload error
- [ ] Display 2 documents per row
- [ ] Each document in a card with:
  - File icon (based on type)
  - Document name.extension (below icon)
  - Small text showing type and size
  - Right side: View icon (eye) and Download icon
  - On View click: open document in new tab/modal
  - On Download click: download file
- [ ] Handle upload errors gracefully
- [ ] Show success toast on upload
- [ ] Grid layout: 2 columns responsive

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

Create new component: `/frontend/src/components/Students/StudentFormationsModal.tsx`

Features:
- [ ] Show list of student's formations
- [ ] Display formation name, status, progress
- [ ] Show sessions if applicable
- [ ] Empty state with message
- [ ] Close button
- [ ] Responsive design

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
