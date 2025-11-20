# Formly SaaS - Frontend Codebase Overview

## Project Information
- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS 3.4.16 + Tailwind Merge
- **Routing**: React Router DOM v6.8.1
- **Internationalization**: i18next v25.6.0
- **UI Components**: Radix UI + shadcn/ui components
- **Icons**: Lucide React v0.453.0
- **Total Components**: 376+ TypeScript/TSX files

## 1. PROJECT STRUCTURE

```
frontend/
├── src/
│   ├── App.tsx                          # Main App with context providers
│   ├── index.tsx                        # Entry point
│   ├── router/
│   │   └── AppRouter.tsx               # Central routing configuration (2070+ lines)
│   ├── pages/                          # Page-level components (57 files)
│   ├── screens/                        # Feature screens
│   ├── components/                     # Reusable UI components
│   ├── contexts/                       # React Context for state management
│   ├── hooks/                          # Custom React hooks
│   ├── services/                       # API services
│   ├── utils/                          # Utility functions
│   ├── locales/                        # i18n translation files
│   └── config/                         # Configuration files
├── public/                             # Static assets
├── index.html                          # HTML entry point
├── tailwind.config.js                  # Tailwind CSS configuration
├── tailwind.css                        # Tailwind CSS utilities
├── vite.config.ts                      # Vite configuration
└── package.json
```

## 2. REACT/TYPESCRIPT STRUCTURE FOR PAGES AND LAYOUTS

### Pages Directory (src/pages/)
Pages are thin wrapper components that combine a layout with content. Pattern:

```typescript
// Example: DashboardPage.tsx
const DashboardPage = () => {
  return (
    <DashboardLayout>
      <CommercialDashboard />
    </DashboardLayout>
  );
};
export default DashboardPage;
```

**Key Pages (57 total)**:
- Dashboard-related: `DashboardPage.tsx`, `ProfilePage.tsx`, `SettingsPage.tsx`
- Academic: `CourseCreationPage.tsx`, `CourseViewPage.tsx`, `CourseEditPage.tsx`
- Sessions: `SessionCreationPage.tsx`, `SessionViewPage.tsx`, `SessionEditPage.tsx`
- Students: `Apprenants.tsx` (mapped to `/apprenants` route)
- Organizations: `Entreprises.tsx`, `Financeurs.tsx`
- Quality: `QualityPage.tsx`, `IndicateursPage.tsx`, `DocumentsPage.tsx`, `BPFPage.tsx`
- Commercial: `MesFacturesPage.tsx`, `MesDevisPage.tsx`, `ChargesDepensesPage.tsx`
- Content: `ActualitesPage.tsx`, `EvenementsPage.tsx`, `MessageriePage.tsx`
- Admin: `GestionUtilisateursPage.tsx`, `GestionOrganismePage.tsx`, `TrainersPage.tsx`

### Layout Components (src/components/CommercialDashboard/)
The main layout system consists of:

1. **DashboardLayout** - Primary application layout
   - Contains: Header + Sidebar + Main Content + Footer + Floating Chat
   - Props: `children`, `className`
   - Used by all protected routes

2. **Layout Composition**:
   ```
   DashboardLayout
   ├── CommercialHeader (top navigation bar)
   ├── CommercialSidebar (left navigation with collapsible menus)
   ├── Main Content Area (scrollable)
   ├── CommercialFooter (bottom)
   └── FloatingChat (independent overlay)
   ```

3. **Super Admin Layout** (src/components/SuperAdminDashboard/)
   - Similar structure for `/superadmin/*` routes
   - Different styling and sidebar configuration

## 3. SIDEBAR AND NAVIGATION COMPONENTS

### CommercialSidebar (src/components/CommercialDashboard/Sidebar.tsx)
- **Type**: Responsive collapsible sidebar with nested menus
- **Features**:
  - Collapse/expand functionality
  - Theme-aware styling (dark/light mode)
  - Organization color branding
  - Mobile responsive with menu toggle
  - Permission-based menu visibility
  - Active state indication with left border highlight

- **Navigation Structure**:
  ```
  Main Menu Items (with icons):
  ├── Dashboard
  ├── Commercial Section
  │   ├── Invoices (Mes Factures)
  │   ├── Quotes (Mes Devis)
  │   ├── Articles
  │   └── Charges & Expenses
  ├── Training Section
  │   ├── Courses Management
  │   ├── Sessions
  │   ├── Quizzes
  │   ├── Pedagogical Support
  │   └── Trainers
  ├── People Management
  │   ├── Students (Apprenants)
  │   ├── Companies (Entreprises)
  │   └── Funders (Financeurs)
  ├── Administration
  │   ├── Organization Management
  │   ├── User Management
  │   ├── Messaging
  │   ├── News
  │   └── Events
  ├── Quality Management
  │   ├── Indicators
  │   ├── Documents
  │   └── BPF (Best Practices Framework)
  └── White Label
      ├── Identity
      ├── Library
      ├── Identifiers
      └── Plans
  ```

- **Icon System**: Uses Lucide React icons + custom images
- **Styling**: Uses organization's primary color for active states
- **Permissions**: `shouldShowMenuItem()` function controls visibility

### CommercialHeader (src/components/CommercialDashboard/Header.tsx)
- Mobile menu toggle button
- Onboarding button
- Chat toggle button
- Notification dropdown
- Theme toggle (light/dark mode)
- Profile dropdown

## 4. STUDENT-RELATED PAGES AND COMPONENTS

### Pages
- **Apprenants.tsx** - Main students management page
  - Route: `/apprenants` and `/:subdomain/apprenants`
  - Uses: `DashboardLayout` wrapper

### Components (src/components/Students/)
1. **StudentFormModal.tsx** - Create new student form
   - Fields: first_name, last_name, email, phone, address, postal_code, city
   - Additional: complementary_notes, adaptation_needs, company_id, avatar
   - Form validation and error handling
   - Uses `AvatarUpload` subcomponent

2. **StudentDetailsModal.tsx** - View/edit student information
   - Shows full student profile
   - Integration with student data

3. **StudentCoursesModal.tsx** - Display student's enrolled courses
   - Linked courses view

4. **StudentSessionsModal.tsx** - Display student's sessions
   - Session history and status

5. **SearchableSelect.tsx** - Reusable dropdown with search
   - For company selection in forms

6. **AvatarUpload.tsx** - Image upload component
   - Avatar file management

### Screen Component (src/screens/Admin/Apprenants.tsx)
The core logic component with:
- Student listing with pagination
- Search functionality
- Filtering by formation and company
- Date range filtering
- Bulk export (selected/all students)
- Create/edit/delete operations
- Modal management
- Integration with:
  - `studentsService` for API calls
  - `companiesService` for company data
  - `courseCreation` for courses list
  - `useStudentsExportWithSelection` hook for export logic

## 5. LAYOUT PATTERNS ACROSS THE APPLICATION

### Common Pattern 1: Page + Layout + Screen
```typescript
// Pages wrap screens with layouts
const SomeFeaturePage = () => (
  <DashboardLayout>
    <SomeFeatureScreen />
  </DashboardLayout>
);
```

### Common Pattern 2: Modal-based Interactions
Used extensively for:
- Creating items (StudentFormModal, InvoiceCreationModal, etc.)
- Viewing details (StudentDetailsModal, CompanyDetailsModal, etc.)
- Confirmation dialogs (ConfirmationModal)

### Common Pattern 3: Service + State Management
```typescript
// Component uses services + local state
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);

const fetchItems = async () => {
  const response = await itemService.getItems();
  setItems(response.data);
};
```

### Common Pattern 4: Context-based Features
- **Theme Context**: Dark/light mode toggle
- **Language Context**: i18n translations
- **Organization Context**: Multi-tenancy organization data
- **Auth Context**: User authentication and permissions
- **Courses Context**: Course creation/editing state

## 6. ROUTING STRUCTURE

### Router Configuration (src/router/AppRouter.tsx)

**Route Categories**:

#### 1. Public Routes (No Authentication)
```
/
/login, /:subdomain/login
/forgot-password, /:subdomain/forgot-password
/setup-password, /:subdomain/setup-password
/signup
/white-label (public endpoints)
```

#### 2. Organization-Specific Routes (with :subdomain parameter)
```
/:subdomain/dashboard
/:subdomain/apprenants
/:subdomain/entreprises
/:subdomain/financeurs
/:subdomain/formateurs
/:subdomain/gestion-formations
/:subdomain/sessions
/:subdomain/gestion-quizz
/:subdomain/supports-pedagogiques
/:subdomain/quality/*
/:subdomain/white-label/*
```

#### 3. Standard Protected Routes (without subdomain)
```
/dashboard
/apprenants
/entreprises
/financeurs
/profile
/settings
/support-tickets
/gestion-commercial
/statistiques
/mes-factures
/mes-devis
/quality/*
/course-creation
/quiz/*
```

#### 4. SuperAdmin Routes
```
/superadmin/dashboard
/superadmin/organizations
/superadmin/users
/superadmin/students
/superadmin/courses
/superadmin/analytics
/superadmin/* (30+ routes)
```

### Route Protection
- **ProtectedRoute**: Checks authentication, redirects to login if not authenticated
- **PublicRoute**: Redirects authenticated users to dashboard
- **OrganizationRoute**: Validates organization context before rendering

### Route Guards Features
- Automatic redirect to login with path saving in sessionStorage
- Smart redirect after login back to original path
- Subdomain-aware navigation
- Organization-specific routing
- Role-based visibility (integrated with permission system)

## 7. COMPONENT ORGANIZATION

### Directory Structure

```
components/
├── ui/                           # Shadcn UI base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   ├── confirmation-modal.tsx
│   └── ... (20+ UI primitives)
│
├── CommercialDashboard/          # Main dashboard layout & controls
│   ├── Layout.tsx               # Main layout wrapper
│   ├── Header.tsx              # Top navigation bar
│   ├── Sidebar.tsx             # Left sidebar navigation
│   ├── Footer.tsx              # Bottom footer
│   ├── Dashboard.tsx           # Dashboard content
│   ├── ProfileDropdown.tsx     # User profile menu
│   ├── NotificationDropdown.tsx # Notifications
│   ├── FloatingChat.tsx        # Chat widget
│   ├── *Modal.tsx              # Modal components for commercial features
│   └── index.ts                # Barrel export
│
├── Students/                     # Student management
│   ├── StudentFormModal.tsx    # Create/edit student
│   ├── StudentDetailsModal.tsx # View student details
│   ├── StudentCoursesModal.tsx # Student courses
│   ├── StudentSessionsModal.tsx # Student sessions
│   ├── SearchableSelect.tsx    # Searchable dropdown
│   └── AvatarUpload.tsx        # Avatar upload
│
├── Companies/                    # Company management
│   ├── CompanyDetailsModal.tsx
│   ├── CompanyFormModal.tsx
│   └── ...
│
├── Funders/                      # Funder management
│   ├── FunderFormModal.tsx
│   ├── FunderDetailsModal.tsx
│   └── ...
│
├── CourseCreation/              # Course creation wizard (50+ components)
│   ├── CourseCreationHeader.tsx
│   ├── Step1-Step6 components
│   ├── FormField.tsx
│   ├── DocumentCreationModal.tsx
│   ├── QuestionnaireCreationModal.tsx
│   └── ... (complex multi-step form)
│
├── SessionCreation/             # Session creation (similar structure)
│   └── ... (parallel to CourseCreation)
│
├── QualityDashboard/            # Quality management
│   ├── QualityLayout.tsx
│   ├── QualitySidebar.tsx
│   ├── QualityHeader.tsx
│   ├── *Modal.tsx
│   └── ... (quality-specific components)
│
├── Quiz/                        # Quiz management
│   ├── QuizCreation.tsx
│   ├── QuestionEditor.tsx
│   ├── QuizList.tsx
│   └── ... (quiz-related)
│
├── Trainers/                    # Trainer management
├── Onboarding/                  # Onboarding modal
├── NewsView/                    # News display
├── EventView/                   # Event display
├── SupportTickets/              # Support ticket system
├── SuperAdminDashboard/         # SuperAdmin layout & components
├── AppHeader.tsx                # Alternative header
├── LoadingScreen.tsx            # Loading indicator
├── LogoutHandler.tsx            # Logout logic
└── ... (more feature-specific components)
```

### Component Types by Purpose

**Layout Components**:
- DashboardLayout, QualityLayout, SuperAdminLayout
- CommercialHeader, CommercialSidebar, CommercialFooter

**Modal Components** (used for forms and dialogs):
- StudentFormModal, CompanyFormModal, etc.
- InvoiceCreationModal, QuoteCreationModal
- ConfirmationModal, DocumentCreationModal

**Data Display Components**:
- Tables, Lists, Cards
- Detail views and card layouts

**Form Components**:
- FormField, SelectField, RichTextField, DateField
- SearchableSelect, AvatarUpload

**Specialized Components**:
- Floating chat, Notifications, Profile dropdown
- Theme toggle, Language switcher

## 8. KEY ARCHITECTURAL PATTERNS

### Context Providers (src/contexts/)
```typescript
// App.tsx stack
<ThemeProvider>              // Dark/light mode
  <LanguageProvider>         // i18n
    <OrganizationProvider>   // Multi-tenancy
      <AuthProvider>         // Authentication
        <ToastProvider>      // Notifications
          <PermissionErrorProvider>  // Error handling
            <AppRouter />
```

### State Management Approach
1. **React Context**: Theme, Language, Organization, Auth
2. **Component State**: Local UI state (modals, forms, filters)
3. **Services**: API calls with custom hooks
4. **Cookies/SessionStorage**: Auth tokens, redirect paths

### Hooks (src/hooks/)
- `usePermissions` - Permission checking
- `useSubdomainNavigation` - Navigation with subdomain awareness
- `useOrganizationSettings` - Org configuration
- `useQuality*` - Quality dashboard features
- `useStudentsExportWithSelection` - Student export logic
- `useNews`, `useChat`, `useCompaniesSearch` - Feature-specific

### Services (src/services/)
- `api.ts` - Axios instance with auth
- `Students.ts` - Student CRUD operations
- `Companies.ts` - Company management
- `courseCreation.ts` - Course operations
- `quiz.ts` - Quiz management
- `commercialDashboard.ts` - Commercial features
- `qualityManagement.ts` - Quality features
- `chat.ts` - Chat operations
- And 20+ more specialized services

## 9. STYLING AND THEMING

### Tailwind CSS + Theme Context
- **Color System**: Organization primary color + secondary color
- **Dark Mode**: Complete dark mode support via ThemeContext
- **Responsive**: Mobile-first design with breakpoints (sm, md, lg, xl, 2xl)
- **Custom Configuration**: tailwind.config.js with extended colors

### Shadow & Styling Convention
```typescript
// Consistent shadow system
shadow-[0px_4px_20px_5px_#09294c12]  // Component shadows
// Color filters for icon theming
filter: getColorFilter(primaryColor)
```

## 10. INTERNATIONALIZATION (i18n)

### Setup
- **Framework**: i18next v25.6.0 + react-i18next
- **Language Detection**: Browser language detector
- **Location**: src/locales/ (translation files)

### Usage Pattern
```typescript
const { t } = useLanguage();
<span>{t('students.create')}</span>
```

### Supported Languages
- French (fr)
- English (en)
- And others configured in locales

## 11. KEY FILES TO UNDERSTAND FIRST

1. **src/router/AppRouter.tsx** (2070 lines) - All routing logic
2. **src/App.tsx** - Context provider stack
3. **src/components/CommercialDashboard/Sidebar.tsx** - Navigation menu
4. **src/components/CommercialDashboard/Layout.tsx** - Main layout
5. **src/screens/Admin/Apprenants.tsx** - Student management logic
6. **src/contexts/AuthContext.tsx** - Authentication
7. **src/contexts/OrganizationContext.tsx** - Multi-tenancy
8. **src/services/Students.ts** - Student API service
9. **vite.config.ts** - Build configuration with proxy setup
10. **tailwind.config.js** - Styling configuration

## 12. DEVELOPMENT SERVER

### Vite Configuration
- **Port**: 5173 (default)
- **API Proxy**: Redirects /api to http://localhost:8000
- **Organization API Proxy**: Special handling for /organization/api and subdomains
- **Uploads**: Proxied to backend

### Running the Frontend
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
```

## 13. STUDENT DASHBOARD SIDEBAR CONTEXT

Based on the branch name `claude/student-dashboard-sidebar-01KSzFJRNVSX2Hems58QXini`, 
the project is likely working on:
- Enhanced student dashboard with dedicated sidebar
- Improved student-specific navigation
- Potentially a separate student view/role

**Related Components**:
- Student sidebar might be similar to CommercialSidebar
- Could have student-specific menu items
- Separate from admin dashboard sidebar

---

## Summary Statistics
- **Total TSX Files**: 376+
- **Page Components**: 57
- **Service Files**: 20+
- **Context Providers**: 9
- **Custom Hooks**: 15+
- **UI Components**: 30+ from ui/ folder
- **Feature Components**: 100+ organized in subdirectories
- **Routes**: 100+ endpoints with subdomain variants

