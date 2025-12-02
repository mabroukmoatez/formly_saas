/**
 * Modal de sélection de cours pour créer une session
 * 
 * Design basé sur Figma: grille 2 colonnes avec cartes de cours
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { courseCreation } from '../../services/courseCreation';
import { 
  Search, 
  BookOpen, 
  X,
  ChevronDown,
  Filter,
  Calendar
} from 'lucide-react';
import { fixImageUrl } from '../../lib/utils';

interface Course {
  id: number;
  uuid: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  image_url?: string;
  intro_image_url?: string;
  video_url?: string;
  price?: number | string;
  price_ht?: number | string;
  duration?: number;
  duration_days?: number;
  status?: number;
  isPublished?: boolean;
  is_published?: boolean;
  created_at?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface CourseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
}

export const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await courseCreation.getCourses({ per_page: 100 });
        
        console.log('API Response:', response); // Debug
        
        if (response.success && response.data) {
          // Handle nested structure: response.data.courses.data
          let courseList: Course[] = [];
          
          if (response.data.courses?.data) {
            // Structure: { courses: { data: [...] } }
            courseList = response.data.courses.data;
          } else if (Array.isArray(response.data.courses)) {
            // Structure: { courses: [...] }
            courseList = response.data.courses;
          } else if (Array.isArray(response.data.data)) {
            // Structure: { data: [...] }
            courseList = response.data.data;
          } else if (Array.isArray(response.data)) {
            // Structure: [...]
            courseList = response.data;
          }
          
          console.log('Courses loaded:', courseList.length); // Debug
          setCourses(courseList);
          setFilteredCourses(courseList);
        } else {
          setError('Erreur lors du chargement des cours');
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Erreur lors du chargement des cours');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadCourses();
      setSelectedCourse(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter and sort courses
  useEffect(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(query) ||
        course.category?.name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => {
        const isPublished = course.isPublished || course.is_published || course.status === 1;
        return statusFilter === 'published' ? isPublished : !isPublished;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredCourses(filtered);
  }, [searchQuery, courses, statusFilter, sortOrder]);

  const handleSelectCourse = () => {
    if (selectedCourse) {
      onSelectCourse(selectedCourse);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (course: Course) => {
    const isPublished = course.isPublished || course.is_published || course.status === 1;
    return isPublished ? (
      <Badge className="bg-blue-100 text-blue-600 border-0 font-medium text-xs px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
        Publiée
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-600 border-0 font-medium text-xs px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
        Brouillon
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-[900px] p-0 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${
            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header with Search and Filters */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-[400px]">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <Input
                placeholder="Recherche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 h-11 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
              />
            </div>

            <div className="flex-1" />

            {/* Status Filter */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowSortDropdown(false);
                }}
                className={`h-11 px-4 rounded-xl flex items-center gap-2 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" style={{ color: primaryColor }} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Statut</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
              
              {showStatusDropdown && (
                <div className={`absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border z-20 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  {(['all', 'published', 'draft'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        statusFilter === status
                          ? 'bg-blue-50 text-blue-600'
                          : isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status === 'published' ? 'Publiés' : 'Brouillons'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort by Date */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowStatusDropdown(false);
                }}
                className={`h-11 px-4 rounded-xl flex items-center gap-2 ${
                  isDark ? 'bg-white/5 border-gray-600' : 'bg-white border-gray-200'
                }`}
              >
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Date De Création</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
              
              {showSortDropdown && (
                <div className={`absolute top-full right-0 mt-2 w-44 rounded-xl shadow-lg border z-20 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  {(['newest', 'oldest'] as const).map((order) => (
                    <button
                      key={order}
                      onClick={() => {
                        setSortOrder(order);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        sortOrder === order
                          ? 'bg-blue-50 text-blue-600'
                          : isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {order === 'newest' ? 'Plus récent' : 'Plus ancien'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Course Grid */}
          <div 
            className="overflow-y-auto pr-2" 
            style={{ maxHeight: 'calc(80vh - 200px)' }}
            onClick={() => {
              setShowStatusDropdown(false);
              setShowSortDropdown(false);
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: primaryColor }} />
              </div>
            ) : error ? (
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun cours trouvé</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Essayez une autre recherche</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredCourses.map((course) => {
                  const isSelected = selectedCourse?.uuid === course.uuid;
                  // Handle different image field names from API
                  const imageUrl = course.image_url || course.intro_image_url || (course.image ? `http://localhost:8000/storage/${course.image}` : null);
                  
                  return (
                    <div
                      key={course.uuid}
                      onClick={() => setSelectedCourse(course)}
                      className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50' 
                          : isDark 
                            ? 'border-transparent bg-gray-700/50 hover:bg-gray-700' 
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {/* Course Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                        {imageUrl ? (
                          <img 
                            src={fixImageUrl(imageUrl)} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {course.title}
                        </h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(course.created_at)}
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(course)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {selectedCourse && (
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <Button
                onClick={handleSelectCourse}
                className="px-6 h-11 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Sélectionner ce cours
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseSelectionModal;
