# Frontend Quick Start Guide

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation & Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Development server runs at: **http://localhost:5173**

---

## Project Navigation

### Key Files to Understand

1. **src/App.tsx** - App entry, context providers stack
2. **src/router/AppRouter.tsx** - All route definitions (2070+ lines)
3. **src/index.tsx** - ReactDOM render entry point
4. **src/components/CommercialDashboard/** - Main layout system
5. **src/pages/** - Page wrappers (one per route)
6. **src/screens/Admin/Apprenants.tsx** - Student management logic
7. **vite.config.ts** - Build and proxy configuration
8. **tailwind.config.js** - Styling configuration

---

## Common Development Tasks

### Adding a New Page

1. Create screen component in `src/screens/SomeFeature/`
2. Create page wrapper in `src/pages/SomeFeaturePage.tsx`
3. Add route in `src/router/AppRouter.tsx`
4. Add navigation menu item in sidebar data

```typescript
// src/pages/MyFeaturePage.tsx
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { MyFeatureScreen } from '../screens/MyFeature';

export const MyFeaturePage = () => {
  return (
    <DashboardLayout>
      <MyFeatureScreen />
    </DashboardLayout>
  );
};
export default MyFeaturePage;
```

### Adding a Modal Form Component

```typescript
// src/components/MyFeature/MyFormModal.tsx
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';

interface MyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MyFormModal: React.FC<MyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Call API service
      success('Success', 'Form submitted');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">{t('myfeature.title')}</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### Using Services for API Calls

```typescript
// Using an existing service
import { studentsService } from '../../services/Students';

const fetchStudents = async () => {
  try {
    const response = await studentsService.getStudents({ page: 1 });
    if (response.success) {
      setStudents(response.data);
    }
  } catch (error) {
    showError('Error', 'Failed to fetch students');
  }
};
```

### Adding Translations

1. Add keys to language files in `src/locales/`
2. Use in components with `useLanguage()` hook

```typescript
const { t } = useLanguage();
<h1>{t('common.welcome')}</h1>
<p>{t('myfeature.description')}</p>
```

### Using Theme Context

```typescript
import { useTheme } from '../../contexts/ThemeContext';

const MyComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className={isDark ? 'bg-gray-900' : 'bg-white'}>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};
```

### Using Organization Context

```typescript
import { useOrganization } from '../../contexts/OrganizationContext';

const MyComponent = () => {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  
  return (
    <button style={{ backgroundColor: primaryColor }}>
      Branded Button
    </button>
  );
};
```

---

## Component Patterns

### Pattern 1: Screen Component with Service Calls

```typescript
// src/screens/MyFeature/MyFeature.tsx
export const MyFeature = (): JSX.Element => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await myService.getItems();
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <LoadingScreen />;
  
  return (
    <div className="p-6">
      <h1>{t('myfeature.title')}</h1>
      {/* Content */}
    </div>
  );
};
```

### Pattern 2: Modal with Form Submission

```typescript
// Follow StudentFormModal.tsx pattern:
// 1. Accept isOpen, onClose, onSuccess props
// 2. Use useState for form data and errors
// 3. Validate before submit
// 4. Call service method
// 5. Show success/error toast
// 6. Refresh parent data via onSuccess callback
```

### Pattern 3: Table/List with Pagination

```typescript
// 1. Maintain state: items, page, total_pages, loading
// 2. Fetch data with pagination params
// 3. Render items with actions (edit, delete, view)
// 4. Render pagination controls
// 5. Use modals for detailed operations
```

---

## Routing Guide

### Route Types

**Public Routes** (no auth needed):
```
/login, /forgot-password, /signup, /setup-password
/:subdomain/login, /:subdomain/forgot-password
```

**Protected Routes** (auth required):
```
/dashboard, /apprenants, /entreprises, /profile, /settings
/:subdomain/dashboard, /:subdomain/apprenants, etc.
```

**SuperAdmin Routes** (special permission):
```
/superadmin/dashboard, /superadmin/users, /superadmin/courses, etc.
```

### Navigation Programmatically

```typescript
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/apprenants');
    // For subdomain navigation
    navigate(`/${subdomain}/apprenants`);
  };
};
```

### Route Parameters

```typescript
import { useParams } from 'react-router-dom';

// Route: /student/:id
const StudentDetail = () => {
  const { id } = useParams();
  // Use id to fetch student details
};
```

---

## Forms & Validation

### Input Validation Pattern

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.email.trim()) {
    newErrors.email = t('validation.required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = t('validation.invalidEmail');
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Form Input Component

```typescript
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    {t('form.email')}
  </label>
  <input
    type="email"
    value={formData.email}
    onChange={(e) => {
      setFormData({ ...formData, email: e.target.value });
      if (errors.email) setErrors({ ...errors, email: '' });
    }}
    className={`w-full px-3 py-2 border rounded ${
      errors.email ? 'border-red-500' : 'border-gray-300'
    }`}
  />
  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
</div>
```

---

## Styling Tips

### Using Tailwind Classes

- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes
- Dark mode: `dark:` prefix
- Hover states: `hover:`, `focus:`, `active:` prefixes

### Accessing Organization Colors

```typescript
const { organization } = useOrganization();
const primaryColor = organization?.primary_color || '#007aff';

// In JSX
<button style={{ backgroundColor: primaryColor }} />

// Or use the color in Tailwind (if configured)
className="bg-primary-color"
```

### Icon Usage

```typescript
import { Plus, Search, Trash2 } from 'lucide-react';

<Plus className="w-5 h-5" />
<Search className="w-4 h-4" />
<Trash2 className="w-5 h-5 text-red-500" />
```

---

## Debugging Tips

### Console Logging

```typescript
console.log('🔍 Debug:', variable);
console.error('❌ Error:', error);
console.warn('⚠️  Warning:', message);
```

### React DevTools
- Install React Developer Tools browser extension
- Inspect component hierarchy and props
- Check context values

### Network Tab
- Check API requests in browser DevTools Network tab
- Verify request/response payloads
- Check status codes and headers

### Local Storage / SessionStorage
```typescript
// Check auth state
localStorage.getItem('authToken');
sessionStorage.getItem('redirectAfterLogin');
```

---

## Common Issues & Solutions

### Issue: "Cannot GET /subdomain/page"
- **Cause**: Route not defined for subdomain variant
- **Solution**: Check AppRouter.tsx for matching `/:subdomain/page` route

### Issue: "useContext error"
- **Cause**: Using hook outside of provider
- **Solution**: Wrap component with required provider in App.tsx

### Issue: Component not updating after API call
- **Cause**: Not properly setting state or dependency array issue
- **Solution**: Check useState dependencies, ensure proper cleanup in useEffect

### Issue: Dark mode not applying
- **Cause**: ThemeContext not used or CSS not loaded
- **Solution**: Use `useTheme()` and check tailwind dark: classes

### Issue: API call 401 Unauthorized
- **Cause**: Auth token expired or invalid
- **Solution**: Check token in cookies, may need to login again

---

## Performance Tips

1. **Memoize Components**: Use `React.memo()` for components that don't need frequent rerenders
2. **useMemo for Expensive Calculations**: Wrap complex logic in `useMemo()`
3. **useCallback for Handlers**: Prevent unnecessary function recreations
4. **Lazy Load Routes**: Use `React.lazy()` for route splitting
5. **Pagination**: Always paginate large lists instead of loading all
6. **Debounce Search**: Use debounce for search inputs

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Build & Deploy
npm run build           # Build for production

# Linting (if configured)
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues

# Type Checking
npm run type-check      # Check TypeScript types

# Format Code (if configured)
npm run format          # Format code with prettier
```

---

## Important Endpoints

### API Base URL
- Development: `http://localhost:8000` (via proxy)
- Configured in: `src/services/api.ts`

### Common API Routes
```
GET    /api/students                 # List students
POST   /api/students                 # Create student
GET    /api/students/:id             # Get student
PUT    /api/students/:id             # Update student
DELETE /api/students/:id             # Delete student

GET    /api/companies                # List companies
GET    /api/courses                  # List courses
GET    /api/trainers                 # List trainers
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

---

## Additional Resources

- React Docs: https://react.dev
- React Router: https://reactrouter.com
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://www.radix-ui.com
- i18next: https://www.i18next.com
- TypeScript: https://www.typescriptlang.org

