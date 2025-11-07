import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, FileText, TrendingUp, Star, Clock, MapPin, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { trainersService } from '../../services/trainers';
import { Trainer, TrainerTraining, TrainerDocument, TrainerEvaluation, TrainerQuestionnaire, TrainerStats } from '../../services/trainers.types';
import { Loader2 } from 'lucide-react';

interface TrainerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
}

export const TrainerDetailsModal: React.FC<TrainerDetailsModalProps> = ({
  isOpen,
  onClose,
  trainer,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [trainerDetails, setTrainerDetails] = useState<any>(null);
  const [trainings, setTrainings] = useState<TrainerTraining[]>([]);
  const [documents, setDocuments] = useState<TrainerDocument[]>([]);
  const [evaluations, setEvaluations] = useState<TrainerEvaluation[]>([]);
  const [questionnaires, setQuestionnaires] = useState<TrainerQuestionnaire[]>([]);
  const [stats, setStats] = useState<TrainerStats | null>(null);

  useEffect(() => {
    if (isOpen && trainer) {
      loadTrainerDetails();
    }
  }, [isOpen, trainer]);

  const loadTrainerDetails = async () => {
    if (!trainer) return;
    
    const trainerId = trainer.uuid || trainer.id?.toString();
    if (!trainerId) return;

    setLoading(true);
    try {
      const response = await trainersService.getTrainerById(trainerId);
      if (response.success && response.data) {
        setTrainerDetails(response.data.trainer);
        setTrainings(response.data.trainings || []);
        setDocuments(response.data.documents || []);
        setEvaluations(response.data.evaluations || []);
        setQuestionnaires(response.data.questionnaires || []);
        setStats(response.data.stats || null);
      }
    } catch (err) {
      console.error('Error loading trainer details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemindQuestionnaire = async (questionnaireId: number) => {
    if (!trainer) return;
    const trainerId = trainer.uuid || trainer.id?.toString();
    if (!trainerId) return;

    try {
      await trainersService.remindQuestionnaire(trainerId, questionnaireId);
      // Success handled by toast
    } catch (err) {
      console.error('Error reminding questionnaire:', err);
    }
  };

  if (!isOpen || !trainer) return null;

  const displayTrainer = trainerDetails || trainer;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[1000px] max-h-[90vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={onClose}
            >
              <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <div>
              <h2 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {displayTrainer.first_name && displayTrainer.last_name
                  ? `${displayTrainer.first_name} ${displayTrainer.last_name}`
                  : displayTrainer.name || 'Formateur'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {displayTrainer.specialization || 'Formateur'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col max-h-[calc(90vh-90px)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className={`mx-6 mt-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="availability">Disponibilités</TabsTrigger>
                <TabsTrigger value="trainings">Formations</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Informations Générales */}
                <TabsContent value="info" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Informations Générales
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Email
                          </span>
                        </div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayTrainer.email}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Téléphone
                          </span>
                        </div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayTrainer.phone || '-'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Adresse
                          </span>
                        </div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayTrainer.address || '-'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Type de contrat
                          </span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {displayTrainer.contract_type || '-'}
                        </Badge>
                      </div>

                      {displayTrainer.hourly_rate && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Taux horaire
                            </span>
                          </div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {displayTrainer.hourly_rate} €/h
                          </p>
                        </div>
                      )}

                      {displayTrainer.experience_years && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Expérience
                            </span>
                          </div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {displayTrainer.experience_years} ans
                          </p>
                        </div>
                      )}
                    </div>

                    {displayTrainer.description && (
                      <div className="mt-6">
                        <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Description
                        </h4>
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {displayTrainer.description}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Disponibilités */}
                <TabsContent value="availability" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Calendrier et Disponibilités
                    </h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Le calendrier des disponibilités sera affiché ici
                    </p>
                    {/* TODO: Intégrer le composant calendrier */}
                  </div>
                </TabsContent>

                {/* Formations */}
                <TabsContent value="trainings" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Formations Assignées
                    </h3>
                    {trainings.length === 0 ? (
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Aucune formation assignée
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {trainings.map((training) => (
                          <div key={training.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {training.course_name}
                                </h4>
                                {training.session_name && (
                                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Session: {training.session_name}
                                  </p>
                                )}
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(training.start_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <Badge className={
                                training.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                training.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {training.status === 'ongoing' ? 'En cours' :
                                 training.status === 'completed' ? 'Terminée' :
                                 'À venir'}
                              </Badge>
                            </div>
                            {training.progress_percentage !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Progression
                                  </span>
                                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {training.progress_percentage}%
                                  </span>
                                </div>
                                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                  <div 
                                    className="h-2 rounded-full"
                                    style={{ 
                                      width: `${training.progress_percentage}%`,
                                      backgroundColor: primaryColor 
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Documents */}
                <TabsContent value="documents" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Documents
                    </h3>
                    {documents.length === 0 ? (
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Aucun document
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {doc.name}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Télécharger
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Performance */}
                <TabsContent value="performance" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Performance et Retours
                    </h3>
                    {stats && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Note moyenne</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {stats.average_rating != null && !isNaN(Number(stats.average_rating))
                                ? Number(stats.average_rating).toFixed(1)
                                : '0.0'}
                            </span>
                          </div>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total formations</p>
                          <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats.total_trainings || 0}
                          </p>
                        </div>
                      </div>
                    )}

                    {questionnaires.length > 0 && (
                      <div>
                        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Questionnaires
                        </h4>
                        <div className="space-y-2">
                          {questionnaires.map((q) => (
                            <div key={q.id} className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                              <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {q.title}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Envoyé le {new Date(q.sent_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={q.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {q.status === 'completed' ? 'Complété' : 'En attente'}
                                </Badge>
                                {q.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemindQuestionnaire(q.id)}
                                  >
                                    Relancer
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Évaluation */}
                <TabsContent value="evaluation" className="space-y-6 mt-0">
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Évaluation par l'Organisme
                    </h3>
                    {evaluations.length === 0 ? (
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Aucune évaluation pour le moment
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {evaluations.map((evalItem) => (
                          <div key={evalItem.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {evalItem.evaluator_name}
                              </p>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {evalItem.rating}/5
                                </span>
                              </div>
                            </div>
                            {evalItem.comment && (
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {evalItem.comment}
                              </p>
                            )}
                            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(evalItem.evaluation_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

