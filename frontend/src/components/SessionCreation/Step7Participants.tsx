import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LegacyCollapsible } from '../ui/collapsible';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import type { SessionParticipant, SessionInstance } from '../../services/sessionCreation.types';

interface Step7ParticipantsProps {
  participants: SessionParticipant[];
  instances: SessionInstance[];
  onEnrollParticipant: (userId: number) => Promise<boolean>;
  onUpdateParticipantStatus: (participantId: number, status: string) => Promise<boolean>;
  onMarkAttendance: (instanceUuid: string, data: any) => Promise<boolean>;
  onGetAttendanceReport: () => Promise<any>;
  isLoading?: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export const Step7Participants: React.FC<Step7ParticipantsProps> = ({
  participants,
  instances,
  onEnrollParticipant,
  onUpdateParticipantStatus,
  onMarkAttendance,
  onGetAttendanceReport,
  isLoading = false
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<SessionInstance | null>(null);
  const [attendanceData, setAttendanceData] = useState({
    participant_id: 0,
    user_id: 0,
    status: 'present' as 'present' | 'absent' | 'late' | 'excused',
    check_in_time: '',
    notes: ''
  });
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Search users using real API
  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setAvailableUsers([]);
      return;
    }
    
    try {
      const { sessionCreation } = await import('../../services/sessionCreation');
      const response = await sessionCreation.searchUsers(query, 20);
      if (response.success && response.data) {
        // Filter out already enrolled participants
        const enrolledUserIds = participants.map(p => p.user_id);
        const availableUsers = response.data
          .filter((user: any) => !enrolledUserIds.includes(user.id))
          .map((user: any) => ({
            id: user.id,
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur',
            email: user.email || ''
          }));
        setAvailableUsers(availableUsers);
      } else {
        setAvailableUsers([]);
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      setAvailableUsers([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleEnrollParticipant = async () => {
    if (!selectedUser) {
      return;
    }
    
    try {
      const success = await onEnrollParticipant(selectedUser.id);
      if (success) {
        setShowEnrollmentForm(false);
        setSelectedUser(null);
        setSearchQuery('');
        setAvailableUsers([]);
        // Note: The parent component should reload participants after enrollment
      }
    } catch (error: any) {
      console.error('Error enrolling participant:', error);
      // Error handling is done by parent component
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedInstance || !attendanceData.participant_id || !attendanceData.user_id) {
      return;
    }
    
    try {
      const success = await onMarkAttendance(selectedInstance.uuid, attendanceData);
      if (success) {
        setShowAttendanceForm(false);
        setSelectedInstance(null);
        setAttendanceData({
          participant_id: 0,
          user_id: 0,
          status: 'present',
          check_in_time: '',
          notes: ''
        });
        // Note: The parent component should reload participants after marking attendance
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      // Error handling is done by parent component
    }
  };

  const handleGetAttendanceReport = async () => {
    try {
      const report = await onGetAttendanceReport();
      if (report) {
        setAttendanceReport(report);
        setShowAttendanceReport(true);
      }
    } catch (error: any) {
      console.error('Error getting attendance report:', error);
      // Error handling is done by parent component
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enrolled': return 'Inscrit';
      case 'active': return 'Actif';
      case 'completed': return 'Terminé';
      case 'suspended': return 'Suspendu';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'En retard';
      case 'excused': return 'Excusé';
      default: return status;
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const filteredParticipants = participants.filter(participant => {
    if (statusFilter === 'all') return true;
    return participant.status === statusFilter;
  });

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        {/* Enrollment */}
        <LegacyCollapsible
          id="enrollment"
          title={t('sessionCreation.participants.enrollment')}
          hasData={false}
          showCheckmark={false}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t('sessionCreation.participants.enrollNewParticipant')}</h3>
              <Button
                onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {showEnrollmentForm ? t('common.cancel') : t('sessionCreation.participants.enrollParticipant')}
              </Button>
            </div>

            {showEnrollmentForm && (
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('sessionCreation.participants.searchUser')}</label>
                    <FormField
                      value={searchQuery}
                      onChange={(value) => setSearchQuery(value)}
                      placeholder={t('sessionCreation.participants.searchUserPlaceholder')}
                    />
                    
                    {availableUsers.length > 0 && (
                      <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                        {availableUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              selectedUser?.id === user.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedUser && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium">{t('sessionCreation.participants.selectedUser')}</h4>
                      <div className="text-sm text-gray-600">
                        <div>{selectedUser.name}</div>
                        <div>{selectedUser.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleEnrollParticipant}
                      disabled={!selectedUser || isLoading}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {isLoading ? t('common.enrolling') : t('sessionCreation.participants.enrollParticipant')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </LegacyCollapsible>

        {/* Participants List */}
        <LegacyCollapsible
          id="participants-list"
          title={t('sessionCreation.participants.participantsList')}
          hasData={participants.length > 0}
          showCheckmark={true}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <SelectField
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { id: 'all', name: t('sessionCreation.participants.allStatuses') },
                    { id: 'enrolled', name: t('sessionCreation.participants.enrolled') },
                    { id: 'active', name: t('sessionCreation.participants.active') },
                    { id: 'completed', name: t('sessionCreation.participants.completed') },
                    { id: 'suspended', name: t('sessionCreation.participants.suspended') },
                    { id: 'cancelled', name: t('sessionCreation.participants.cancelled') }
                  ]}
                  placeholder={t('sessionCreation.participants.filterByStatus')}
                />
              </div>
              <Button
                onClick={handleGetAttendanceReport}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {t('sessionCreation.participants.attendanceReport')}
              </Button>
            </div>

            {filteredParticipants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('sessionCreation.participants.noParticipants')}</p>
            ) : (
              <div className="space-y-3">
                {filteredParticipants.map((participant) => (
                  <Card key={participant.uuid} className="p-4">
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{participant.user?.name || 'Utilisateur inconnu'}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(participant.status)}`}>
                              {getStatusLabel(participant.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {participant.user?.email}
                          </div>
                          <div className="text-sm text-gray-600">
                            📅 Inscrit le {formatDate(participant.enrollment_date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            📊 Progrès: {participant.progress_percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <SelectField
                            value={participant.status}
                            onChange={(value) => onUpdateParticipantStatus(participant.id, value)}
                            options={[
                              { id: 'enrolled', name: 'Inscrit' },
                              { id: 'active', name: 'Actif' },
                              { id: 'completed', name: 'Terminé' },
                              { id: 'suspended', name: 'Suspendu' },
                              { id: 'cancelled', name: 'Annulé' }
                            ]}
                            placeholder={t('sessionCreation.participants.updateStatus')}
                          />
                        </div>
                      </div>

                      {/* Attendance History */}
                      {participant.attendances && participant.attendances.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium mb-2">{t('sessionCreation.participants.attendanceHistory')}</h5>
                          <div className="space-y-2">
                            {participant.attendances.map((attendance, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getAttendanceStatusColor(attendance.status)}`}>
                                    {getAttendanceStatusLabel(attendance.status)}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {attendance.check_in_time && formatDateTime(attendance.check_in_time)}
                                  </span>
                                </div>
                                {attendance.notes && (
                                  <span className="text-sm text-gray-500">{attendance.notes}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </LegacyCollapsible>

        {/* Mark Attendance */}
        <LegacyCollapsible
          id="mark-attendance"
          title={t('sessionCreation.participants.markAttendance')}
          hasData={false}
          showCheckmark={false}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t('sessionCreation.participants.markAttendanceForInstance')}</h3>
              <Button
                onClick={() => setShowAttendanceForm(!showAttendanceForm)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {showAttendanceForm ? t('common.cancel') : t('sessionCreation.participants.markAttendance')}
              </Button>
            </div>

            {showAttendanceForm && (
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <SelectField
                    label={t('sessionCreation.participants.selectInstance')}
                    value={selectedInstance?.uuid || ''}
                    onChange={(value) => {
                      const instance = instances.find(i => i.uuid === value);
                      setSelectedInstance(instance || null);
                    }}
                    options={instances.map(instance => ({
                      id: instance.uuid,
                      name: `${instance.start_date} - ${instance.start_time} (${instance.instance_type})`
                    }))}
                    placeholder={t('sessionCreation.participants.selectInstancePlaceholder')}
                  />

                  {selectedInstance && (
                    <>
                      <SelectField
                        label={t('sessionCreation.participants.selectParticipant')}
                        value={attendanceData.participant_id}
                        onChange={(value) => {
                          const participant = participants.find(p => p.id === parseInt(value));
                          setAttendanceData({
                            ...attendanceData,
                            participant_id: parseInt(value),
                            user_id: participant?.user_id || 0
                          });
                        }}
                        options={participants.map(participant => ({
                          id: participant.id,
                          name: participant.user?.name || 'Utilisateur inconnu'
                        }))}
                        placeholder={t('sessionCreation.participants.selectParticipantPlaceholder')}
                      />

                      <SelectField
                        label={t('sessionCreation.participants.attendanceStatus')}
                        value={attendanceData.status}
                        onChange={(value) => setAttendanceData({ ...attendanceData, status: value as any })}
                        options={[
                          { id: 'present', name: 'Présent' },
                          { id: 'absent', name: 'Absent' },
                          { id: 'late', name: 'En retard' },
                          { id: 'excused', name: 'Excusé' }
                        ]}
                        placeholder={t('sessionCreation.participants.selectStatus')}
                      />

                      <FormField
                        label={t('sessionCreation.participants.checkInTime')}
                        type="datetime-local"
                        value={attendanceData.check_in_time}
                        onChange={(value) => setAttendanceData({ ...attendanceData, check_in_time: value })}
                      />

                      <FormField
                        label={t('sessionCreation.participants.notes')}
                        value={attendanceData.notes}
                        onChange={(value) => setAttendanceData({ ...attendanceData, notes: value })}
                        placeholder={t('sessionCreation.participants.notesPlaceholder')}
                      />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleMarkAttendance}
                          disabled={!attendanceData.participant_id || !attendanceData.user_id || isLoading}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {isLoading ? t('common.marking') : t('sessionCreation.participants.markAttendance')}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </LegacyCollapsible>

        {/* Attendance Report Modal */}
        {showAttendanceReport && attendanceReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('sessionCreation.participants.attendanceReport')}</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowAttendanceReport(false)}
                  >
                    {t('common.close')}
                  </Button>
                </div>

                <div className="space-y-4">
                  {attendanceReport.map((report: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{report.participant.user.name}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Total sessions: {report.total_sessions}</div>
                            <div>Présent: {report.present_count}</div>
                            <div>Absent: {report.absent_count}</div>
                            <div>En retard: {report.late_count}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {report.attendance_rate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Taux de présence</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};
