import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { useLearnerCourses } from '../../hooks/useLearnerCourses';
import { useLanguage } from '../../contexts/LanguageContext';
import { fixImageUrl } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Learning: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const { courses, loading } = useLearnerCourses({
    search,
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });


  const getTypeBadge = (type?: string) => {
    const typeMap: Record<string, { text: string; bg: string; color: string }> = {
      'presentiel': { text: 'Présentiel', bg: 'bg-[#dcffe7]', color: 'text-[#08ab39]' },
      'distanciel': { text: 'Distanciel', bg: 'bg-[#eee0ff]', color: 'text-[#8c2ffe]' },
      'e-learning': { text: 'E-learning', bg: 'bg-[#fde3e1]', color: 'text-[#fe2f40]' },
      'hybrid': { text: 'Hybrid', bg: 'bg-[#ffe5ca]', color: 'text-[#ff7700]' },
      'synchrone': { text: 'Synchrone', bg: 'bg-[#e5f3ff]', color: 'text-[#007aff]' },
    };
    return typeMap[type || ''] || { text: type || 'N/A', bg: 'bg-gray-200', color: 'text-gray-700' };
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="w-full">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#09294c] text-[25px]">
              {t('learner.learning.title')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-[1042px]">
              <Search className="absolute left-[19px] top-1/2 -translate-y-1/2 w-3.5 h-[15px] text-[#09294c]" />
              <Input
                placeholder={t('learner.learning.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-[47px] h-[50px] bg-white rounded-xl border border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] [font-family:'Urbanist',Helvetica] font-semibold text-[#09294c] text-[13px]"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-[50px] w-[152px] bg-white rounded-xl border border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] [font-family:'Urbanist',Helvetica] font-semibold text-[#09294c] text-[13px] h-auto"
                >
                  {statusFilter === 'all' ? t('learner.learning.status') : statusFilter === 'in_progress' ? t('learner.learning.inProgress') : statusFilter === 'completed' ? t('learner.learning.completed') : t('learner.learning.notStarted')}
                  <ChevronDown className="ml-1 w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>{t('learner.learning.all')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>{t('learner.learning.inProgress')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>{t('learner.learning.completed')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('not_started')}>{t('learner.learning.notStarted')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-[50px] w-[152px] bg-white rounded-xl border border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] [font-family:'Urbanist',Helvetica] font-semibold text-[#09294c] text-[13px] h-auto"
                >
                  {categoryFilter === 'all' ? t('learner.learning.category') : categoryFilter}
                  <ChevronDown className="ml-1 w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')}>{t('learner.learning.all')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('Ai Tools')}>Ai Tools</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('Development')}>Development</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
          {courses && courses.length > 0 ? (
            courses.map((course, index) => {
              const badge = getTypeBadge(course.session?.type);
              return (
                <Card
                  key={course.id}
                  className="border-[1.76px] border-[#e5f3ff] rounded-[15px] overflow-hidden translate-y-[-1rem] animate-fade-in opacity-0 cursor-pointer hover:shadow-lg transition-shadow"
                  style={
                    {
                      '--animation-delay': `${index * 100}ms`,
                    } as React.CSSProperties
                  }
                  onClick={() => navigate(getPath(`/learner/courses/${course.id}`))}
                >
                  <CardContent className="p-4 flex flex-col gap-[7px]">
                    <div className="relative rounded-[7.5px] overflow-hidden">
                      <img
                        className="w-full h-[187.28px] object-cover"
                        alt={course.title}
                        src={course.cover_image ? fixImageUrl(course.cover_image) : 'https://via.placeholder.com/300x187'}
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <Badge
                          className={`${badge.bg} ${badge.color} inline-flex items-center gap-[6.16px] px-[13.87px] py-[2.64px] rounded-[39.17px] [font-family:'Poppins',Helvetica] font-medium text-[12.3px]`}
                        >
                          {badge.text}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-[5px]">
                      <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[13.6px] leading-normal">
                        {course.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="inline-flex items-center gap-[5.38px] py-[2.31px] bg-white rounded-[34.16px]">
                            <Calendar className="w-[10.48px] h-[11.53px] text-[#6a90b9]" />
                            <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-xs">
                              {course.session?.start_date ? formatShortDate(course.session.start_date) : 'N/A'}
                            </span>
                          </div>

                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[13.6px]">
                            -
                          </span>

                          <div className="inline-flex items-center gap-[5.38px] py-[2.31px] bg-white rounded-[34.16px]">
                            <Calendar className="w-[10.48px] h-[11.53px] text-[#6a90b9]" />
                            <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-xs">
                              {course.session?.end_date ? formatShortDate(course.session.end_date) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="w-px h-3 bg-gray-300" />

                        <div className="inline-flex items-center gap-[5.38px] py-[2.31px] bg-white rounded-[34.16px]">
                          <Calendar className="w-[9.96px] h-[11.53px] text-[#6a90b9]" />
                          <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-xs">
                            32 Hours
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1">
                          <Badge className="bg-[#e8f0f7] text-[#6a90b9] px-3.5 py-0.5 rounded-[30px] [font-family:'Poppins',Helvetica] font-normal text-[15.5px] hover:bg-[#e8f0f7]">
                            {course.category || 'N/A'}
                          </Badge>
                        </div>

                        <div className="inline-flex items-center gap-[8.78px]">
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[13.6px]">
                            {course.instructor?.name || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#6a90b9]">Progression</span>
                          <span className="text-xs font-bold text-[#007aff]">{course.progress?.percentage || 0}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden bg-[#e5f3ff]">
                          <div
                            className="h-full rounded-full transition-all bg-[#007aff]"
                            style={{ width: `${course.progress?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-500">{t('learner.learning.noCourses')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};
