import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { LogoutHandler } from '../components/LogoutHandler';
import { ScrollManager } from '../components/ScrollManager';

// Import SuperAdmin components
import { SuperAdminLayout, SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { 
  SuperAdminOrganizations, 
  SuperAdminPlans, 
  SuperAdminSubscriptions, 
  SuperAdminInstances, 
  SuperAdminCoupons, 
  SuperAdminAuditLogs, 
  SuperAdminRoles,
  SuperAdminSystemSettings,
  SuperAdminUsers,
  SuperAdminStudents,
  SuperAdminInstructors,
  SuperAdminCourses,
  SuperAdminCertificates,
  SuperAdminCategories,
  SuperAdminTags,
  SuperAdminCourseLanguages,
  SuperAdminDifficultyLevels,
  SuperAdminPayouts,
  SuperAdminPromotions,
  SuperAdminBlogs,
  SuperAdminEmailTemplates,
  SuperAdminNotifications,
  SuperAdminAnalytics,
  SuperAdminReports,
  SuperAdminSupportTickets,
  SuperAdminFeatures,
  SuperAdminLocalization,
  SuperAdminMaintenance,
  SuperAdminQualityArticles,
  SuperAdminNews,
  SuperAdminMarginSimulator,
  SuperAdminAwsCosts,
  SuperAdminIntegrations
} from '../screens/SuperAdmin';

// Import screens
import { LogIn } from '../screens/LogIn';
import { ForgotPassword } from '../screens/ForgotPassword';
import { SetupPassword } from '../screens/SetupPassword/SetupPassword';
import { Landing } from '../screens/Landing/Landing';
import { OrganizationSignup } from '../screens/Signup/OrganizationSignup';
import { GestionComercial } from '../screens/GestionComercial';
import { WhiteLabelNew, WhiteLabelIdentity, WhiteLabelLibrary, WhiteLabelIdentifiers, WhiteLabelPlansPage } from '../screens/WhiteLabel';
import { EmailTemplateCreationPage } from '../pages/EmailTemplateCreationPage';
import { Statistiques } from '../screens/Statistiques';
import { Sessions } from '../screens/Sessions';
import { GestionDesQuizz } from '../screens/GestionDesQuizz';
import { SupportsPedagogiques } from '../screens/SupportsPedagogiques';
import { GestionDesFormations } from '../screens/GestionDesFormations';
import { CourseCreationPage } from '../pages/CourseCreationPage';
import { CourseViewPage } from '../pages/CourseViewPage';
import { CourseEditPage } from '../pages/CourseEditPage';
import { DocumentPreviewPage } from '../pages/DocumentPreviewPage';
import { QuizPage } from '../pages/QuizPage';
import { QuizCreationPage } from '../pages/QuizCreationPage';
import { QuizViewPage } from '../pages/QuizViewPage';
import { QuizEditPage } from '../pages/QuizEditPage';
import { SessionCreationPage } from '../pages/SessionCreationPage';
import { SessionViewPage } from '../pages/SessionViewPage';
import { SessionEditPage } from '../pages/SessionEditPage';
import { QualityPage } from '../pages/QualityPage';
import { IndicateursPage } from '../pages/IndicateursPage';
import { IndicatorDetailPage } from '../pages/IndicatorDetailPage';
import { IndicatorSettingsPage } from '../pages/IndicatorSettingsPage';
import { IndicatorTrainingPage } from '../pages/IndicatorTrainingPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { ArticlesPage } from '../pages/ArticlesPage';
import { ArticleDetailPage } from '../pages/ArticleDetailPage';
import { BPFPage } from '../pages/BPFPage';
import { BPFFormPage } from '../pages/BPFFormPage';
import { ActionsAndTasksPage } from '../pages/ActionsAndTasksPage';
import GestionOrganismePage from '../pages/GestionOrganismePage';
import MessageriePage from '../pages/MessageriePage';
import ActualitesPage from '../pages/ActualitesPage';
import ActualitesCreatePage from '../pages/ActualitesCreatePage';
import ActualitesEditPage from '../pages/ActualitesEditPage';
import { NewsViewPage } from '../pages/NewsViewPage';
import EvenementsPage from '../pages/EvenementsPage';
import EvenementsCreationPage from '../pages/EvenementsCreationPage';
import EvenementsEditPage from '../pages/EvenementsEditPage';
import { EventViewPage } from '../pages/EventViewPage';
import PlanningsPage from '../pages/PlanningsPage';
import RapportsStatistiquesPage from '../pages/RapportsStatistiquesPage';
import DashboardPage from '../pages/DashboardPage';
import GestionUtilisateursPage from '../pages/GestionUtilisateursPage';
import TrainersPage from '../pages/TrainersPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import SupportTicketsPage from '../pages/SupportTicketsPage';
import MesFacturesPage from '../pages/MesFacturesPage';
import InvoiceCreationPage from '../pages/InvoiceCreationPage';
import { DocumentCreationPage } from '../pages/DocumentCreationPage';
import { QuestionnaireCreationPage } from '../pages/QuestionnaireCreationPage';
import InvoiceViewPage from '../pages/InvoiceViewPage';
import MesDevisPage from '../pages/MesDevisPage';
import { QuoteCreationPage } from '../pages/QuoteCreationPage';
import { QuoteViewPage } from '../pages/QuoteViewPage';
import MesArticlesPage from '../pages/MesArticlesPage';
import ChargesDepensesPage from '../pages/ChargesDepensesPage';
import { AccessDenied } from '../screens/AccessDenied';
import { OrganizationNotFound } from '../screens/OrganizationNotFound';
import ApprenantsPage from '../pages/Apprenants';
import EntreprisesPage from '../pages/Entreprises';
import FinanceursPage from '../pages/Financeurs';
import { 
  LearnerDashboard, 
  Learning,
  CourseDetails,
  Documents, 
  Attendance, 
  Absences, 
  Calendar, 
  Catalog, 
  Messaging, 
  SharedFolders, 
  Results, 
  Profile
} from '../screens/Learner';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  // requiredRole removed - all authenticated users can access all routes
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const location = useLocation();

  // Clean up stale sessionStorage redirectAfterLogin value when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedPath = sessionStorage.getItem('redirectAfterLogin');
      // Only remove if we're not currently on the saved path or if it's a stale value
      if (savedPath && savedPath !== location.pathname) {
        sessionStorage.removeItem('redirectAfterLogin');
      }
    }
  }, [isAuthenticated, user, location.pathname]);

  // ('🔒 ProtectedRoute - Path:', location.pathname, 'Auth:', isAuthenticated, 'Loading:', loading, orgLoading);

  // Show loading while checking authentication and organization
  if (loading || orgLoading) {
    // ('⏳ ProtectedRoute - Loading...');
    return <LoadingScreen />;
  }

  // Only redirect to login if we're sure user is NOT authenticated (after loading is complete)
  // During initial load, isAuthenticated might be false, so we wait for loading to finish
  if (!loading && !orgLoading && !isAuthenticated) {
    // ('❌ Not authenticated, saving current path and redirecting to login');
    // ('📍 Current path to save:', location.pathname);
    
    // Check if this is a public route - don't redirect if it is
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const isPublicRoute = 
      location.pathname.includes('/login') || 
      location.pathname.includes('/forgot-password') ||
      location.pathname.includes('/setup-password') ||
      (pathSegments.length === 2 && (lastSegment === 'login' || lastSegment === 'forgot-password' || lastSegment === 'setup-password')) ||
      (pathSegments.length === 1 && (pathSegments[0] === 'login' || pathSegments[0] === 'forgot-password' || pathSegments[0] === 'setup-password'));
    
    // Only save the path if it's not a public route
    if (!isPublicRoute) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
    
    // Don't redirect if we're on a public route - let PublicRoute handle it
    if (isPublicRoute) {
      return <>{children}</>;
    }
    
    // Redirect to organization-specific login if we have organization data
    if (organization?.custom_domain) {
      return <Navigate to={`/${organization.custom_domain}/login`} state={{ from: location.pathname }} replace />;
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role-based access removed - all authenticated users can access all routes
  // if (requiredRole && user?.role_name !== requiredRole) {
  //   // ('ProtectedRoute - unauthorized role:', user?.role_name, 'required:', requiredRole); // Debug log
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // Redirect to appropriate dashboard if no specific route
  if (!loading && !orgLoading && !user) {
    // Redirect to organization-specific login if we have organization data
    if (organization?.custom_domain) {
      return <Navigate to={`/${organization.custom_domain}/login`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { organization } = useOrganization();
  const location = useLocation();

  // ('🔓 PublicRoute - Path:', location.pathname, 'Auth:', isAuthenticated);

  // Redirect authenticated users to their dashboard or saved path
  if (isAuthenticated && user) {
    // ('✅ User authenticated, checking for saved redirect path...');
    
    // Check if there's a saved path to redirect to
    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    if (savedPath && savedPath !== location.pathname && savedPath !== '/' && !savedPath.includes('/login')) {
      // ('🔙 Redirecting back to saved path:', savedPath);
      sessionStorage.removeItem('redirectAfterLogin');
      return <Navigate to={savedPath} replace />;
    }
    
    // Only redirect to dashboard if we're on a public route like /login or /forgot-password
    // Don't redirect if we're already on a valid protected route
    const isPublicRoute = location.pathname === '/login' || location.pathname === '/forgot-password' || 
                          location.pathname.startsWith('/setup-password') ||
                          location.pathname.endsWith('/login') || location.pathname.endsWith('/forgot-password') ||
                          location.pathname.endsWith('/setup-password') ||
                          location.pathname === '/';
    
    if (isPublicRoute) {
      // Otherwise redirect to dashboard
      // ('🏠 No saved path, redirecting to dashboard...');
      
      // Check if user is a learner/apprenant
      // Note: user.role is a number, user.role_name is a string
      const roleName = user?.role_name;
      const roleNameStr = typeof roleName === 'string' ? roleName.toLowerCase() : '';
      const isLearner = roleNameStr.includes('learner') || 
                       roleNameStr.includes('apprenant') ||
                       roleNameStr === 'learner' ||
                       roleNameStr === 'apprenant';
      
      // Check if we're on a subdomain route
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const isSubdomainRoute = pathSegments.length > 1 && pathSegments[0] !== 'white-label' && pathSegments[0] !== 'superadmin';
      
      // ('📍 Path segments:', pathSegments, 'IsSubdomain:', isSubdomainRoute);
      
      if (isLearner) {
        // Redirect learner to learner dashboard
        if (isSubdomainRoute) {
          const subdomain = pathSegments[0];
          return <Navigate to={`/${subdomain}/learner/dashboard`} replace />;
        } else if (organization?.custom_domain) {
          return <Navigate to={`/${organization.custom_domain}/learner/dashboard`} replace />;
        } else {
          return <Navigate to="/learner/dashboard" replace />;
        }
      }
      
      if (isSubdomainRoute) {
        // We're on a subdomain route, redirect to subdomain dashboard
        const subdomain = pathSegments[0];
        // ('🔀 Redirecting to:', `/${subdomain}/dashboard`);
        return <Navigate to={`/${subdomain}/dashboard`} replace />;
      } else if (organization?.custom_domain) {
        // Not on subdomain route but have organization, redirect to subdomain dashboard
        // ('🔀 Redirecting to org dashboard:', `/${organization.custom_domain}/dashboard`);
        return <Navigate to={`/${organization.custom_domain}/dashboard`} replace />;
      } else {
        // No subdomain, redirect to regular dashboard
        // ('🔀 Redirecting to: /dashboard');
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // If user is NOT authenticated, allow public routes
  // Check if this is a public route (with or without subdomain)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  // Public routes without subdomain
  const isPublicRouteNoSubdomain = 
    pathSegments.length === 1 && 
    (pathSegments[0] === 'login' || 
     pathSegments[0] === 'forgot-password' || 
     pathSegments[0] === 'reset-password' || 
     pathSegments[0] === 'setup-password' ||
     pathSegments[0] === 'signup');
  
  // Public routes with subdomain (e.g., /edufirma/login, /edufirma/setup-password)
  const isPublicRouteWithSubdomain = 
    pathSegments.length === 2 && 
    (lastSegment === 'login' || 
     lastSegment === 'forgot-password' || 
     lastSegment === 'setup-password');
  
  // Routes starting with /setup-password (catch-all for setup-password)
  const isSetupPasswordRoute = location.pathname.includes('/setup-password');
  
  const isOnPublicRoute = isPublicRouteNoSubdomain || isPublicRouteWithSubdomain || isSetupPasswordRoute;
  const isOnSuperAdminRoute = pathSegments.length > 0 && pathSegments[0] === 'superadmin';
  
  // Always allow public routes and superadmin routes when not authenticated
  if (isOnPublicRoute || isOnSuperAdminRoute) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

/**
 * Organization Route Component
 * Handles organization-specific routing
 */
const OrganizationRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use organization hook - it will throw if not in provider, which is expected
  // The component should only be rendered inside OrganizationProvider
  const { organization, loading, error } = useOrganization();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !organization) {
    return <OrganizationNotFound />;
  }

  return <>{children}</>;
};

/**
 * White Label Redirect Component
 * Handles subdomain-aware routing for white label page
 */
const WhiteLabelRedirect: React.FC = () => {
  const { organization } = useOrganization();
  const location = useLocation();
  
  // Check if we're already on a subdomain route
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isSubdomainRoute = pathSegments.length > 1 && pathSegments[0] !== 'white-label';
  
  if (isSubdomainRoute) {
    // Already on subdomain route, render white label directly
    return <WhiteLabelNew />;
  }
  
  // Not on subdomain route, redirect to subdomain version if organization has custom domain
  if (organization?.custom_domain) {
    return <Navigate to={`/${organization.custom_domain}/white-label`} replace />;
  }
  
  // No subdomain, render white label directly
  return <WhiteLabelNew />;
};

/**
 * Unauthorized Page Component - now uses AccessDenied
 */
const UnauthorizedPage: React.FC = () => {
  return <AccessDenied />;
};

/**
 * Main App Router Component
 */
export const AppRouter: React.FC = () => {
  return (
    <Router>
      <ScrollManager />
      <LogoutHandler />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <OrganizationSignup />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LogIn />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/setup-password"
          element={
            <PublicRoute>
              <SetupPassword />
            </PublicRoute>
          }
        />

        {/* Organization-based Public Routes */}
        <Route
          path="/:subdomain/login"
          element={
            <PublicRoute>
              <LogIn />
            </PublicRoute>
          }
        />
        <Route
          path="/:subdomain/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/:subdomain/setup-password"
          element={
            <PublicRoute>
              <SetupPassword />
            </PublicRoute>
          }
        />

        {/* White Label Route - Smart subdomain handling */}
        <Route
          path="/white-label"
          element={
            <ProtectedRoute>
              <WhiteLabelRedirect />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/support-tickets"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SupportTicketsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/gestion-commercial"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionComercial />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/mes-factures"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesFacturesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/invoice-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <InvoiceCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/invoice-view/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <InvoiceViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quote-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuoteCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quote-view/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuoteViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/mes-devis"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesDevisPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/mes-articles"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesArticlesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/charges-depenses"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ChargesDepensesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionUtilisateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/role-management"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionUtilisateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/formateurs"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <TrainersPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/statistiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Statistiques />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/gestion-formations"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionDesFormations />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/gestion-quizz"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionDesQuizz />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/supports-pedagogiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SupportsPedagogiques />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/course-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/document-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/questionnaire-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuestionnaireCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/email-template-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EmailTemplateCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/course-view/:courseUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/course-edit/:uuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/session-view/:sessionUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/session-edit/:uuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/course/:courseUuid/document/:documentId"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentPreviewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quiz/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quiz/:quizUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quiz/edit/:quizUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quality"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QualityPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quality/indicateurs"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <IndicateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quality/documents"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/quality/bpf"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <BPFPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />

        {/* Admin Management Routes */}
        <Route
          path="/gestion-organisme"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionOrganismePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/messagerie"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MessageriePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/actualites"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/actualites/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesCreatePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/actualites/edit/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/actualites/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <NewsViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/evenements"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/evenements/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/evenements/edit/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/evenements/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EventViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/plannings"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <PlanningsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/rapports-statistiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <RapportsStatistiquesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        
        {/* Organization-based routes */}
        <Route
          path="/:subdomain/dashboard"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/profile"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/settings"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/support-tickets"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SupportTicketsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/gestion-commercial"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionComercial />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/mes-factures"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesFacturesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/invoice-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <InvoiceCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/invoice-view/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <InvoiceViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quote-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuoteCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quote-view/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuoteViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/mes-devis"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesDevisPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/mes-articles"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MesArticlesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/charges-depenses"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ChargesDepensesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/white-label"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelNew />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/white-label/identite"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelIdentity />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/white-label/identite"
          element={
            <ProtectedRoute>
              <WhiteLabelIdentity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/white-label/bibliotheque"
          element={
            <ProtectedRoute>
              <WhiteLabelLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/white-label/identifiants"
          element={
            <ProtectedRoute>
              <WhiteLabelIdentifiers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/white-label/formules"
          element={
            <ProtectedRoute>
              <WhiteLabelPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:subdomain/white-label/identite"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelIdentity />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/white-label/bibliotheque"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelLibrary />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/white-label/identifiants"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelIdentifiers />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/white-label/formules"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <WhiteLabelPlansPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/user-management"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionUtilisateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/role-management"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionUtilisateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/formateurs"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <TrainersPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/apprenants"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ApprenantsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/entreprises"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EntreprisesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/financeurs"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <FinanceursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/statistiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Statistiques />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/gestion-formations"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionDesFormations />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/sessions"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/gestion-quizz"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionDesQuizz />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/supports-pedagogiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SupportsPedagogiques />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/course-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/document-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/questionnaire-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuestionnaireCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/email-template-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EmailTemplateCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/session-creation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/session-creation/:sessionUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/course-view/:courseUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/course-edit/:uuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/session-view/:sessionUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/session-edit/:uuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SessionEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/course/:courseUuid/document/:documentId"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentPreviewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quiz"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quiz/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quiz/:quizUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quiz/edit/:quizUuid"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QuizEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <QualityPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/indicateurs"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <IndicateursPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/indicateurs/:id/formation"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <IndicatorTrainingPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/indicateurs/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <IndicatorDetailPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/indicateurs/parametres"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <IndicatorSettingsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/documents"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/articles/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ArticleDetailPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/articles"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ArticlesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/bpf"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <BPFPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/bpf/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <BPFFormPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/bpf/:id/edit"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <BPFFormPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/quality/actions"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActionsAndTasksPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />

        {/* Admin Management Routes with subdomain */}
        <Route
          path="/:subdomain/gestion-organisme"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <GestionOrganismePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/messagerie"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <MessageriePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/actualites"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/actualites"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/actualites/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesCreatePage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/actualites/edit/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <ActualitesEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/actualites/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <NewsViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/evenements"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/evenements/create"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsCreationPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/evenements/edit/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EvenementsEditPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/evenements/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <EventViewPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/plannings"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <PlanningsPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/rapports-statistiques"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <RapportsStatistiquesPage />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />

        {/* SuperAdmin Routes - No subdomain required */}
        {/* Learner Routes */}
        <Route
          path="/learner/dashboard"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <LearnerDashboard />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/learning"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/documents"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/attendance"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/absences"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Absences />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/calendar"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/catalog"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/messaging"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Messaging />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/shared-folders"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SharedFolders />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/results"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/profile"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/learner/courses/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/dashboard"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <LearnerDashboard />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/learning"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/documents"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/attendance"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/absences"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Absences />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/calendar"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/catalog"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/messaging"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Messaging />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/shared-folders"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <SharedFolders />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/results"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/profile"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />
        <Route
          path="/:subdomain/learner/courses/:id"
          element={
            <OrganizationRoute>
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            </OrganizationRoute>
          }
        />

        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminDashboard />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/organizations"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminOrganizations />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/plans"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminPlans />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/subscriptions"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminSubscriptions />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/instances"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminInstances />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/coupons"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminCoupons />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/audit-logs"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminAuditLogs />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/roles"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminRoles />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* System Settings */}
        <Route
          path="/superadmin/settings"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminSystemSettings />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/features"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminFeatures />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/localization"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminLocalization />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/maintenance"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminMaintenance />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* User Management */}
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminUsers />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/students"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminStudents />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/instructors"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminInstructors />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Courses & Learning */}
        <Route
          path="/superadmin/courses"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminCourses />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/certificates"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminCertificates />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Content Management */}
        <Route
          path="/superadmin/categories"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminCategories />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/tags"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminTags />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/course-languages"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminCourseLanguages />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/difficulty-levels"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminDifficultyLevels />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Payments & Promotions */}
        <Route
          path="/superadmin/payouts"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminPayouts />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/promotions"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminPromotions />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Communications */}
        <Route
          path="/superadmin/blogs"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminBlogs />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/email-templates"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminEmailTemplates />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/notifications"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminNotifications />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Reports & Analytics */}
        <Route
          path="/superadmin/analytics"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminAnalytics />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/reports"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminReports />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Support */}
        <Route
          path="/superadmin/tickets"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminSupportTickets />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Additional Features */}
        <Route
          path="/superadmin/quality-articles"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminQualityArticles />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/news"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminNews />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/margin-simulator"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminMarginSimulator />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/aws-costs"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminAwsCosts />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/integrations"
          element={
            <ProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminIntegrations />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <Navigate to="/superadmin/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Utility Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Default redirects */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          } 
        />
        {/* Catch-all for undefined routes - redirect to dashboard for authenticated users */}
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
