import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Calendar, ChevronRight, Eye, TrendingUp, Clock, Users, FileText, User, GraduationCap, Loader2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { useLearnerDashboard } from '../../../hooks/useLearnerDashboard';
import { useLearnerCourses } from '../../../hooks/useLearnerCourses';
import { useLearnerDocuments } from '../../../hooks/useLearnerDocuments';
import { useLanguage } from '../../../contexts/LanguageContext';
import { DashboardStats, LearnerCourse, LearnerDocument } from '../../../services/learner';
import { fixImageUrl } from '../../../lib/utils';
import { GaugeChart } from './GaugeChart';
import { ActivityLineChart } from './ActivityLineChart';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';

export const LearningProgressSection: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();
  const { stats, loading: statsLoading } = useLearnerDashboard();
  const { courses, loading: coursesLoading } = useLearnerCourses({ limit: 3, status: 'in_progress' });
  const { documents, loading: documentsLoading } = useLearnerDocuments({ limit: 4 });

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeBadge = (type?: string) => {
    if (!type) return null;
    const typeMap: Record<string, { text: string; color: string; icon?: string }> = {
      'presentiel': { text: 'Présentiel', color: 'bg-[#dcffe7] text-[#08ab39]' },
      'distanciel': { text: 'Distanciel', color: 'bg-[#eee0ff] text-[#8c2ffe]' },
      'e-learning': { text: 'E-learning', color: 'bg-[#fde3e1] text-[#fe2f40]' },
      'hybrid': { text: 'Hybrid', color: 'bg-[#ffe5ca] text-[#ff7700]' },
      'synchrone': { text: 'Synchrone', color: 'bg-[#e5f3ff] text-[#007aff]' },
    };
    return typeMap[type] || null;
  };

  const activityData = stats?.activity ? [
    stats.activity.content_readings !== undefined && stats.activity.content_readings !== null ? { label: 'Lecture', value: stats.activity.content_readings, color: 'bg-green-500' } : null,
    stats.activity.videos_watched !== undefined && stats.activity.videos_watched !== null ? { label: 'Vidéos', value: stats.activity.videos_watched, color: 'bg-orange-500' } : null,
    stats.activity.quizzes_completed !== undefined && stats.activity.quizzes_completed !== null ? { label: 'Tests', value: stats.activity.quizzes_completed, color: 'bg-blue-500' } : null,
    stats.activity.assignments_completed !== undefined && stats.activity.assignments_completed !== null ? { label: 'Devoirs', value: stats.activity.assignments_completed, color: 'bg-yellow-500' } : null,
  ].filter((item): item is { label: string; value: number; color: string } => item !== null && item.value > 0) : [];

  // Document tabs - populated from API response with counts
  const documentTabs = [
    { label: 'Documents', count: documents ? `+${documents.filter(d => d.type === 'document').length}` : '', color: 'bg-[#e5f3ff] text-[#007aff]' },
    { label: 'Questionnaire', count: documents ? `+${documents.filter(d => d.type === 'questionnaire').length}` : '', color: 'bg-[#ffe0c6] text-[#ff7700]' },
    { label: 'Emargement', count: documents ? `+${documents.filter(d => d.type === 'attendance_sheet').length}` : '', color: 'bg-[#dcffe7] text-[#25c9b5]' },
    { label: 'Abssance', count: documents ? `+${documents.filter(d => d.type === 'absence').length}` : '', color: 'bg-[#fde3e1] text-[#fe2f40]' },
  ];

  return (
    <section className="flex flex-col w-full items-start gap-[40px] translate-y-[-1rem] animate-fade-in opacity-0">
      <div className="flex flex-col items-end gap-[40px] w-full">
        {/* Preview Section - Enhanced */}
        <div className="flex flex-col items-start gap-[20px] w-full">
          <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[35px] tracking-[0] leading-[1.7]">
            {t('learner.dashboard.title')}
          </h2>

          <div className="flex items-start justify-center gap-[30px] w-full flex-wrap lg:flex-nowrap">
            {/* Taux d'assiduité Card - Enhanced with Gauge */}
            <Card className="w-full lg:w-[280px] bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms] relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow">
              <CardContent className="flex flex-col items-center justify-between p-6 min-h-[280px]">
                <div className="flex items-center gap-3 w-full mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#26DE81] to-[#08ab39] flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[16px] tracking-[0] leading-normal">
                    {t('learner.dashboard.attendanceRate')}
                  </div>
                </div>

                {/* Gauge Chart */}
                <div className="w-full flex items-center justify-center my-4">
                  {stats?.attendance_rate !== undefined ? (
                    <GaugeChart value={stats.attendance_rate} size={200} strokeWidth={24} />
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-sm text-gray-500">{t('common.loading')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mon activité Card - Enhanced with Line Chart */}
            <Card className="flex-1 bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow">
              <CardContent className="flex items-start gap-8 p-6 flex-wrap lg:flex-nowrap">
                <div className="flex flex-col w-full lg:flex-1 items-end justify-between gap-4">
                  {/* Activity Line Chart */}
                  <ActivityLineChart 
                    data={stats?.activity_chart}
                    height={220}
                  />
                </div>

                <div className="flex flex-col w-full lg:w-[214px] items-start gap-3">
                  <h3 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-sm tracking-[0] leading-normal">
                    {t('learner.dashboard.recentActivities')}
                  </h3>

                  {stats?.last_activity ? (
                    <Card className="w-full bg-white rounded-[10px] border-[#f6f6f6] shadow-[0px_4px_6px_4px_#09294c0d]">
                      <CardContent className="flex items-center gap-1.5 p-[7px]">
                        <div className="w-[55px] h-[53px] rounded-lg bg-[#e5f3ff] flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-[#007aff]" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="[font-family:'Urbanist',Helvetica] font-semibold text-black text-sm tracking-[0] leading-normal">
                            {stats.last_activity.title}
                          </div>
                          <div className="[font-family:'Urbanist',Helvetica] font-normal text-[#7b8392] text-[10px] tracking-[0] leading-normal">
                            {formatDate(stats.last_activity.completed_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="w-full bg-white rounded-[10px] border-[#f6f6f6] shadow-[0px_4px_6px_4px_#09294c0d]">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">{t('common.noDataFound')}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Activity Summary - Enhanced */}
                  {activityData.length > 0 && (
                    <div className="flex flex-wrap gap-2 w-full mt-2">
                      {activityData.map((activity, index) => {
                        const colorMap: Record<string, { bg: string; text: string }> = {
                          'bg-green-500': { bg: 'bg-gradient-to-br from-[#26DE81] to-[#08ab39]', text: 'text-white' },
                          'bg-orange-500': { bg: 'bg-gradient-to-br from-[#FF8A3D] to-[#ff7700]', text: 'text-white' },
                          'bg-blue-500': { bg: 'bg-gradient-to-br from-[#0085FF] to-[#007aff]', text: 'text-white' },
                          'bg-yellow-500': { bg: 'bg-gradient-to-br from-[#FFD93D] to-[#ffc107]', text: 'text-[#19294a]' },
                        };
                        const colors = colorMap[activity.color] || { bg: activity.color, text: 'text-white' };
                        
                        return (
                          <div
                            key={activity.label}
                            className={`flex flex-col w-[70px] h-16 gap-1 px-3 py-2 ${colors.bg} rounded-xl items-center justify-center shadow-md hover:shadow-lg transition-shadow cursor-pointer group`}
                            style={{ animationDelay: `${600 + index * 100}ms` }}
                          >
                            <div className={`[font-family:'Urbanist',Helvetica] font-bold text-lg text-center tracking-[0] leading-normal ${colors.text} group-hover:scale-110 transition-transform`}>
                              {activity.value}
                            </div>
                            <div className={`[font-family:'Urbanist',Helvetica] font-semibold text-[9px] text-center tracking-[0] leading-normal ${colors.text}`}>
                              {activity.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mon apprentissage Section - Enhanced */}
        <div className="flex flex-col items-start gap-[20px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
          <div className="flex items-center justify-between w-full">
            <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[35px] tracking-[0] leading-[1.7]">
              {t('learner.dashboard.myLearning')}
            </h2>

            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="h-auto p-0 text-[#007aff] [font-family:'Urbanist',Helvetica] font-normal text-[15px] underline"
                onClick={() => navigate(getPath('/learner/learning'))}
              >
                Voir plus
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px] w-full">
            {coursesLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
              </div>
            ) : courses && courses.length > 0 ? (
              courses.map((course, index) => {
                const badge = getTypeBadge(course.session?.type);
                return (
                  <Card
                    key={course.id}
                    className="bg-gradient-to-br from-[#0d4a5c] to-[#0a3d4d] rounded-[20px] border-0 translate-y-[-1rem] animate-fade-in opacity-0 cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] overflow-hidden group"
                    style={
                      {
                        '--animation-delay': `${800 + index * 100}ms`,
                      } as React.CSSProperties
                    }
                    onClick={() => navigate(getPath(`/learner/courses/${course.id}`))}
                  >
                    <CardContent className="p-0 flex flex-col">
                      <div className="relative w-full h-[220px] overflow-hidden">
                        {course.cover_image ? (
                          <img
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            alt={course.title}
                            src={fixImageUrl(course.cover_image)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0d4a5c] to-[#0a3d4d] flex items-center justify-center">
                            <GraduationCap className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* Category badge - Enhanced */}
                        {badge && (
                          <Badge
                            className={`absolute top-3 left-3 ${badge.color} rounded-full gap-2 px-4 py-1.5 h-auto shadow-lg backdrop-blur-sm`}
                          >
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-[13px]">
                              {badge.text}
                            </span>
                          </Badge>
                        )}

                        {/* Participant avatars - Bottom left */}
                        {course.participants && course.participants.length > 0 && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {course.participants.slice(0, 3).map((participant: any) => (
                                <Avatar key={participant.id} className="w-8 h-8 border-2 border-white/50">
                                  {participant.avatar ? (
                                    <AvatarImage src={fixImageUrl(participant.avatar)} alt={participant.name} />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-[#FF8A3D] to-[#ff9600] text-white text-xs font-bold">
                                    {participant.name ? participant.name.substring(0, 2).toUpperCase() : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            {course.participants_count && course.participants_count > 3 && (
                              <Badge className="bg-white/20 backdrop-blur-sm text-white rounded-full px-2 py-0.5 h-auto border border-white/30">
                                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[11px]">
                                  +{course.participants_count - 3}
                                </span>
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-3 w-full p-4 bg-white">
                        <h3 className="[font-family:'Poppins',Helvetica] font-bold text-[#19294a] text-[16px] tracking-[0] leading-[1.5] line-clamp-2">
                          {course.title}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-[#f9fcff] rounded-full px-3 py-1.5">
                            <Calendar className="w-4 h-4 text-[#0085FF]" />
                            {course.session?.start_date && course.session?.end_date ? (
                              <>
                                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[11px]">
                                  {formatShortDate(course.session.start_date)}
                                </span>
                                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[11px]">
                                  -
                                </span>
                                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[11px]">
                                  {formatShortDate(course.session.end_date)}
                                </span>
                              </>
                            ) : null}
                          </div>

                          {course.duration_hours && (
                            <div className="flex items-center gap-1.5 bg-[#f9fcff] rounded-full px-3 py-1.5">
                              <Clock className="w-4 h-4 text-[#FF8A3D]" />
                              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[11px]">
                                {course.duration_hours} {course.duration_hours === 1 ? 'Heure' : 'Heures'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between w-full pt-2 border-t border-[#e5f3ff]">
                          {course.category && (
                            <Badge className="bg-gradient-to-r from-[#e8f0f7] to-[#d6e9ff] text-[#6a90b9] rounded-full px-3 py-1 h-auto [font-family:'Poppins',Helvetica] font-semibold text-[13px]">
                              {course.category}
                            </Badge>
                          )}

                          {course.instructor?.name && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[#6a90b9]" />
                              <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[13px]">
                                {course.instructor.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar - Enhanced */}
                        {course.progress?.percentage !== undefined && (
                          <div className="w-full mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#6a90b9] text-[12px]">Progression</span>
                              <span className="[font-family:'Urbanist',Helvetica] font-bold text-[#0085FF] text-[14px]">{course.progress.percentage}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden bg-[#e5f3ff] shadow-inner">
                              <div
                                className="h-full rounded-full transition-all bg-gradient-to-r from-[#0085FF] to-[#007aff] shadow-sm"
                                style={{ width: `${course.progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="w-full bg-gradient-to-br from-[#f9fcff] to-[#e5f3ff] rounded-[20px] border-2 border-[#e5f3ff] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#e5f3ff] flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-10 h-10 text-[#6a90b9]" />
                  </div>
                  <p className="[font-family:'Urbanist',Helvetica] font-semibold text-[#6a90b9] text-base">Aucune formation en cours</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mes Documents Section */}
        <div className="flex flex-col items-start gap-[15px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1400ms]">
          <div className="flex items-center gap-2">
            <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[25px] tracking-[0] leading-normal whitespace-nowrap">
              {t('learner.dashboard.myDocuments')}
            </h2>

            <div className="flex items-center gap-1.5">
              <Button
                variant="link"
                className="h-auto p-0 text-[#007aff] [font-family:'Urbanist',Helvetica] font-normal text-[15px] underline"
                onClick={() => navigate(getPath('/learner/documents'))}
              >
                Voir plus
              </Button>
              <ChevronRight className="w-4 h-4 text-[#007aff]" />

              {documents && documents.length > 0 && (
                <Badge className="bg-[#ff7700] text-white rounded-[30px] px-2 h-[19px] [font-family:'Urbanist',Helvetica] font-bold text-[13.8px]">
                  +{documents.length}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-[19px] w-full">
            <Tabs defaultValue="Documents" className="w-full">
              <TabsList className="w-full h-[45px] bg-[#fbfdff] rounded-[59px] border border-[#d2d2e7] shadow-[0px_4px_100px_10px_#09294c1a] p-1.5 justify-between">
                {documentTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.label}
                    value={tab.label}
                    className="flex-1 data-[state=active]:bg-white data-[state=active]:border data-[state=active]:border-[#007aff] rounded-[40px] h-auto py-2 gap-3"
                  >
                    <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[13px] data-[state=active]:text-[#007aff] text-[#19294a]">
                      {tab.label}
                    </span>
                    {tab.count && (
                      <Badge
                        className={`${
                          tab.label === 'Documents'
                            ? 'data-[state=active]:bg-[#e5f3ff] data-[state=active]:text-[#007aff]'
                            : ''
                        } ${tab.color} rounded-[30px] px-2 h-[19px] [font-family:'Urbanist',Helvetica] font-bold text-[13.8px]`}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="Documents" className="mt-[19px]">
                <div className="flex flex-wrap items-start gap-6 w-full">
                  {documents && documents.filter(d => d.type === 'document').length > 0 ? (
                    documents.filter(d => d.type === 'document').map((doc, index) => (
                      <Card
                        key={doc.id}
                        className="w-full lg:w-[calc(50%-12px)] bg-white rounded-[16.17px] border-[#e8f0f7]"
                      >
                        <CardContent className="flex items-center gap-[9px] p-[11px]">
                          <div className="w-[130.73px] h-[62.17px] bg-[#e5f3ff] rounded flex items-center justify-center">
                            <Eye className="w-8 h-8 text-[#007aff]" />
                          </div>

                          <div className="flex flex-col flex-1 gap-1.5">
                            <div className="flex items-center justify-between w-full">
                              <h4 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-sm tracking-[0] leading-normal">
                                {doc.name}
                              </h4>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-auto bg-[#e5f3ff] text-[#007aff] border-[0.83px] border-[#007aff] rounded-[10.83px] px-2.5 py-0.5 gap-2"
                                onClick={() => navigate(getPath(`/learner/documents/${doc.id}`))}
                              >
                                <Eye className="w-[18.83px] h-[14.29px]" />
                                <span className="[font-family:'Poppins',Helvetica] font-medium text-xs">
                                  Voir Le Document
                                </span>
                              </Button>
                            </div>

                            <div className="flex items-center justify-between w-full">
                              {doc.course?.name && (
                                <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-sm">
                                  {doc.course.name}
                                </span>
                              )}
                              <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[10px] text-right whitespace-nowrap">
                                Envoyé le {formatShortDate(doc.received_at || doc.created_at)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="w-full bg-white rounded-[16.17px] border-[#e8f0f7]">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-500">Aucun document disponible</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="Questionnaire" className="mt-[19px]">
                <div className="flex flex-wrap items-start gap-6 w-full">
                  {documentsLoading ? (
                    <div className="w-full flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
                    </div>
                  ) : documents && documents.filter(d => d.type === 'questionnaire').length > 0 ? (
                    documents.filter(d => d.type === 'questionnaire').map((doc) => (
                      <Card
                        key={doc.id}
                        className="w-full lg:w-[calc(50%-12px)] bg-white rounded-[16.17px] border-[#e8f0f7]"
                      >
                        <CardContent className="flex items-center gap-[9px] p-[11px]">
                          <div className="w-[130.73px] h-[62.17px] bg-[#ffe0c6] rounded flex items-center justify-center">
                            <Eye className="w-8 h-8 text-[#ff7700]" />
                          </div>
                          <div className="flex flex-col flex-1 gap-1.5">
                            <div className="flex items-center justify-between w-full">
                              <h4 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-sm tracking-[0] leading-normal">
                                {doc.name}
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-auto bg-[#ffe0c6] text-[#ff7700] border-[0.83px] border-[#ff7700] rounded-[10.83px] px-2.5 py-0.5 gap-2"
                                onClick={() => navigate(getPath(`/learner/documents/${doc.id}`))}
                              >
                                <Eye className="w-[18.83px] h-[14.29px]" />
                                <span className="[font-family:'Poppins',Helvetica] font-medium text-xs">
                                  Voir Le Questionnaire
                                </span>
                              </Button>
                            </div>
                            <div className="flex items-center justify-between w-full">
                              {doc.course?.name && (
                                <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-sm">
                                  {doc.course.name}
                                </span>
                              )}
                              <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[10px] text-right whitespace-nowrap">
                                Envoyé le {formatShortDate(doc.received_at || doc.created_at)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="w-full bg-white rounded-[16.17px] border-[#e8f0f7]">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-500">Aucun questionnaire disponible</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="Emargement" className="mt-[19px]">
                <div className="flex flex-wrap items-start gap-6 w-full">
                  <Card className="w-full bg-white rounded-[16.17px] border-[#e8f0f7]">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-500">Aucune feuille d&apos;émargement disponible</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="Abssance" className="mt-[19px]">
                <div className="flex flex-wrap items-start gap-6 w-full">
                  <Card className="w-full bg-white rounded-[16.17px] border-[#e8f0f7]">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-500">Aucune absence enregistrée</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};

