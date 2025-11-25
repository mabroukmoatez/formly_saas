import React, { useState, useEffect } from 'react';
import { 
  Award, 
  FileText,
  Download,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getLearnerResults, generateBulletin, generateCertificate, generateSchoolCertificate, getCertificates, CourseResult } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';

export const Results: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [results, setResults] = useState<CourseResult[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'certificates'>('results');
  const [generating, setGenerating] = useState<string | null>(null);

  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults();
    } else {
      fetchCertificates();
    }
  }, [activeTab]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerResults({ format: 'detailed' });
      if (response.success && response.data) {
        setResults(response.data.courses || []);
      } else {
        setError('Erreur lors du chargement des résultats');
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCertificates();
      if (response.success && response.data) {
        setCertificates(response.data.certificates || []);
      } else {
        setError('Erreur lors du chargement des certificats');
      }
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulletin = async (courseId?: number) => {
    try {
      setGenerating(`bulletin-${courseId || 'all'}`);
      const response = await generateBulletin({ course_id: courseId, format: 'pdf' });
      if (response.success && response.data) {
        showSuccess('Succès', 'Bulletin généré avec succès');
        window.open(response.data.download_url || response.data.bulletin_url, '_blank');
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateCertificate = async (courseId: number) => {
    try {
      setGenerating(`certificate-${courseId}`);
      const response = await generateCertificate(courseId);
      if (response.success && response.data) {
        showSuccess('Succès', 'Certificat généré avec succès');
        fetchCertificates();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateSchoolCertificate = async () => {
    try {
      setGenerating('school-certificate');
      const response = await generateSchoolCertificate();
      if (response.success && response.data) {
        showSuccess('Succès', 'Certificat de scolarité généré avec succès');
        window.open(response.data.download_url || response.data.certificate_url, '_blank');
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setGenerating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500 text-white">Réussi</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Échoué</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">En cours</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredResults = results.filter(result =>
    searchQuery === '' ||
    result.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCertificates = certificates.filter(cert =>
    searchQuery === '' ||
    cert.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
                Mes Résultats
              </h1>
              <p className="text-gray-500 mt-1">
                Consultez vos résultats, bulletins et certificats
              </p>
            </div>
            <Button
              onClick={handleGenerateSchoolCertificate}
              disabled={generating === 'school-certificate'}
              style={{ backgroundColor: primaryColor }}
            >
              {generating === 'school-certificate' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GraduationCap className="h-4 w-4 mr-2" />
              )}
              Certificat de scolarité
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="results">Résultats</TabsTrigger>
              <TabsTrigger value="certificates">Certificats</TabsTrigger>
            </TabsList>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher une formation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Results List */}
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
                    <Button onClick={() => fetchResults()} className="mt-4">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Vous n\'avez pas encore de résultats.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result) => (
                    <Card key={result.course.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{result.course.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(result.status)}
                              <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                                {result.overall_grade.toFixed(2)}/20
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleGenerateBulletin(result.course.id)}
                              disabled={generating === `bulletin-${result.course.id}`}
                            >
                              {generating === `bulletin-${result.course.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Bulletin
                            </Button>
                            {result.status === 'passed' && (
                              <Button
                                onClick={() => handleGenerateCertificate(result.course.id)}
                                disabled={generating === `certificate-${result.course.id}`}
                                style={{ backgroundColor: primaryColor }}
                              >
                                {generating === `certificate-${result.course.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Award className="h-4 w-4 mr-2" />
                                )}
                                Certificat
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Modules */}
                        {result.modules && result.modules.length > 0 && (
                          <div className="space-y-4">
                            {result.modules.map((module, index) => (
                              <div key={module.module_id} className="border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{module.module_name}</h4>
                                  <span className="font-bold">{module.grade.toFixed(2)}/20</span>
                                </div>
                                
                                {/* Quizzes */}
                                {module.quizzes && module.quizzes.length > 0 && (
                                  <div className="ml-4 space-y-2 mb-2">
                                    {module.quizzes.map((quiz) => (
                                      <div key={quiz.quiz_id} className="text-sm text-gray-600">
                                        <span className="font-medium">{quiz.quiz_name}:</span> {quiz.score}/{quiz.max_score} ({quiz.percentage}%)
                                        <span className="text-gray-400 ml-2">
                                          {formatDate(quiz.completed_at)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Assignments */}
                                {module.assignments && module.assignments.length > 0 && (
                                  <div className="ml-4 space-y-2">
                                    {module.assignments.map((assignment) => (
                                      <div key={assignment.assignment_id} className="text-sm text-gray-600">
                                        <span className="font-medium">{assignment.assignment_name}:</span> {assignment.grade}/{assignment.max_grade} ({assignment.percentage}%)
                                        <span className="text-gray-400 ml-2">
                                          {formatDate(assignment.submitted_at)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Certificate */}
                        {result.certificate && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">Certificat obtenu</span>
                              </div>
                              <a
                                href={result.certificate.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Délivré le {formatDate(result.certificate.issued_at)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un certificat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Certificates List */}
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
                    <Button onClick={() => fetchCertificates()} className="mt-4">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredCertificates.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun certificat</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Aucun certificat ne correspond à votre recherche.' : 'Vous n\'avez pas encore de certificats.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCertificates.map((certificate) => (
                    <Card key={certificate.id}>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Award className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
                          <h3 className="font-semibold mb-2">{certificate.course?.name || 'Certificat de scolarité'}</h3>
                          <Badge className="mb-4">{certificate.type || 'Certificat'}</Badge>
                          <p className="text-sm text-gray-600 mb-4">
                            Délivré le {formatDate(certificate.issued_at || certificate.created_at)}
                          </p>
                          <Button
                            className="w-full"
                            onClick={() => window.open(certificate.certificate_url || certificate.download_url, '_blank')}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </LearnerLayout>
  );
};

