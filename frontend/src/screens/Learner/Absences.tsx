import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  FileText, 
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getLearnerAbsences, addAbsenceJustification, updateAbsenceJustification, Absence } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';

export const Absences: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'justified' | 'unjustified' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [justificationType, setJustificationType] = useState<'medical' | 'personal' | 'professional' | 'other'>('medical');
  const [justificationComment, setJustificationComment] = useState('');
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    fetchAbsences();
  }, [statusFilter]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerAbsences({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      if (response.success && response.data) {
        setAbsences(response.data.absences || []);
      } else {
        setError('Erreur lors du chargement des absences');
      }
    } catch (err: any) {
      console.error('Error fetching absences:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJustification = async () => {
    if (!selectedAbsence) return;

    if (!justificationComment.trim() && !justificationFile) {
      showError('Erreur', 'Veuillez fournir un commentaire ou un document justificatif');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('type', justificationType);
      if (justificationComment) {
        formData.append('comment', justificationComment);
      }
      if (justificationFile) {
        formData.append('document', justificationFile);
      }

      let response;
      if (selectedAbsence.justification) {
        response = await updateAbsenceJustification(
          selectedAbsence.id,
          selectedAbsence.justification.id,
          formData
        );
      } else {
        response = await addAbsenceJustification(selectedAbsence.id, formData);
      }

      if (response.success) {
        showSuccess('Succès', 'Justificatif soumis avec succès');
        setSelectedAbsence(null);
        setJustificationType('medical');
        setJustificationComment('');
        setJustificationFile(null);
        fetchAbsences();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'justified':
        return <Badge className="bg-green-500 text-white">Justifiée</Badge>;
      case 'unjustified':
        return <Badge className="bg-red-500 text-white">Non justifiée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getJustificationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejeté</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      default:
        return null;
    }
  };

  const filteredAbsences = absences.filter(absence =>
    searchQuery === '' ||
    absence.session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    absence.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
              Mes Absences
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez vos absences et justificatifs
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une absence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="justified">Justifiées</option>
                  <option value="unjustified">Non justifiées</option>
                  <option value="pending">En attente</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Absences List */}
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => fetchAbsences()} className="mt-4">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredAbsences.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune absence</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Aucune absence ne correspond à votre recherche.' : 'Vous n\'avez pas d\'absences enregistrées.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAbsences.map((absence) => (
                <Card key={absence.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{absence.session.name}</h3>
                          {getStatusBadge(absence.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(absence.session.date)}</span>
                            <span className="capitalize">({absence.session.period})</span>
                          </div>
                          <div className="text-gray-500">{absence.course.name}</div>
                          {absence.justification && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">Justificatif:</span>
                                {getJustificationStatusBadge(absence.justification.status)}
                              </div>
                              <div className="text-xs text-gray-600">
                                Type: {absence.justification.type}
                              </div>
                              {absence.justification.comment && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {absence.justification.comment}
                                </div>
                              )}
                              {absence.justification.document_url && (
                                <a
                                  href={absence.justification.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  Voir le document
                                </a>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Soumis le {formatDate(absence.justification.submitted_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {absence.status === 'unjustified' && !absence.justification && (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAbsence(absence)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Justifier
                          </Button>
                        )}
                        {absence.justification && absence.justification.status === 'rejected' && (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAbsence(absence)}
                          >
                            Modifier
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Justification Modal */}
          {selectedAbsence && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md m-4">
                <CardHeader>
                  <CardTitle>Justifier l'absence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Session: <strong>{selectedAbsence.session.name}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {formatDate(selectedAbsence.session.date)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type de justificatif
                    </label>
                    <select
                      value={justificationType}
                      onChange={(e) => setJustificationType(e.target.value as any)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="medical">Médical</option>
                      <option value="personal">Personnel</option>
                      <option value="professional">Professionnel</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Commentaire
                    </label>
                    <textarea
                      value={justificationComment}
                      onChange={(e) => setJustificationComment(e.target.value)}
                      placeholder="Expliquez votre absence..."
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Document justificatif (optionnel)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setJustificationFile(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="flex-1"
                      />
                      {justificationFile && (
                        <span className="text-sm text-gray-600">{justificationFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedAbsence(null);
                        setJustificationType('medical');
                        setJustificationComment('');
                        setJustificationFile(null);
                      }}
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                      onClick={handleSubmitJustification}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {selectedAbsence.justification ? 'Modifier' : 'Soumettre'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};

