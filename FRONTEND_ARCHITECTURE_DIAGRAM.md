# Formly SaaS - Frontend Architecture Diagram

## Application Flow & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (Root)                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Theme Provider (dark/light mode)                                 │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ Language Provider (i18n)                                    │  │  │
│  │  │  ┌──────────────────────────────────────────────────────┐   │  │  │
│  │  │  │ Organization Provider (multi-tenancy)                │   │  │  │
│  │  │  │  ┌────────────────────────────────────────────────┐  │   │  │  │
│  │  │  │  │ Auth Provider (authentication & user)          │  │   │  │  │
│  │  │  │  │  ┌──────────────────────────────────────────┐  │  │   │  │  │
│  │  │  │  │  │ Toast Provider (notifications)           │  │  │   │  │  │
│  │  │  │  │  │  ┌──────────────────────────────────────┐ │  │   │  │  │
│  │  │  │  │  │  │ PermissionError Provider             │ │  │   │  │  │
│  │  │  │  │  │  │  ┌──────────────────────────────────┐│ │  │   │  │  │
│  │  │  │  │  │  │  │ AppRouter / Routes               ││ │  │   │  │  │
│  │  │  │  │  │  │  └──────────────────────────────────┘│ │  │   │  │  │
│  │  │  │  │  │  └──────────────────────────────────────┘ │  │   │  │  │
│  │  │  │  │  └──────────────────────────────────────────┘  │   │  │  │
│  │  │  │  └────────────────────────────────────────────────┘   │  │  │
│  │  │  └──────────────────────────────────────────────────────┘   │  │
│  │  └────────────────────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

## Routing Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AppRouter.tsx                               │
│                     (2070+ lines of routes)                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PUBLIC ROUTES (No auth required)                             │   │
│  │  /login, /forgot-password, /signup, /landing                │   │
│  │  /:subdomain/login, /:subdomain/forgot-password             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PROTECTED ROUTES (Auth required + Organization)              │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ STANDARD ROUTES (Organization-level paths)          │    │   │
│  │  │  /dashboard, /apprenants, /entreprises,             │    │   │
│  │  │  /formateurs, /gestion-formations,                  │    │   │
│  │  │  /sessions, /quality/*, /course-creation, /quiz/*   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ SUBDOMAIN ROUTES (Multi-tenant awareness)           │    │   │
│  │  │  /:subdomain/dashboard                              │    │   │
│  │  │  /:subdomain/apprenants, /entreprises, /financeurs  │    │   │
│  │  │  /:subdomain/quality/*, /:subdomain/white-label/*   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ SUPERADMIN ROUTES (System administration)           │    │   │
│  │  │  /superadmin/dashboard, /organizations,             │    │   │
│  │  │  /users, /courses, /analytics, /settings            │    │   │
│  │  │  /quality-articles, /news (30+ routes)              │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ SPECIAL ROUTES (White label, etc.)                  │    │   │
│  │  │  /white-label/*, /:subdomain/white-label/*          │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Page & Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                    src/pages/ Directory                          │
│                                                                  │
│  Each Page Component = Layout + Screen                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Example: ApprenantsPage.tsx                              │   │
│  │                                                          │   │
│  │  const ApprenantsPage = () => (                         │   │
│  │    <DashboardLayout>                                    │   │
│  │      <Apprenants />  {/* Screen component */}           │   │
│  │    </DashboardLayout>                                   │   │
│  │  );                                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ DashboardLayout (Main Layout Wrapper)                    │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ CommercialHeader                                   │  │   │
│  │  │  - Mobile menu toggle                             │  │   │
│  │  │  - Onboarding button                              │  │   │
│  │  │  - Chat toggle                                    │  │   │
│  │  │  - Notifications dropdown                         │  │   │
│  │  │  - Theme toggle                                   │  │   │
│  │  │  - Profile dropdown                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐  │   │
│  │  │ Commercial   │  │ Main Content Area                │  │   │
│  │  │ Sidebar      │  │ (Scrollable)                     │  │   │
│  │  │              │  │                                  │  │   │
│  │  │ Collapsible  │  │  {children} - Page content       │  │   │
│  │  │ menus with   │  │                                  │  │   │
│  │  │ sub-items    │  │  (StudentList, Dashboard, etc)   │  │   │
│  │  │              │  │                                  │  │   │
│  │  │ Org colors   │  │                                  │  │   │
│  │  │ + icons      │  │                                  │  │   │
│  │  │              │  │                                  │  │   │
│  │  │ Permission   │  │                                  │  │   │
│  │  │ based        │  │                                  │  │   │
│  │  │ visibility   │  │                                  │  │   │
│  │  └──────────────┘  └──────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ CommercialFooter                                   │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ FloatingChat (Independent overlay)                 │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy - Student Management Example

```
┌─────────────────────────────────────────────────────────────┐
│                  ApprenantsPage.tsx                         │
│            (src/pages/Apprenants.tsx)                       │
│                                                             │
│           ↓                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ DashboardLayout                                       │  │
│  │                                                       │  │
│  │  ↓                                                    │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Apprenants Screen Component                     │ │  │
│  │  │ (src/screens/Admin/Apprenants.tsx)              │ │  │
│  │  │                                                 │ │  │
│  │  │  State Management:                              │ │  │
│  │  │  - students: Student[]                          │ │  │
│  │  │  - loading, pagination                          │ │  │
│  │  │  - filters (formation, company, dates)          │ │  │
│  │  │  - modals (form, details, courses)              │ │  │
│  │  │  - selection (for export)                       │ │  │
│  │  │                                                 │ │  │
│  │  │  Services Used:                                 │ │  │
│  │  │  - studentsService.getStudents()                │ │  │
│  │  │  - companiesService.getCompaniesList()          │ │  │
│  │  │  - courseCreation.getCourses()                  │ │  │
│  │  │  - useStudentsExportWithSelection()             │ │  │
│  │  │                                                 │ │  │
│  │  │  Renders:                                       │ │  │
│  │  │  - Search/Filter UI                             │ │  │
│  │  │  - Students Table/List                          │ │  │
│  │  │  - Pagination                                   │ │  │
│  │  │  - Bulk actions (export, delete)                │ │  │
│  │  │  - Modals for CRUD operations                   │ │  │
│  │  │                                                 │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │ StudentFormModal (Create/Edit)           │  │ │  │
│  │  │  │ - StudentFormModal.tsx                   │  │ │  │
│  │  │  │ - Contains AvatarUpload & SearchableSelect│ │  │ │  │
│  │  │  │ - Form validation & submission           │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  │                                                 │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │ StudentDetailsModal (View)                │  │ │  │
│  │  │  │ - StudentDetailsModal.tsx                 │  │ │  │
│  │  │  │ - Displays student info                  │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  │                                                 │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │ StudentCoursesModal (Courses)             │  │ │  │
│  │  │  │ - StudentCoursesModal.tsx                 │  │ │  │
│  │  │  │ - Lists enrolled courses                 │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  │                                                 │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │ StudentSessionsModal (Sessions)           │  │ │  │
│  │  │  │ - StudentSessionsModal.tsx                │  │ │  │
│  │  │  │ - Lists enrolled sessions                │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  │                                                 │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │ ConfirmationModal (Delete)                │  │ │  │
│  │  │  │ - ui/confirmation-modal.tsx               │  │ │  │
│  │  │  │ - Confirms deletion action                │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow & Services

```
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                            │
│           (API Communication & Data Fetching)               │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ api.ts (Axios Instance)                                │ │
│  │ - Base URL configuration                               │ │
│  │ - Auth token management                                │ │
│  │ - Request/Response interceptors                         │ │
│  │ - Error handling                                        │ │
│  │ - Subdomain-aware API calls                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                        ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Feature-Specific Services                              │ │
│  │                                                        │ │
│  │ - Students.ts → studentService.getStudents()           │ │
│  │ - Companies.ts → companiesService.getCompaniesList()   │ │
│  │ - courseCreation.ts → courseCreation.getCourses()      │ │
│  │ - quiz.ts → quizService operations                     │ │
│  │ - trainers.ts → trainersService operations             │ │
│  │ - commercial.ts → commercial features                  │ │
│  │ - qualityManagement.ts → quality features              │ │
│  │ - chat.ts → messaging & chat                           │ │
│  │ - news.ts → news & events                              │ │
│  │ - And 15+ more...                                      │ │
│  │                                                        │ │
│  │ Each service exports:                                  │ │
│  │ - CRUD operations (create, read, update, delete)       │ │
│  │ - Typed responses (Success, Error handling)            │ │
│  │ - TypeScript interfaces for data shapes                │ │
│  └────────────────────────────────────────────────────────┘ │
│                        ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Backend API (http://localhost:8000)                     │ │
│  │                                                        │ │
│  │ /api/students                                          │ │
│  │ /api/companies                                         │ │
│  │ /api/courses                                           │ │
│  │ /api/quality/*                                         │ │
│  │ And all other endpoints...                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## State Management Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              State Management Hierarchy                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ GLOBAL STATE (React Context)                         │   │
│  │                                                      │   │
│  │ - ThemeContext                                       │   │
│  │   └─> isDark, toggleTheme()                          │   │
│  │                                                      │   │
│  │ - LanguageContext                                    │   │
│  │   └─> currentLanguage, t() (translate)              │   │
│  │                                                      │   │
│  │ - OrganizationContext                                │   │
│  │   └─> organization, primary_color, loading           │   │
│  │                                                      │   │
│  │ - AuthContext                                        │   │
│  │   └─> user, isAuthenticated, login(), logout()      │   │
│  │                                                      │   │
│  │ - CourseCreationContext / CourseCreationContextV2    │   │
│  │   └─> Course data during creation wizard             │   │
│  │                                                      │   │
│  │ - SessionCreationContext                             │   │
│  │   └─> Session data during creation                   │   │
│  │                                                      │   │
│  │ - PermissionErrorContext                             │   │
│  │   └─> Permission error handling                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ COMPONENT-LEVEL STATE (useState)                     │   │
│  │                                                      │   │
│  │ Local state for:                                     │   │
│  │ - Form data & validation errors                      │   │
│  │ - Modal open/close state                             │   │
│  │ - Selected items (for bulk operations)               │   │
│  │ - Loading & error states                             │   │
│  │ - Pagination & filter values                         │   │
│  │ - Temporary UI state (expanding, scrolling, etc)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CUSTOM HOOKS (Data fetching & complex logic)         │   │
│  │                                                      │   │
│  │ - usePermissions() → Check user permissions          │   │
│  │ - useSubdomainNavigation() → Navigate with subdomain │   │
│  │ - useStudentsExportWithSelection() → Export logic    │   │
│  │ - useQuality*() → Quality feature hooks              │   │
│  │ - useCompaniesSearch() → Search with debouncing      │   │
│  │ - useChat() → Chat functionality                     │   │
│  │ - useNews() → News management                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PERSISTENT STATE (Cookies/LocalStorage)              │   │
│  │                                                      │   │
│  │ - Auth tokens (httpOnly cookies from backend)        │   │
│  │ - Redirect path after login (sessionStorage)         │   │
│  │ - User preferences (theme, language)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Sidebar Navigation Structure (Detailed)

```
CommercialSidebar
│
├─ Dashboard
│  └─> Tableau de bord
│
├─ Commercial Section
│  ├─> Invoices (Mes Factures)
│  ├─> Quotes (Mes Devis)
│  ├─> Articles (Mes Articles)
│  └─> Charges & Expenses (Charges Dépenses)
│
├─ Training & Formation
│  ├─> Course Management (Gestion Formations)
│  ├─> Sessions (Sessions)
│  ├─> Quizzes (Gestion Quizz)
│  ├─> Pedagogical Support (Supports Pédagogiques)
│  └─> Trainers (Formateurs)
│
├─ People Management
│  ├─> Students (Apprenants)
│  ├─> Companies (Entreprises)
│  └─> Funders (Financeurs)
│
├─ Administration
│  ├─> Organization (Gestion Organisme)
│  ├─> Users (Gestion Utilisateurs)
│  ├─> Messaging (Messagerie)
│  ├─> News (Actualités)
│  └─> Events (Événements)
│
├─ Quality Management
│  ├─> Indicators (Indicateurs)
│  ├─> Documents (Documents)
│  └─> BPF (Best Practices Framework)
│
└─ White Label
   ├─> Identity (Identité)
   ├─> Library (Bibliothèque)
   ├─> Identifiers (Identifiants)
   └─> Plans (Formules)

Features:
✓ Collapsible sub-menus
✓ Active state indication (left border + background)
✓ Organization color branding
✓ Permission-based visibility
✓ Mobile responsive with toggle
✓ Dark/light mode styling
✓ Smooth transitions & animations
```

## File Organization by Feature

```
src/
├── pages/                          # Route page wrappers (57 files)
│   ├── DashboardPage.tsx
│   ├── Apprenants.tsx             (Students page)
│   ├── Entreprises.tsx            (Companies page)
│   └── ...
│
├── screens/                        # Feature implementations
│   ├── Admin/
│   │   ├── Apprenants.tsx         (Student logic)
│   │   ├── Entreprises.tsx        (Company logic)
│   │   ├── Financeurs.tsx         (Funder logic)
│   │   ├── TrainersManagement.tsx
│   │   └── ...
│   ├── GestionDesFormations/
│   ├── Sessions/
│   ├── GestionDesQuizz/
│   ├── Quality/
│   ├── SuperAdmin/
│   └── ...
│
├── components/                     # Reusable UI components
│   ├── ui/                         (Shadcn primitives)
│   ├── CommercialDashboard/        (Main layout)
│   ├── Students/                   (Student modals & forms)
│   ├── Companies/
│   ├── CourseCreation/             (Multi-step wizard)
│   ├── SessionCreation/            (Multi-step wizard)
│   ├── QualityDashboard/
│   ├── Quiz/
│   ├── SuperAdminDashboard/
│   └── ...
│
├── contexts/                       # Global state
│   ├── AuthContext.tsx
│   ├── OrganizationContext.tsx
│   ├── ThemeContext.tsx
│   ├── LanguageContext.tsx
│   ├── CourseCreationContext.tsx
│   ├── SessionCreationContext.tsx
│   └── PermissionErrorContext.tsx
│
├── hooks/                          # Custom React hooks
│   ├── usePermissions.ts
│   ├── useSubdomainNavigation.ts
│   ├── useStudentsExportWithSelection.ts
│   ├── useQualityIndicators.ts
│   └── ... (15+ custom hooks)
│
├── services/                       # API services
│   ├── api.ts                      (Axios config)
│   ├── Students.ts
│   ├── Companies.ts
│   ├── courseCreation.ts
│   ├── quiz.ts
│   ├── trainers.ts
│   ├── qualityManagement.ts
│   ├── commercial.ts
│   └── ... (20+ services)
│
├── utils/                          # Helper functions
│   ├── permissionMappings.ts
│   ├── dateFormatter.ts
│   ├── organizationUrlManager.ts
│   └── ...
│
├── locales/                        # i18n translations
│   ├── en.json
│   ├── fr.json
│   └── ...
│
├── router/
│   └── AppRouter.tsx               # Route definitions
│
├── App.tsx                         # Context providers
├── index.tsx                       # Entry point
└── config/                         # Configuration

```

## Key Design Principles

1. **Separation of Concerns**
   - Pages (routing) → Layouts (structure) → Screens (logic) → Components (UI)

2. **Composition over Inheritance**
   - Use React composition for reusable UI patterns

3. **Context for Global State**
   - Theme, Language, Auth, Organization globally accessible

4. **Services for API**
   - Centralized API calls in service layer
   - Consistent error handling & response types

5. **Hooks for Logic Reuse**
   - Extract complex logic into custom hooks
   - Keep components focused on rendering

6. **Modal Pattern**
   - Forms, details, confirmations use modals
   - Consistent UX across all features

7. **Permission-Based Rendering**
   - Show/hide UI elements based on user role
   - Controlled via permission context & hooks

8. **Subdomain-Aware Routing**
   - Multi-tenant support via URL subdomains
   - Organization-specific content isolation

