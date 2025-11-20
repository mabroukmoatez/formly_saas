# Formly SaaS - Frontend Documentation Index

This directory contains comprehensive documentation about the frontend codebase. Start here to navigate the project structure, understand the architecture, and learn how to develop new features.

---

## Documentation Files

### 1. FRONTEND_STRUCTURE_OVERVIEW.md
**Comprehensive project structure and organization guide**
- Complete project information (stack, tools, versions)
- Detailed directory structure and file organization
- Page and layout component patterns
- Sidebar navigation structure
- Student management components and pages
- Layout patterns used across the application
- Routing structure and categories
- Component organization by purpose
- State management architecture
- Styling and theming approach
- Internationalization (i18n) setup
- Key files to understand first
- Development server configuration

**Best for**: Understanding the overall architecture, finding where code is located, understanding how features are organized

---

### 2. FRONTEND_ARCHITECTURE_DIAGRAM.md
**Visual diagrams and flow charts of the system**
- Application flow and component hierarchy
- Routing structure diagrams
- Page and layout structure
- Component hierarchy example (Student Management)
- Data flow and services architecture
- State management hierarchy
- Sidebar navigation structure (detailed)
- File organization by feature
- Key design principles

**Best for**: Visual learners, understanding data flow, understanding component relationships, seeing the big picture

---

### 3. FRONTEND_QUICK_START.md
**Practical guide for developers**
- Getting started setup and installation
- Project navigation and key files
- Common development tasks with code examples
- Adding new pages and features
- Creating modal form components
- Using services and API calls
- Adding translations
- Using context providers
- Component patterns and examples
- Routing guide with examples
- Forms and validation patterns
- Styling tips
- Debugging and troubleshooting
- Common issues and solutions
- Performance optimization tips
- Useful commands
- API endpoints reference

**Best for**: Developers building features, learning how to do common tasks, finding code examples, troubleshooting issues

---

## Quick Navigation

### Understanding the Project
1. Start with **FRONTEND_STRUCTURE_OVERVIEW.md** - Section 1-2
2. Review **FRONTEND_ARCHITECTURE_DIAGRAM.md** - Application Flow section
3. Skim **FRONTEND_QUICK_START.md** - Getting Started section

### Building a New Feature
1. Read **FRONTEND_QUICK_START.md** - "Common Development Tasks" section
2. Reference **FRONTEND_ARCHITECTURE_DIAGRAM.md** - "Component Hierarchy" for pattern examples
3. Check **FRONTEND_STRUCTURE_OVERVIEW.md** - Section 8 (Key Architectural Patterns)

### Understanding Student Management
1. Read **FRONTEND_STRUCTURE_OVERVIEW.md** - Section 4 (Student-Related Pages)
2. View **FRONTEND_ARCHITECTURE_DIAGRAM.md** - "Component Hierarchy - Student Management Example"
3. Review **FRONTEND_QUICK_START.md** - "Component Patterns" section

### Debugging Issues
1. Check **FRONTEND_QUICK_START.md** - "Common Issues & Solutions" section
2. Review **FRONTEND_QUICK_START.md** - "Debugging Tips" section
3. Reference **FRONTEND_ARCHITECTURE_DIAGRAM.md** - State Management Architecture

### Understanding Routing
1. Read **FRONTEND_STRUCTURE_OVERVIEW.md** - Section 6 (Routing Structure)
2. View **FRONTEND_ARCHITECTURE_DIAGRAM.md** - "Routing Structure" diagram
3. Reference **FRONTEND_QUICK_START.md** - "Routing Guide" section

### Learning Component Patterns
1. **FRONTEND_STRUCTURE_OVERVIEW.md** - Section 5 (Layout Patterns)
2. **FRONTEND_ARCHITECTURE_DIAGRAM.md** - "Component Hierarchy" example
3. **FRONTEND_QUICK_START.md** - "Component Patterns" section

---

## Key Files in the Codebase

### Essential Files to Understand
```
src/
├── App.tsx                                  # Context providers stack
├── index.tsx                                # React entry point
├── router/AppRouter.tsx                     # All route definitions (2070+ lines)
├── components/CommercialDashboard/
│   ├── Layout.tsx                          # Main layout wrapper
│   ├── Sidebar.tsx                         # Navigation sidebar
│   ├── Header.tsx                          # Top navigation
│   └── Footer.tsx                          # Footer
├── pages/                                   # Page wrappers (57 files)
├── screens/Admin/
│   ├── Apprenants.tsx                      # Student management
│   └── ... (other features)
├── contexts/                                # Global state (9 files)
├── hooks/                                   # Custom hooks (15+ files)
├── services/                                # API services (20+ files)
├── utils/                                   # Utilities (6 files)
└── locales/                                 # Translations

vite.config.ts                               # Build configuration
tailwind.config.js                           # Styling configuration
```

### By Feature - Student Management
```
src/
├── pages/Apprenants.tsx                    # Page wrapper
├── screens/Admin/Apprenants.tsx            # Logic & UI
├── components/Students/
│   ├── StudentFormModal.tsx                # Create/edit form
│   ├── StudentDetailsModal.tsx             # View details
│   ├── StudentCoursesModal.tsx             # View courses
│   ├── StudentSessionsModal.tsx            # View sessions
│   ├── SearchableSelect.tsx                # Search dropdown
│   └── AvatarUpload.tsx                    # Image upload
├── services/Students.ts                    # API calls
└── hooks/useStudentsExportWithSelection.ts # Custom logic
```

---

## Common Tasks Reference

| Task | Document | Section |
|------|----------|---------|
| Add new page | QUICK_START | "Common Development Tasks" |
| Create modal form | QUICK_START | "Adding a Modal Form Component" |
| Use API service | QUICK_START | "Using Services for API Calls" |
| Add translation | QUICK_START | "Adding Translations" |
| Use theme colors | QUICK_START | "Using Organization Context" |
| Understand routing | STRUCTURE or DIAGRAM | Section 6 or "Routing Structure" |
| Find component location | STRUCTURE | Section 7 "Component Organization" |
| Understand data flow | DIAGRAM | "Data Flow & Services" |
| Debug state issue | QUICK_START | "Debugging Tips" or "Common Issues" |
| Style a component | QUICK_START | "Styling Tips" |

---

## Architecture Overview

### Layers (Top to Bottom)
```
Pages (src/pages/)
  ↓ Wraps with layout
Layouts (src/components/{Feature}Layout.tsx)
  ↓ Displays content
Screens (src/screens/{Feature}/)
  ↓ Fetches data via
Services (src/services/{Feature}.ts)
  ↓ Calls
Backend API (http://localhost:8000)

State Management:
- Global: React Context (Theme, Language, Organization, Auth)
- Component: useState
- Async: Custom Hooks + Services
```

### Key Patterns
1. **Page + Layout + Screen**: Pages wrap screens with layouts
2. **Modal-Based Interactions**: Forms and details use modal components
3. **Service Layer**: All API calls go through services
4. **Context Providers**: Global state via React Context
5. **Custom Hooks**: Reusable logic extraction
6. **Permission-Based Rendering**: Show/hide based on user role

---

## Development Workflow

### Setting Up
1. `cd frontend && npm install`
2. `npm run dev` to start dev server
3. Open http://localhost:5173

### Creating a New Feature
1. Create screen in `src/screens/{Feature}/`
2. Create page in `src/pages/{Feature}Page.tsx`
3. Add route in `src/router/AppRouter.tsx`
4. Create components in `src/components/{Feature}/`
5. Create service in `src/services/{Feature}.ts` (if needed)
6. Add sidebar menu item
7. Add i18n translations

### Best Practices
- Keep components focused and small
- Use TypeScript for type safety
- Follow existing patterns
- Write meaningful commit messages
- Test in both light and dark modes
- Test responsive design
- Handle loading and error states

---

## Learning Path by Role

### Frontend Engineer (First Time)
1. Read STRUCTURE - Sections 1-3
2. Read DIAGRAM - Application Flow & Routing
3. Read QUICK_START - Getting Started & Common Tasks
4. Review actual code: `src/pages/Apprenants.tsx`, `src/screens/Admin/Apprenants.tsx`
5. Build a simple feature following the patterns

### Senior Developer / Tech Lead
1. Review STRUCTURE - All sections
2. Review DIAGRAM - All diagrams
3. Review QUICK_START - Performance & Design Principles
4. Audit code organization and patterns
5. Plan architecture improvements

### Designer / Product Manager
1. Read STRUCTURE - Sections 1-3, 6
2. Review DIAGRAM - Application Flow & Routing
3. Understand sidebar navigation structure
4. Know where components are located
5. Understand responsive design approach

### QA / Tester
1. Read QUICK_START - Routing Guide
2. Read STRUCTURE - Section 6 (Routing)
3. Understand common workflows
4. Learn about different user roles and permissions
5. Review state management for testing scenarios

---

## Important Concepts

### Multi-Tenancy (Subdomains)
- Routes support `/:subdomain/page` pattern
- Organization context provides branding (colors, data)
- API calls aware of organization context
- See QUICK_START for subdomain navigation

### Internationalization (i18n)
- Uses i18next framework
- Translations in `src/locales/`
- Access via `useLanguage()` hook
- Pattern: `t('section.key')`

### Theming (Dark/Light Mode)
- Uses ThemeContext
- Access via `useTheme()` hook
- CSS class-based: `dark:` prefix in Tailwind
- Organization primary color support

### Permissions
- Role-based visibility
- `usePermissions()` hook for checking
- Menu items respect permissions
- `shouldShowMenuItem()` utility function

### State Management
- Global: React Context (7 providers)
- Component: useState
- Async: Custom Hooks + Services
- Persistent: localStorage, sessionStorage, cookies

---

## Troubleshooting Guide

### Page not loading
1. Check route in AppRouter.tsx
2. Verify page component exists
3. Check browser console for errors

### Component not rendering
1. Check component import path
2. Verify TypeScript types
3. Check if wrapped in required provider

### API calls failing
1. Check service method implementation
2. Verify backend URL in vite.config.ts
3. Check browser Network tab
4. Verify authentication token

### Styling issues
1. Check Tailwind classes
2. Verify dark mode classes
3. Check z-index conflicts
4. Review responsive breakpoints

### State not updating
1. Check useState dependency array
2. Verify state setter is called
3. Check useEffect cleanup
4. Review context provider wrapper

---

## File Structure Quick Reference

```
frontend/
├── src/
│   ├── App.tsx                    # Entry with providers
│   ├── index.tsx                  # ReactDOM render
│   ├── pages/                     # Page wrappers (57)
│   ├── screens/                   # Feature screens
│   ├── components/                # Reusable components
│   │   ├── ui/                   # shadcn primitives
│   │   ├── CommercialDashboard/  # Main layout
│   │   └── {Feature}/            # Feature-specific
│   ├── contexts/                  # Global state (9)
│   ├── hooks/                     # Custom hooks (15+)
│   ├── services/                  # API services (20+)
│   ├── utils/                     # Helpers
│   ├── locales/                   # Translations
│   ├── router/                    # Routes
│   ├── config/                    # Config
│   ├── i18n.ts                    # i18n setup
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── index.html                     # HTML entry
├── vite.config.ts                 # Vite config
├── tailwind.config.js             # Tailwind config
├── tailwind.css                   # Tailwind utilities
├── tsconfig.*.json                # TypeScript config
└── package.json                   # Dependencies
```

---

## Getting Help

1. **Code Questions**: Check QUICK_START "Component Patterns" section
2. **Architecture Questions**: Check STRUCTURE and DIAGRAM docs
3. **Debugging**: Check QUICK_START "Debugging Tips" and "Common Issues"
4. **API Integration**: Check QUICK_START "Using Services for API Calls"
5. **Styling**: Check QUICK_START "Styling Tips" section
6. **Routing**: Check QUICK_START "Routing Guide" section

---

## Next Steps

1. **Beginners**: Start with QUICK_START "Getting Started"
2. **New Features**: Follow QUICK_START "Common Development Tasks"
3. **Architecture Review**: Study DIAGRAM and STRUCTURE documents
4. **Deep Dive**: Read actual source code and trace feature flow
5. **Contribute**: Make small improvements, follow patterns

---

## Document Maintenance

These docs were last updated: **2025-11-20**
- Covers: React 18.2, TypeScript, Vite 6.4, Tailwind 3.4, React Router v6
- For updates: Add to existing sections or create new documentation files
- Keep patterns consistent with existing code
- Update when adding major features

---

**Happy Coding!**

For questions, refer to the appropriate documentation section above or review the actual source code.

