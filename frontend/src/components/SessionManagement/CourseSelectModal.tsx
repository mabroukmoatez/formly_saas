/**
 * CourseSelectModal Component
 * Modal for selecting a course to create a new session
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, X, ChevronDown, Loader2, BookOpen } from 'lucide-react';
import { courseCreation } from '../../services/courseCreation';
import { fixImageUrl } from '../../lib/utils';

interface Course {
  uuid: string;
  title: string;
  subtitle?: string;
  image?: string;
  status: 'publiée' | 'brouillon';
  createdAt: string;
  modulesCount?: number;
  duration?: number;
  durationDays?: number;
  category?: string;
}

interface CourseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (courseUuid: string, dates: { startDate: string; endDate?: string }) => void;
}

export const CourseSelectModal: React.FC<CourseSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [step, setStep] = useState<'select' | 'dates'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'publiée' | 'brouillon'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load courses from API
  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await courseCreation.getCourses({ per_page: 100 });
      
      if (response.success && response.data) {
        // Handle nested structure from API
        let courseList: any[] = [];
        
        if (response.data.courses?.data) {
          courseList = response.data.courses.data;
        } else if (Array.isArray(response.data.courses)) {
          courseList = response.data.courses;
        } else if (Array.isArray(response.data.data)) {
          courseList = response.data.data;
        } else if (Array.isArray(response.data)) {
          courseList = response.data;
        }
        
        const transformedCourses: Course[] = courseList.map((course: any) => {
          const isPublished = course.isPublished || course.is_published || course.status === 1;
          return {
            uuid: course.uuid,
            title: course.title,
            subtitle: course.subtitle,
            image: course.image_url || course.intro_image_url || (course.image ? fixImageUrl(course.image) : undefined),
            status: isPublished ? 'publiée' as const : 'brouillon' as const,
            createdAt: course.created_at ? new Date(course.created_at).toLocaleDateString('fr-FR') : '',
            modulesCount: course.modules_count,
            duration: course.duration,
            durationDays: course.duration_days,
            category: course.category?.name
          };
        });
        
        setCourses(transformedCourses);
      } else {
        setError('Impossible de charger les cours');
      }
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message || 'Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen, loadCourses]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (course.category?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setStep('dates');
  };

  const handleConfirm = () => {
    if (selectedCourse && startDate) {
      onSelect(selectedCourse.uuid, { startDate, endDate });
      onClose();
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedCourse(null);
  };

  const resetModal = () => {
    setStep('select');
    setSelectedCourse(null);
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full z-10 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>

        {step === 'select' ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sélectionner un cours
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 h-10 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  />
                </div>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    className="h-10 gap-2 rounded-xl"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    Statut
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {showStatusDropdown && (
                    <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg border z-20 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      {['all', 'publiée', 'brouillon'].map(status => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status as any);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${
                            statusFilter === status ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {status === 'all' ? 'Tous' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Course Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                  <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chargement des cours...
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={loadCourses} variant="outline">
                    Réessayer
                  </Button>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {searchQuery ? 'Aucun cours trouvé pour cette recherche' : 'Aucun cours disponible'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredCourses.map(course => (
                    <button
                      key={course.uuid}
                      onClick={() => handleCourseSelect(course)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                        selectedCourse?.uuid === course.uuid 
                          ? 'border-blue-500 bg-blue-50' 
                          : isDark 
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Course Image */}
                      <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        {course.image ? (
                          <img src={fixImageUrl(course.image)} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {course.title}
                        </h3>
                        {course.subtitle && (
                          <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {course.subtitle}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {course.category && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {course.category}
                            </span>
                          )}
                          {course.durationDays && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              • {course.durationDays} jour{course.durationDays > 1 ? 's' : ''}
                            </span>
                          )}
                          <Badge className={`${
                            course.status === 'publiée' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-orange-100 text-orange-600'
                          } border-0 text-xs`}>
                            ● {course.status === 'publiée' ? 'Publiée' : 'Brouillon'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Date Selection Step */
          <div className="p-6">
            <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Planifier la session
            </h2>
            
            {/* Selected Course */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {selectedCourse?.image ? (
                  <img src={fixImageUrl(selectedCourse.image)} alt={selectedCourse.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedCourse?.title}
                </h3>
                {selectedCourse?.subtitle && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedCourse.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {selectedCourse?.category && (
                    <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">
                      {selectedCourse.category}
                    </Badge>
                  )}
                  {selectedCourse?.durationDays && (
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Durée : {selectedCourse.durationDays} jour{selectedCourse.durationDays > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`rounded-xl border-2 border-dashed p-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date Début *
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`h-10 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
                  />
                </div>
              </div>

              <div className={`rounded-xl border-2 border-dashed p-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date Fin *
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`h-10 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6 rounded-xl"
              >
                Précédent
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!startDate}
                className="px-6 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Créer La Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelectModal;
