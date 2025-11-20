// Export all SuperAdmin screens with SuperAdmin prefix for compatibility
export { SystemSettings as SuperAdminSystemSettings } from './SystemSettings';
export { Users as SuperAdminUsers } from './Users';
export { Courses as SuperAdminCourses } from './Courses';
export { Students as SuperAdminStudents } from './Students';
export { Instructors as SuperAdminInstructors } from './Instructors';
export { Certificates as SuperAdminCertificates } from './Certificates';
export { Categories as SuperAdminCategories } from './Categories';
export { Tags as SuperAdminTags } from './Tags';
export { CourseLanguages as SuperAdminCourseLanguages } from './CourseLanguages';
export { DifficultyLevels as SuperAdminDifficultyLevels } from './DifficultyLevels';
export { Payouts as SuperAdminPayouts } from './Payouts';
export { Promotions as SuperAdminPromotions } from './Promotions';
export { Blogs as SuperAdminBlogs } from './Blogs';
export { EmailTemplates as SuperAdminEmailTemplates } from './EmailTemplates';
export { Notifications as SuperAdminNotifications } from './Notifications';
export { Analytics as SuperAdminAnalytics } from './Analytics';
export { Reports as SuperAdminReports } from './Reports';
export { SupportTickets as SuperAdminSupportTickets } from './SupportTickets';
export { Features as SuperAdminFeatures } from './Features';
export { Localization as SuperAdminLocalization } from './Localization';
export { Maintenance as SuperAdminMaintenance } from './Maintenance';

// Additional exports based on backend API
export { QualityArticles as SuperAdminQualityArticles } from './QualityArticles';
export { News as SuperAdminNews } from './News';
export { MarginSimulator as SuperAdminMarginSimulator } from './MarginSimulator';
export { AwsCosts as SuperAdminAwsCosts } from './AwsCosts';
export { Integrations as SuperAdminIntegrations } from './Integrations';

// Legacy exports (for existing components)
export { SuperAdminAuditLogs } from './AuditLogs';
export { SuperAdminRoles } from './Roles';

// Also export the existing components for backward compatibility
export { SuperAdminOrganizations } from './Organizations';
export { SuperAdminPlans } from './Plans';
export { SuperAdminSubscriptions } from './Subscriptions';
export { SuperAdminInstances } from './Instances';
export { SuperAdminCoupons } from './Coupons';
