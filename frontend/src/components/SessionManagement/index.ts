/**
 * Session Management Components
 * 
 * Complete session management system with:
 * - Dashboard views for participants and trainers
 * - List and calendar views for sessions
 * - Detail modals for sessions, attendance, and workflow
 * - Course selection for session creation
 */

// Types
export * from './types';

// Main Components
export { SessionDashboard } from './SessionDashboard';
export { SessionParticipantsView } from './SessionParticipantsView';
export { SessionListView } from './SessionListView';
export { SessionCalendarView } from './SessionCalendarView';

// Modals
export { SessionDetailsModal } from './SessionDetailsModal';
export { SessionActionModal } from './SessionActionModal';
export { CreateSessionModal } from './CreateSessionModal';
export { AttendanceModal, AttendanceEditModal } from './AttendanceModal';
export { AttendanceCodeValidator } from './AttendanceCodeValidator';
export { CourseSelectModal } from './CourseSelectModal';
