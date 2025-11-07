import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Search, Clock, User, Eye, MoreHorizontal, Edit, Trash2, Plus, Grid3X3, List, X, AlertTriangle, Filter, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Course {
  id: number;
  uuid: string;
  title: string;
  subtitle?: string;
  description?: string;
  price: string; // API returns as string
  price_ht?: string; // Price excluding VAT
  old_price?: string;
  duration?: number; // Duration in hours
  duration_days?: number; // Duration in days
  status: number;
  course_type: number;
  category_id?: number;
  image?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    image_url?: string;
  };
  course_instructors?: Array<{
    id: number;
    name: string;
    email?: string;
  }>;
  trainers?: Array<{
    id: number;
    uuid: string;
    name: string;
    email?: string;
    specialization?: string;
    experience_years?: number;
    description?: string;
    competencies?: string[];
    avatar_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    pivot?: {
      course_uuid: string;
      trainer_id: string;
      permissions: string;
      assigned_at: string;
    };
  }>;
}

export const GestionDesFormations: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Get organization colors
  const primaryColor = organization?.primary_color || '#3b82f6';
  const secondaryColor = organization?.secondary_color || '#64748b';
  const accentColor = organization?.accent_color || '#f59e0b';

  useEffect(() => {
    loadCourses();
  }, []);

  // Reload courses when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadCourses();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reload courses when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filtering
    loadCourses();
  }, [priceFilter, categoryFilter, trainerFilter]);

  // Reload courses when page or items per page changes
  useEffect(() => {
    loadCourses();
  }, [currentPage, itemsPerPage]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourses({
        per_page: itemsPerPage,
        page: currentPage,
        search: searchQuery || undefined,
        category: categoryFilter ? parseInt(categoryFilter) : undefined,
        status: undefined, // We can add status filter later if needed
      });
      
      if (response.success) {
        // Handle the actual API response structure
        const coursesData = response.data;
        let coursesList: Course[] = [];
        let paginationInfo = {
          total: 0,
          per_page: itemsPerPage,
          current_page: currentPage,
          last_page: 1,
          from: 0,
          to: 0
        };
        
        if (coursesData && coursesData.courses && Array.isArray(coursesData.courses.data)) {
          // API returns: { data: { courses: { data: [...] } } }
          coursesList = coursesData.courses.data;
          // Check for pagination info
          if (coursesData.courses.pagination) {
            paginationInfo = coursesData.courses.pagination;
          } else if (coursesData.pagination) {
            paginationInfo = coursesData.pagination;
          }
        } else if (Array.isArray(coursesData)) {
          // Fallback: direct array
          coursesList = coursesData;
        } else if (coursesData && Array.isArray(coursesData.courses)) {
          // Fallback: courses is direct array
          coursesList = coursesData.courses;
        } else if (coursesData && Array.isArray(coursesData.data)) {
          // Fallback: data is direct array
          coursesList = coursesData.data;
        } else {
          // ('Unexpected API response structure:', coursesData);
          coursesList = [];
        }

        // Apply client-side price filtering
        if (priceFilter && coursesList.length > 0) {
          coursesList = coursesList.filter(course => {
            const price = parseFloat(course.price);
            switch (priceFilter) {
              case '0-50':
                return price >= 0 && price <= 50;
              case '50-100':
                return price > 50 && price <= 100;
              case '100-200':
                return price > 100 && price <= 200;
              case '200+':
                return price > 200;
              default:
                return true;
            }
          });
        }

        setCourses(coursesList);
        setTotalItems(paginationInfo.total || coursesList.length);
        setTotalPages(paginationInfo.last_page || 1);
      } else {
        setCourses([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      // ('Error loading courses:', error);
      setCourses([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/course-creation`);
    } else {
      navigate('/course-creation');
    }
  };

  const handleViewCourse = (courseUuid: string) => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/course-view/${courseUuid}`);
    } else {
      navigate(`/course-view/${courseUuid}`);
    }
  };

  const handleEditCourse = (courseUuid: string) => {
    if (organization?.custom_domain) {
      navigate(`/${organization.custom_domain}/course-edit/${courseUuid}`);
    } else {
      navigate(`/course-edit/${courseUuid}`);
    }
  };

  const handleDeleteCourse = async (courseUuid: string) => {
    setCourseToDelete(courseUuid);
    setShowDeleteModal(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setLoading(true);
      const response = await apiService.deleteCourse(courseToDelete);
      
      if (response.success) {
        // Remove from local state
        setCourses(prev => prev.filter(course => course.uuid !== courseToDelete));
        
        // Show success message
        // ('Course deleted successfully:', response.message);
        // TODO: Add toast notification for success
      } else {
        // ('Failed to delete course:', response.message);
        // TODO: Add toast notification for error
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);
      
      // Handle 404 - Course already deleted
      if (error.status === 404) {
        // Remove from local state anyway since it doesn't exist
        setCourses(prev => prev.filter(course => course.uuid !== courseToDelete));
        console.warn('Course already deleted, removing from list');
      } else {
        // Show error for other cases
        console.error('Error deleting course:', error);
      }
      // TODO: Add toast notification for error
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getPaginationInfo = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return { startItem, endItem };
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm" style={{ backgroundColor: '#10b981' }}>{t('courseCreation.status.published')}</Badge>;
      case 0:
        return <Badge className="text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm" style={{ backgroundColor: accentColor }}>{t('courseCreation.status.draft')}</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">{t('common.unknown')}</Badge>;
    }
  };

  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
    return `${numericPrice.toFixed(0)} €`;
  };

  const formatDuration = (course: Course) => {
    if (course.duration && course.duration > 0) {
      return `${course.duration} Hours`;
    }
    if (course.duration_days && course.duration_days > 0) {
      return `${course.duration_days} Days`;
    }
    return 'No duration set';
  };

  const getInstructorName = (course: Course) => {
    // First check for trainers (new API format)
    if (course.trainers && course.trainers.length > 0) {
      return course.trainers[0].name;
    }
    // Fallback to course_instructors (legacy format)
    if (course.course_instructors && course.course_instructors.length > 0) {
      return course.course_instructors[0].name;
    }
    return 'No instructor assigned';
  };

  const getCourseImage = (course: Course) => {
    if (course.image_url) {
      // Handle escaped slashes in the URL
      const cleanUrl = course.image_url.replace(/\\\//g, '/');
      // (`🔍 Course ${course.id} image URL:`, cleanUrl);
      return cleanUrl;
    }
    // Return placeholder images based on course type or title
    const imageUrls = [
      '/assets/images/course-1.png',
      '/assets/images/course-2.png',
      '/assets/images/course-3.png',
      '/assets/images/course-4.png',
      '/assets/images/course-5.png',
      '/assets/images/course-6.png',
    ];
    // Use course ID to consistently pick the same placeholder
    const index = course.id % imageUrls.length;
    return imageUrls[index];
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If the course image fails to load, use a placeholder
    const img = e.target as HTMLImageElement;
    const imageUrls = [
      '/assets/images/course-1.png',
      '/assets/images/course-2.png',
      '/assets/images/course-3.png',
      '/assets/images/course-4.png',
      '/assets/images/course-5.png',
      '/assets/images/course-6.png'
    ];
    
    // Use course ID to consistently pick the same placeholder
    const courseId = parseInt(img.alt || '1');
    const index = courseId % imageUrls.length;
    img.src = imageUrls[index];
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full px-6 py-6 flex-1 min-h-0 overflow-hidden">
        <section className="flex flex-col w-full gap-5 flex-1 min-h-0">
          {/* Header Card */}
          <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <CardContent className="flex items-center justify-between p-[21px]">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Plus className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h1 
                    className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                    style={{ fontFamily: 'Poppins, Helvetica' }}
                  >
                {t('dashboard.sidebar.trainingManagement')}
              </h1>
                  <p 
                    className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
                  >
                    Gérez vos cours et formations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <Button 
                  onClick={handleCreateCourse}
                  className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-all duration-200"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[13px]">
                    {t('courseCreation.title')}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter and Search Card */}
          <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
            <CardContent className="flex flex-col gap-[26px] p-[21px]">
              <div className="flex items-center justify-between w-full">
                <div className="relative w-[461px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[22.22px] h-[22.22px] text-[#698eac]" />
                  <Input
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-[50px] bg-[#e8f0f7] border-0 rounded-[10px] [font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px] placeholder:text-[#698eac]"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative" ref={filterDropdownRef}>
                    <Button
                      variant="ghost"
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="h-10 gap-2.5 px-4 py-2.5 bg-[#f5f4f4] rounded-[10px] hover:bg-[#e5e4e4] transition-colors"
                    >
                      <Filter className="w-5 h-5 text-[#7e8ca9]" />
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                        {t('common.filter')}
                      </span>
                      <ChevronDown className="w-[11px] h-[6.51px] text-[#7e8ca9]" />
                    </Button>
                    
                    {/* Filter Dropdown */}
                    {showFilterDropdown && (
                      <div className="absolute top-12 right-0 bg-white border border-[#e2e2ea] rounded-[10px] shadow-lg z-10 min-w-[200px] p-4">
                        <div className="space-y-4">
                          {/* Price Filter */}
                          <div>
                            <label className="block text-sm font-medium text-[#19294a] mb-2">
                              {t('common.price')}
                            </label>
                            <select
                              value={priceFilter}
                              onChange={(e) => setPriceFilter(e.target.value)}
                              className="w-full p-2 border border-[#e2e2ea] rounded-[8px] text-sm"
                            >
                              <option value="">{t('common.allPrices')}</option>
                              <option value="0-50">0 - 50€</option>
                              <option value="50-100">50 - 100€</option>
                              <option value="100-200">100 - 200€</option>
                              <option value="200+">200€+</option>
                            </select>
                          </div>
                          
                          {/* Category Filter */}
                          <div>
                            <label className="block text-sm font-medium text-[#19294a] mb-2">
                              {t('common.category')}
                            </label>
                            <select
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="w-full p-2 border border-[#e2e2ea] rounded-[8px] text-sm"
                            >
                              <option value="">{t('common.allCategories')}</option>
                              <option value="1">Development</option>
                              <option value="2">Design</option>
                              <option value="3">Business</option>
                              <option value="4">Marketing</option>
                            </select>
                          </div>
                          
                          {/* Trainer Filter */}
                          <div>
                            <label className="block text-sm font-medium text-[#19294a] mb-2">
                              {t('common.trainer')}
                            </label>
                            <select
                              value={trainerFilter}
                              onChange={(e) => setTrainerFilter(e.target.value)}
                              className="w-full p-2 border border-[#e2e2ea] rounded-[8px] text-sm"
                            >
                              <option value="">{t('common.allTrainers')}</option>
                              <option value="trainer1">Formateur Nom</option>
                              <option value="trainer2">Autre Formateur</option>
                            </select>
                          </div>
                          
                          {/* Clear Filters */}
                          <div className="pt-2 border-t border-[#e2e2ea]">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPriceFilter('');
                                setCategoryFilter('');
                                setTrainerFilter('');
                                setSearchQuery('');
                              }}
                              className="w-full h-8 text-xs"
                            >
                              {t('common.clearFilters')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="h-10 gap-2.5 px-4 py-2.5 border-[#e2e2ea] rounded-[10px] hover:bg-[#f9f9f9] transition-colors"
                  >
                    <Download className="w-5 h-5 text-[#7e8ca9]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                      {t('common.export')}
                    </span>
                  </Button>

                  {/* View Toggle */}
                  <div className="flex items-center border border-[#e2e2ea] rounded-[10px] overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-none h-10 ${viewMode === 'grid' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'}`}
                      style={viewMode === 'grid' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-none h-10 ${viewMode === 'list' ? 'text-white' : 'text-[#7e8ca9] hover:bg-[#f5f4f4]'}`}
                      style={viewMode === 'list' ? { backgroundColor: primaryColor } : {}}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content System */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-stretch' : 'space-y-2'}>
            {(Array.isArray(courses) ? courses : []).map((course) => (
              <Card key={course.uuid} className={`bg-white border-[#e2e2ea] rounded-[12px] shadow-sm transition-all duration-200 overflow-hidden group flex flex-col ${
                viewMode === 'grid' 
                  ? 'h-[450px] hover:shadow-lg' 
                  : 'h-[100px] hover:bg-gray-50 hover:border-gray-300'
              }`}>
                {viewMode === 'grid' ? (
                  // Grid View - Card Layout
                  <>
                    {/* Hero Image Area - Fixed Aspect Ratio */}
                    <div className="relative h-[200px] overflow-hidden bg-gray-100">
                      <img
                        src={getCourseImage(course)}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                      
                      {/* Status Badge - Better positioning */}
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(course.status)}
                      </div>
                    </div>
                    
                    {/* Content Container */}
                    <CardContent className="p-5 flex-1 flex flex-col min-h-0">
                      {/* Typography Structure */}
                      <h3 className="font-bold text-lg text-[#19294a] mb-3 line-clamp-2 leading-tight [font-family:'Poppins',Helvetica] flex-shrink-0 min-h-[3.5rem]">
                        {course.title}
                      </h3>
                      
                      {/* Category Badge */}
                      <div className="mb-4 flex-shrink-0">
                        <span 
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white min-w-[80px] text-center justify-center"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          {course.category?.name || 'Development'}
                        </span>
                      </div>
                      
                      {/* Metadata Row */}
                      <div className="space-y-2 mb-4 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-[#7e8ca9] min-h-[20px]">
                          <Clock className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                          <span className="[font-family:'Poppins',Helvetica] truncate">
                            {formatDuration(course) || (
                              <span className="text-gray-400 italic">Duration not set</span>
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-[#7e8ca9] min-h-[20px]">
                          <User className="w-4 h-4 text-[#698eac] flex-shrink-0" />
                          <span className="[font-family:'Poppins',Helvetica] truncate">
                            {getInstructorName(course) || (
                              <span className="text-gray-400 italic">No instructor assigned</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Spacer to push price to bottom */}
                      <div className="flex-1"></div>
                      
                      {/* Price Display */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#e2e2ea] flex-shrink-0 min-h-[60px]">
                        <span 
                          className="font-bold text-xl [font-family:'Poppins',Helvetica]"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(course.price_ht || course.price)}
                        </span>
                        
                        {/* Additional Actions */}
                        <div className="flex gap-1 items-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md"
                            onClick={() => handleViewCourse(course.uuid)}
                            title={t('common.view')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md"
                            onClick={() => handleEditCourse(course.uuid)}
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-[#7e8ca9] hover:text-red-600 hover:bg-red-50 rounded-md"
                            onClick={() => handleDeleteCourse(course.uuid)}
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                  ) : (
                    // List View - Compact Horizontal Layout
                    <CardContent className="p-3 h-full">
                      <div className="flex items-center gap-3 w-full h-full">
                        {/* Compact Thumbnail */}
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={getCourseImage(course)}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                          {/* Status Badge */}
                          <div className="absolute top-1 left-1">
                            {getStatusBadge(course.status)}
                          </div>
                        </div>
                        
                        {/* Course Info - Compact */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-semibold text-base text-[#19294a] mb-1 line-clamp-1 [font-family:'Poppins',Helvetica]">
                            {course.title}
                          </h3>
                          
                          {/* Category Badge */}
                          <div className="mb-1">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: secondaryColor }}
                            >
                              {course.category?.name || 'Development'}
                            </span>
                          </div>
                          
                          {/* Metadata Row - Compact */}
                          <div className="flex items-center gap-3 text-xs text-[#7e8ca9]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#698eac]" />
                              <span className="[font-family:'Poppins',Helvetica] truncate">
                                {formatDuration(course) || (
                                  <span className="text-gray-400 italic">Not set</span>
                                )}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-[#698eac]" />
                              <span className="[font-family:'Poppins',Helvetica] truncate">
                                {getInstructorName(course) || (
                                  <span className="text-gray-400 italic">Not assigned</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price and Actions - Right Aligned */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span 
                            className="font-bold text-lg [font-family:'Poppins',Helvetica] min-w-[60px] text-right"
                            style={{ color: primaryColor }}
                          >
                            {formatPrice(course.price_ht || course.price)}
                          </span>
                          
                          {/* Action Buttons - Compact */}
                          <div className="flex gap-0.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md"
                              onClick={() => handleViewCourse(course.uuid)}
                              title={t('common.view')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md"
                              onClick={() => handleEditCourse(course.uuid)}
                              title={t('common.edit')}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-[#7e8ca9] hover:text-red-600 hover:bg-red-50 rounded-md"
                              onClick={() => handleDeleteCourse(course.uuid)}
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:500ms]">
              <CardContent className="flex items-center justify-between p-[21px]">
                {/* Pagination Info */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">
                    Showing {getPaginationInfo().startItem} to {getPaginationInfo().endItem} of {totalItems} courses
                  </span>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="px-2 py-1 border border-[#e2e2ea] rounded-[6px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                    <span className="text-sm text-[#7e8ca9] [font-family:'Poppins',Helvetica]">per page</span>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-[#e2e2ea] rounded-[6px] hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === 1 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === 1 ? { backgroundColor: primaryColor } : {}}
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="text-[#7e8ca9] px-1">...</span>}
                      </>
                    )}

                    {/* Middle pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === pageNum 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === pageNum ? { backgroundColor: primaryColor } : {}}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-[#7e8ca9] px-1">...</span>}
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className={`h-8 w-8 p-0 rounded-[6px] ${
                            currentPage === totalPages 
                              ? 'text-white' 
                              : 'border-[#e2e2ea] hover:bg-[#f9f9f9]'
                          }`}
                          style={currentPage === totalPages ? { backgroundColor: primaryColor } : {}}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-[#e2e2ea] rounded-[6px] hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!Array.isArray(courses) || courses.length === 0) && (
            <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
              <CardContent className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[#e8f0f7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#698eac]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#19294a] mb-2 [font-family:'Poppins',Helvetica]">
                    {t('courseCreation.emptyState.title')}
                  </h3>
                  <p className="text-[#7e8ca9] mb-6 [font-family:'Poppins',Helvetica]">
                    {t('courseCreation.emptyState.description')}
                  </p>
                  <Button 
                    onClick={handleCreateCourse}
                    className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-all duration-200 [font-family:'Poppins',Helvetica] font-medium text-white text-[13px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-5 h-5" />
                    {t('courseCreation.emptyState.createFirst')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full mx-4 relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={cancelDeleteCourse}
              className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>

            {/* Warning Header */}
            <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-red-700 font-medium text-sm [font-family:'Poppins',Helvetica]">
                  Voulez-vous vraiment supprimer cette formation ?
                </span>
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center mb-8">
              <p className="text-gray-800 text-base [font-family:'Poppins',Helvetica]">
                Cette action est irréversible.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteCourse}
                variant="outline"
                className="flex-1 h-12 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-[10px] font-medium [font-family:'Poppins',Helvetica]"
              >
                Non, Annuler
              </Button>
              <Button
                onClick={confirmDeleteCourse}
                disabled={loading}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium [font-family:'Poppins',Helvetica] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Suppression...' : 'Oui Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
