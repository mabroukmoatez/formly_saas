import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { apiService } from '../../services/api';
import { sessionCreation } from '../../services/sessionCreation';
import { 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Edit2,
  Mail,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { SessionParticipant, SessionInstance } from '../../services/sessionCreation.types';

interface Step7ParticipantsProps {
  participants: SessionParticipant[];
  instances: SessionInstance[];
  onEnrollParticipant: (userId: number) => Promise<boolean>;
  onEnrollMultipleParticipants?: (userIds: number[]) => Promise<boolean>;
  onUpdateParticipantStatus: (participantId: number, status: string) => Promise<boolean>;
  onUpdateParticipantTarif?: (participantId: number, tarif: number) => Promise<boolean>;
  onUpdateParticipantType?: (participantId: number, type: string) => Promise<boolean>;
  onDeleteParticipant?: (participantId: number) => Promise<boolean>;
  onDeleteMultipleParticipants?: (participantIds: number[]) => Promise<boolean>;
  onExportParticipants?: (format?: 'xlsx' | 'csv') => Promise<void>;
  onMarkAttendance: (instanceUuid: string, data: any) => Promise<boolean>;
  onGetAttendanceReport: () => Promise<any>;
  isLoading?: boolean;
}

interface StudentUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

interface ParticipantWithDetails extends SessionParticipant {
  user?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  tarif?: number;
  type?: string;
}

export const Step7Participants: React.FC<Step7ParticipantsProps> = ({
  participants,
  instances,
  onEnrollParticipant,
  onEnrollMultipleParticipants,
  onUpdateParticipantStatus,
  onUpdateParticipantTarif,
  onUpdateParticipantType,
  onDeleteParticipant,
  onDeleteMultipleParticipants,
  onExportParticipants,
  onMarkAttendance,
  onGetAttendanceReport,
  isLoading = false
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableStudents, setAvailableStudents] = useState<StudentUser[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingTarif, setEditingTarif] = useState<{ participantId: number; value: string } | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);

  // Load students with role "student"
  const loadStudents = async (query: string = '') => {
    try {
      setLoadingStudents(true);
      const response = await apiService.getOrganizationUsers({
        role: 'student',
        search: query,
        per_page: 100
      });

      if (response.success && response.data) {
        const users = response.data.users?.data || response.data.users || response.data || [];
        const students: StudentUser[] = users
          .filter((user: any) => {
            // Filter by role - check if role is student
            const roleStr = user.role?.name || user.role_name || user.role || '';
            const roleLower = roleStr.toLowerCase();
            return roleLower.includes('student') || roleLower.includes('apprenant') || roleLower === 'student';
          })
          .map((user: any) => ({
            id: user.id,
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Utilisateur',
            email: user.email || '',
            avatar_url: user.avatar_url || user.avatar || '',
            role: user.role?.name || user.role_name || user.role
          }));

        // Filter out already enrolled participants
        const enrolledUserIds = participants.map(p => p.user_id);
        const availableStudents = students.filter(s => !enrolledUserIds.includes(s.id));
        
        setAvailableStudents(availableStudents);
      }
    } catch (error: any) {
      console.error('Error loading students:', error);
      setAvailableStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      loadStudents(searchQuery);
    }
  }, [showAddModal, searchQuery]);

  // Debounce search
  useEffect(() => {
    if (!showAddModal) return;
    
    const timeoutId = setTimeout(() => {
      loadStudents(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showAddModal]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      const allIds = availableStudents
        .filter(s => !participants.some(p => p.user_id === s.id))
        .map(s => s.id);
      setSelectedStudentIds(allIds);
    } else {
      setSelectedStudentIds([]);
    }
  }, [selectAll, availableStudents, participants]);

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
    setSelectAll(false);
  };

  const handleAddParticipants = async () => {
    if (selectedStudentIds.length === 0) {
      showError('Veuillez sélectionner au moins un participant');
      return;
    }

    try {
      if (onEnrollMultipleParticipants) {
        // Use bulk enrollment if available
        const result = await onEnrollMultipleParticipants(selectedStudentIds);
        if (result) {
          success(`${selectedStudentIds.length} participant(s) ajouté(s) avec succès`);
          setShowAddModal(false);
          setSelectedStudentIds([]);
          setSelectAll(false);
          setSearchQuery('');
        } else {
          showError('Erreur lors de l\'ajout des participants');
        }
      } else {
        // Fallback to individual enrollment
        let successCount = 0;
        let errorCount = 0;

        for (const userId of selectedStudentIds) {
          try {
            const result = await onEnrollParticipant(userId);
            if (result) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }

        if (successCount > 0) {
          success(`${successCount} participant(s) ajouté(s) avec succès`);
        }
        if (errorCount > 0) {
          showError(`${errorCount} participant(s) n'ont pas pu être ajouté(s)`);
        }

        if (successCount > 0) {
          setShowAddModal(false);
          setSelectedStudentIds([]);
          setSelectAll(false);
          setSearchQuery('');
        }
      }
    } catch (error: any) {
      console.error('Error adding participants:', error);
      showError('Erreur lors de l\'ajout des participants');
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      return;
    }

    try {
      if (onDeleteParticipant) {
        const result = await onDeleteParticipant(participantId);
        if (result) {
          success('Participant supprimé avec succès');
        } else {
          showError('Erreur lors de la suppression du participant');
        }
      } else {
        showError('Fonctionnalité de suppression non disponible');
      }
    } catch (error: any) {
      console.error('Error deleting participant:', error);
      showError('Erreur lors de la suppression du participant');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedParticipants.length === 0) {
      showError('Veuillez sélectionner au moins un participant');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedParticipants.length} participant(s) ?`)) {
      return;
    }

    try {
      if (onDeleteMultipleParticipants) {
        const result = await onDeleteMultipleParticipants(selectedParticipants);
        if (result) {
          success(`${selectedParticipants.length} participant(s) supprimé(s) avec succès`);
          setSelectedParticipants([]);
        } else {
          showError('Erreur lors de la suppression des participants');
        }
      } else if (onDeleteParticipant) {
        // Fallback to individual deletion
        let successCount = 0;
        for (const id of selectedParticipants) {
          try {
            const result = await onDeleteParticipant(id);
            if (result) successCount++;
          } catch (error) {
            console.error('Error deleting participant:', error);
          }
        }
        if (successCount > 0) {
          success(`${successCount} participant(s) supprimé(s) avec succès`);
          setSelectedParticipants([]);
        }
      } else {
        showError('Fonctionnalité de suppression non disponible');
      }
    } catch (error: any) {
      console.error('Error deleting participants:', error);
      showError('Erreur lors de la suppression des participants');
    }
  };

  const handleUpdateTarif = async (participantId: number, newTarif: string) => {
    const tarifValue = parseFloat(newTarif.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(tarifValue) || tarifValue < 0) {
      showError('Veuillez entrer un montant valide');
      setEditingTarif(null);
      return;
    }

    try {
      if (onUpdateParticipantTarif) {
        const result = await onUpdateParticipantTarif(participantId, tarifValue);
        if (result) {
          success('Tarif mis à jour avec succès');
          setEditingTarif(null);
        } else {
          showError('Erreur lors de la mise à jour du tarif');
        }
      } else {
        showError('Fonctionnalité de mise à jour du tarif non disponible');
        setEditingTarif(null);
      }
    } catch (error: any) {
      console.error('Error updating tarif:', error);
      showError('Erreur lors de la mise à jour du tarif');
      setEditingTarif(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      if (onExportParticipants) {
        await onExportParticipants('xlsx');
        success('Export Excel généré avec succès');
      } else {
        showError('Fonctionnalité d\'export Excel non disponible');
      }
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      showError('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Empty state
  if (participants.length === 0 && !showAddModal) {
    return (
      <>
        <div className="w-full flex flex-col items-center justify-center py-8 px-6">
          <div className="text-center px-6 max-w-2xl mb-6">
            <p className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Aucun participant pour le moment
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: primaryColor }}
            className="gap-2 px-6 py-3 text-base"
          >
            <Plus className="w-5 h-5" />
            Ajouter Participants
          </Button>
        </div>

        {/* Add Participants Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddModal(false);
                setSelectedStudentIds([]);
                setSelectAll(false);
                setSearchQuery('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowAddModal(false);
                setSelectedStudentIds([]);
                setSelectAll(false);
                setSearchQuery('');
              }
            }}
          >
            <Card 
              className={`w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-6 space-y-4 flex flex-col h-full">
                {/* Modal Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Ajouter Participants</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedStudentIds([]);
                      setSelectAll(false);
                      setSearchQuery('');
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher Un Nom, Un Prénom, Un Email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Select All Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">
                    Tout sélectionner
                  </Label>
                  <div className="ml-auto">
                    <Button
                      onClick={handleAddParticipants}
                      disabled={selectedStudentIds.length === 0 || isLoading}
                      style={{ backgroundColor: primaryColor }}
                      className="gap-2"
                    >
                      Ajouter À Cette Session
                    </Button>
                  </div>
                </div>

                {/* Students List */}
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  {loadingStudents ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun étudiant trouvé
                    </div>
                  ) : (
                    <div className="divide-y">
                      {availableStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleToggleStudent(student.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4"
                          />
                          {student.avatar_url ? (
                            <img 
                              src={student.avatar_url} 
                              alt={student.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {getInitials(student.name)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {student.role || 'Student'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
        <div className="w-full max-w-[1396px] flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor
                }}
              />
              <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`}>
                Participants
              </h2>
              <AlertCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={selectedParticipants.length === 0}
                onClick={handleDeleteMultiple}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exporting}
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                style={{ backgroundColor: primaryColor }}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Ajouter Les Participants
              </Button>
            </div>
          </div>

          {/* Participants Summary */}
          <div className="flex items-center gap-2">
            <div
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor
              }}
            />
            <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Participants
            </h2>
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium">
                {participants.length} participant{participants.length > 1 ? 's' : ''}
              </span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>

          {/* Participants Table */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 p-4 border-b ${
                isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
              }`}>
                <div></div>
                <div className="font-medium">Nom&prenom</div>
                <div className="font-medium">email</div>
                <div className="font-medium">Tarif De la Formation</div>
                <div className="font-medium">Type</div>
                <div></div>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {participants.map((participant) => {
                  const participantWithDetails = participant as ParticipantWithDetails;
                  const isEditing = editingTarif?.participantId === participant.id;
                  const tarifValue = participantWithDetails.tarif || 0;
                  
                  return (
                    <div
                      key={participant.uuid}
                      className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedParticipants.includes(participant.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants(prev => [...prev, participant.id]);
                          } else {
                            setSelectedParticipants(prev => prev.filter(id => id !== participant.id));
                          }
                        }}
                        className="w-4 h-4"
                      />

                      {/* Name */}
                      <div className="flex items-center gap-2">
                        {participant.user?.avatar_url ? (
                          <img 
                            src={participant.user.avatar_url} 
                            alt={participant.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {getInitials(participant.user?.name || 'U')}
                          </div>
                        )}
                        <span className="font-medium">{participant.user?.name || 'Utilisateur inconnu'}</span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{participant.user?.email || ''}</span>
                      </div>

                      {/* Tarif */}
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="text"
                              value={editingTarif.value}
                              onChange={(e) => setEditingTarif({ ...editingTarif, value: e.target.value })}
                              onBlur={() => {
                                if (editingTarif) {
                                  handleUpdateTarif(editingTarif.participantId, editingTarif.value);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingTarif) {
                                    handleUpdateTarif(editingTarif.participantId, editingTarif.value);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingTarif(null);
                                }
                              }}
                              className="w-24"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <span>{formatCurrency(tarifValue)}</span>
                            <button
                              onClick={() => setEditingTarif({ 
                                participantId: participant.id, 
                                value: tarifValue.toString() 
                              })}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Type */}
                      <Badge variant="outline">
                        {participantWithDetails.type || 'Particulier'}
                      </Badge>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="p-1 hover:bg-red-50 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Add Participants Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setSelectedStudentIds([]);
              setSelectAll(false);
              setSearchQuery('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowAddModal(false);
              setSelectedStudentIds([]);
              setSelectAll(false);
              setSearchQuery('');
            }
          }}
        >
          <Card 
            className={`w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6 space-y-4 flex flex-col h-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Ajouter Participants</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStudentIds([]);
                    setSelectAll(false);
                    setSearchQuery('');
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher Un Nom, Un Prénom, Un Email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Select All Checkbox and Add Button */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Tout sélectionner
                </Label>
                <div className="ml-auto">
                  <Button
                    onClick={handleAddParticipants}
                    disabled={selectedStudentIds.length === 0 || isLoading}
                    style={{ backgroundColor: primaryColor }}
                    className="gap-2"
                  >
                    Ajouter À Cette Session
                  </Button>
                </div>
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {loadingStudents ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun étudiant trouvé
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleToggleStudent(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4"
                        />
                        {student.avatar_url ? (
                          <img 
                            src={student.avatar_url} 
                            alt={student.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {getInitials(student.name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {student.role || 'Student'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
