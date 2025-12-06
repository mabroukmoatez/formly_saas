import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { courseCreation } from '../../services/courseCreation';
import { Search, Clock, User, Eye, MoreHorizontal, Edit, Trash2, Plus, Grid3X3, List, X, AlertTriangle, Filter, ChevronDown, ChevronLeft, ChevronRight, Copy, Archive, BookOpen } from 'lucide-react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { SuccessModal } from '../../components/ui/success-modal';

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
  created_by?: number;
  created_by_user?: {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string;
  };
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
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [courseToDuplicate, setCourseToDuplicate] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  // Temporary filter states for modal
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempTrainer, setTempTrainer] = useState('');
  const [tempStatus, setTempStatus] = useState('');

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
  }, [priceFilter, categoryFilter, trainerFilter, statusFilter]);

  // Reload courses when page or items per page changes
  useEffect(() => {
    loadCourses();
  }, [currentPage, itemsPerPage]);

  // Apply filters from modal
  const applyFilters = () => {
    // Combine min and max price into priceFilter
    if (tempMinPrice || tempMaxPrice) {
      setPriceFilter(`${tempMinPrice || '0'}-${tempMaxPrice || '999999'}`);
    } else {
      setPriceFilter('');
    }
    setCategoryFilter(tempCategory);
    setTrainerFilter(tempTrainer);
    setStatusFilter(tempStatus);
    setShowFilterModal(false);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempCategory('');
    setTempTrainer('');
    setTempStatus('');
    setPriceFilter('');
    setCategoryFilter('');
    setTrainerFilter('');
    setStatusFilter('');
  };

  // Open filter modal with current values
  const openFilterModal = () => {
    // Parse current priceFilter if exists
    if (priceFilter) {
      const [min, max] = priceFilter.split('-');
      setTempMinPrice(min === '0' ? '' : min);
      setTempMaxPrice(max === '999999' ? '' : max);
    } else {
      setTempMinPrice('');
      setTempMaxPrice('');
    }
    setTempCategory(categoryFilter);
    setTempTrainer(trainerFilter);
    setTempStatus(statusFilter);
    setShowFilterModal(true);
  };

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

        // Apply client-side filters
        let filteredCourses = coursesList;

        // Price filter (format: "min-max")
        if (priceFilter && filteredCourses.length > 0) {
          const [min, max] = priceFilter.split('-').map(v => parseFloat(v) || 0);
          filteredCourses = filteredCourses.filter(course => {
            const price = parseFloat(course.price);
            return price >= min && price <= max;
          });
        }

        // Trainer filter
        if (trainerFilter && filteredCourses.length > 0) {
          filteredCourses = filteredCourses.filter(course => {
            return course.trainers?.some(trainer =>
              trainer.id.toString() === trainerFilter ||
              trainer.name.toLowerCase().includes(trainerFilter.toLowerCase())
            ) || course.course_instructors?.some(instructor =>
              instructor.id.toString() === trainerFilter ||
              instructor.name.toLowerCase().includes(trainerFilter.toLowerCase())
            );
          });
        }

        // Status filter
        if (statusFilter && filteredCourses.length > 0) {
          const statusMap: Record<string, number> = {
            'published': 1,
            'draft': 0,
            'archived': 2,
          };
          const statusValue = statusMap[statusFilter];
          if (statusValue !== undefined) {
            filteredCourses = filteredCourses.filter(course => course.status === statusValue);
          }
        }

        setCourses(filteredCourses);
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
    setMenuOpenFor(null);
  };

  const handleDuplicateCourse = (courseUuid: string) => {
    setCourseToDuplicate(courseUuid);
    setShowDuplicateModal(true);
    setMenuOpenFor(null);
  };

  const confirmDuplicateCourse = async () => {
    if (!courseToDuplicate) return;

    try {
      setLoading(true);
      setShowDuplicateModal(false);

      const response = await courseCreation.duplicateCourse(courseToDuplicate, {
        title_suffix: ' (Copie)',
        status: 0 // Draft status
      });

      if (response.success) {
        // Reload courses list
        await loadCourses();
        setSuccessMessage({
          title: 'Formation dupliquée',
          message: 'La formation a été dupliquée avec succès.'
        });
        setShowSuccessModal(true);
      } else {
        const errorMessage = response.message || 'Erreur inconnue';
        setSuccessMessage({
          title: 'Erreur',
          message: `Erreur lors de la duplication: ${errorMessage}`
        });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la duplication:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      setSuccessMessage({
        title: 'Erreur',
        message: `Erreur lors de la duplication: ${errorMessage}`
      });
      setShowSuccessModal(true);
    } finally {
      setLoading(false);
      setCourseToDuplicate(null);
    }
  };

  const handleArchiveCourse = async (courseUuid: string) => {
    // TODO: Implement archive functionality
    console.log('Archive course:', courseUuid);
    setMenuOpenFor(null);
  };

  const handlePublishCourse = async (courseUuid: string) => {
    // TODO: Implement publish functionality
    console.log('Publish course:', courseUuid);
    setMenuOpenFor(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside the menu and not on a menu button
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Also check if it's not a button inside the menu dropdown
        const menuDropdown = document.querySelector('[data-menu-dropdown]');
        if (!menuDropdown || !menuDropdown.contains(target)) {
          setMenuOpenFor(null);
        }
      }
    };

    if (menuOpenFor) {
      // Use a small delay to allow menu button clicks to register first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenFor]);

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setLoading(true);
      console.log('🗑️ Deleting course:', courseToDelete);

      // Try using courseCreation service first (more consistent with other operations)
      const response = await courseCreation.deleteCourse(courseToDelete);
      console.log('✅ Delete response:', response);

      // Check if response indicates success
      // Some APIs return 200/204 without body, others return { success: true }
      if (response === null || response === undefined || (response && response.success !== false)) {
        // Success - reload courses list to refresh pagination
        await loadCourses();
        setShowDeleteModal(false);
        setSuccessMessage({
          title: 'Formation supprimée',
          message: 'La formation a été supprimée avec succès.'
        });
        setShowSuccessModal(true);
      } else {
        const errorMessage = (response as any)?.message || 'Erreur inconnue lors de la suppression';
        console.error('❌ Failed to delete course:', errorMessage);
        setShowDeleteModal(false);
        setSuccessMessage({
          title: 'Erreur',
          message: `Erreur lors de la suppression: ${errorMessage}`
        });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('❌ Error deleting course:', error);
      console.error('Error details:', {
        status: error?.status || error?.response?.status,
        message: error?.message || error?.response?.data?.message,
        data: error?.response?.data
      });

      // Handle different error types
      const status = error?.status || error?.response?.status;
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur inconnue';

      setShowDeleteModal(false);

      if (status === 404) {
        // Course already deleted, just reload the list
        await loadCourses();
        setSuccessMessage({
          title: 'Information',
          message: 'La formation a déjà été supprimée.'
        });
      } else if (status === 403 || status === 401) {
        setSuccessMessage({
          title: 'Permission refusée',
          message: 'Vous n\'avez pas la permission de supprimer cette formation.'
        });
      } else if (status === 500) {
        setSuccessMessage({
          title: 'Erreur serveur',
          message: 'Erreur serveur lors de la suppression. Veuillez réessayer plus tard.'
        });
      } else {
        setSuccessMessage({
          title: 'Erreur',
          message: `Erreur lors de la suppression: ${errorMessage}`
        });
      }
      setShowSuccessModal(true);
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
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: '#22c55e' }}>
            <span className="text-[13px] font-medium" style={{ color: '#22c55e' }}>{t('courseCreation.status.published')}</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          </div>
        );
      case 0:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: accentColor }}>
            <span className="text-[13px] font-medium" style={{ color: accentColor }}>{t('courseCreation.status.draft')}</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-gray-400">
            <span className="text-[13px] font-medium text-gray-400">{t('common.unknown')}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          </div>
        );
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

  const getCourseImage = (course: Course): string | null => {
    if (course.image_url) {
      // Handle escaped slashes in the URL
      const cleanUrl = course.image_url.replace(/\\\//g, '/');
      return cleanUrl;
    }
    return null; // Return null to indicate no image
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Hide the image and show placeholder instead
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.classList.add('has-placeholder');
    }
  };

  const getCreatedByInfo = (course: Course) => {
    if (course.created_by_user) {
      return course.created_by_user.name;
    }
    return null;
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
                  <Button
                    variant="ghost"
                    onClick={openFilterModal}
                    className="h-10 gap-2.5 px-4 py-2.5 bg-[#f5f4f4] rounded-[10px] hover:bg-[#e5e4e4] transition-colors"
                  >
                    <Filter className="w-5 h-5 text-[#7e8ca9]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                      {t('common.filter')}
                    </span>
                    <ChevronDown className="w-[11px] h-[6.51px] text-[#7e8ca9]" />
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
              <Card
                key={course.uuid}
                className={`bg-white border-[#e2e2ea] rounded-[30px] shadow-sm transition-all duration-300 group flex flex-col cursor-pointer ${viewMode === 'grid'
                  ? 'min-h-[480px] hover:shadow-lg overflow-hidden'
                  : 'h-[100px] hover:bg-gray-50 hover:border-gray-300 overflow-visible'
                  }`}
                onClick={() => handleViewCourse(course.uuid)}
              >
                {viewMode === 'grid' ? (
                  // Grid View - New Figma Design
                  <>
                    {/* Hero Image - Top */}
                    <div className="relative h-[220px] overflow-hidden m-2 rounded-[24px] z-0">
                      {getCourseImage(course) ? (
                        <img
                          src={getCourseImage(course) || ''}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-blue-200" />
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="flex flex-col flex-1 px-5 pt-2 pb-5 z-10 relative bg-white">

                      {/* Title */}
                      <h3 className="font-bold text-[18px] text-[#19294a] mb-4 line-clamp-2 leading-tight [font-family:'Poppins',Helvetica]">
                        {course.title}
                      </h3>

                      {/* Tags & Time Row */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {/* Main Category Badge */}
                          <div className="px-3 py-1.5 rounded-full bg-[#f0f2f5] text-[#64748b] text-xs font-medium">
                            {course.category?.name || 'Général'}
                          </div>
                          {/* Extra Tag (Simulated) */}
                          <div className="px-2 py-1.5 rounded-full bg-[#f0f2f5] text-[#64748b] text-xs font-medium">
                            +5
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                          <span className="text-sm font-medium" style={{ color: primaryColor }}>
                            {course.duration ? `${course.duration} Hours` : '20h'}
                          </span>
                        </div>
                      </div>

                      {/* User & Price Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" style={{ color: primaryColor }} />
                          <span className="text-[15px] font-bold text-[#19294a]">
                            {getInstructorName(course)}
                          </span>
                        </div>

                        <div className="text-[22px] font-bold text-[#19294a]">
                          {formatPrice(course.price_ht || course.price)}
                        </div>
                      </div>

                      {/* Creator Subtext */}
                      <div className="text-xs text-gray-400 mb-5">
                        Cree Par : <span className="font-medium">{getCreatedByInfo(course) || 'Admin'}</span>
                      </div>

                      {/* Divider (Implicit by spacing) */}
                      <div className="mt-auto"></div>

                      {/* Footer: Status & Actions */}
                      <div className="flex items-center justify-between pt-2">
                        {/* Status Badge */}
                        <div onClick={(e) => e.stopPropagation()}>
                          {getStatusBadge(course.status)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {/* Eye/View Button */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${primaryColor}15` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCourse(course.uuid);
                            }}
                          >
                            <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                          </div>

                          {/* Menu Button */}
                          <div className="relative" ref={menuRef}>
                            <div
                              className="w-10 h-10 rounded-full bg-[#e8f0f7] flex items-center justify-center cursor-pointer hover:bg-[#dfe7ee] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenFor(menuOpenFor === course.uuid ? null : course.uuid);
                              }}
                            >
                              <MoreHorizontal className="w-5 h-5 text-[#698eac]" />
                            </div>

                            {menuOpenFor === course.uuid && (
                              <div
                                data-menu-dropdown
                                className="absolute right-0 bottom-full mb-2 z-[100] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                  style={{ color: '#3b82f6' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setMenuOpenFor(null);
                                    handleEditCourse(course.uuid);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                  {t('common.edit')}
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors"
                                  style={{ color: '#a855f7' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setMenuOpenFor(null);
                                    handleDuplicateCourse(course.uuid);
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                  {t('common.duplicate')}
                                </button>
                                {course.status === 0 ? (
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setMenuOpenFor(null);
                                      handlePublishCourse(course.uuid);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                    Publier
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setMenuOpenFor(null);
                                      handleArchiveCourse(course.uuid);
                                    }}
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archiver
                                  </button>
                                )}
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  style={{ color: '#ef4444' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setMenuOpenFor(null);
                                    handleDeleteCourse(course.uuid);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t('common.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View - Compact Horizontal Layout
                  <CardContent className="p-3 h-full">
                    <div className="flex items-center gap-3 w-full h-full">
                      {/* Compact Thumbnail */}
                      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {getCourseImage(course) ? (
                          <img
                            src={getCourseImage(course) || ''}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
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

                          {/* Created By */}
                          {getCreatedByInfo(course) && (
                            <span className="[font-family:'Poppins',Helvetica] truncate">
                              Créé par <span className="font-medium">{getCreatedByInfo(course)}</span>
                            </span>
                          )}
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

                        {/* Menu 3 points */}
                        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#7e8ca9] hover:text-[#19294a] hover:bg-gray-100 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenFor(menuOpenFor === course.uuid ? null : course.uuid);
                            }}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>

                          {/* Context Menu */}
                          {menuOpenFor === course.uuid && (
                            <div
                              className="absolute right-0 top-10 z-[100] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                              data-menu-dropdown
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setMenuOpenFor(null);
                                  handleViewCourse(course.uuid);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Aperçu
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setMenuOpenFor(null);
                                  handleEditCourse(course.uuid);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setMenuOpenFor(null);
                                  handleDuplicateCourse(course.uuid);
                                }}
                              >
                                <Copy className="w-4 h-4" />
                                Dupliquer
                              </button>
                              {course.status === 0 ? (
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setMenuOpenFor(null);
                                    handlePublishCourse(course.uuid);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                  Publier
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setMenuOpenFor(null);
                                    handleArchiveCourse(course.uuid);
                                  }}
                                >
                                  <Archive className="w-4 h-4" />
                                  Archiver
                                </button>
                              )}
                              <div className="border-t border-gray-200 my-1"></div>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
                                style={{ color: '#ef4444' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setMenuOpenFor(null);
                                  handleDeleteCourse(course.uuid);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
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
                          className={`h-8 w-8 p-0 rounded-[6px] ${currentPage === 1
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
                          className={`h-8 w-8 p-0 rounded-[6px] ${currentPage === pageNum
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
                          className={`h-8 w-8 p-0 rounded-[6px] ${currentPage === totalPages
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
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteCourse}
        onConfirm={confirmDeleteCourse}
        title="Voulez-vous vraiment supprimer cette formation ?"
        message="Cette action est irréversible."
        confirmText="Oui Supprimer"
        cancelText="Non, Annuler"
        type="danger"
        isLoading={loading}
      />

      {/* Duplicate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setCourseToDuplicate(null);
        }}
        onConfirm={confirmDuplicateCourse}
        title="Dupliquer cette formation ?"
        message="Une copie de cette formation sera créée avec le suffixe ' (Copie)' et sera en brouillon."
        confirmText="Oui, Dupliquer"
        cancelText="Annuler"
        type="info"
        isLoading={loading}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-[18px] max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}>
              <h2 className={`[font-family:'Poppins',Helvetica] font-bold text-xl ${isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                Montant TTC
              </h2>
              <button
                onClick={resetAllFilters}
                className="[font-family:'Poppins',Helvetica] font-medium text-sm hover:underline"
                style={{ color: primaryColor }}
              >
                Reset
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Montant TTC (Min/Max) */}
              <div>
                <label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-3 block ${isDark ? 'text-gray-300' : 'text-[#19294a]'
                  }`}>
                  Montant TTC
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Ex: 1000 €"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    className={`h-10 rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#f5f5f5] border-[#e2e2ea]'
                      } [font-family:'Poppins',Helvetica] text-sm`}
                  />
                  <Input
                    type="number"
                    placeholder="Ex: 2000 €"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    className={`h-10 rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#f5f5f5] border-[#e2e2ea]'
                      } [font-family:'Poppins',Helvetica] text-sm`}
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'
                    }`}>
                    Catégorie
                  </label>
                  <button
                    onClick={() => setTempCategory('')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className={`w-full h-10 px-4 rounded-[10px] ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-[#f5f5f5] border-[#e2e2ea] text-[#19294a]'
                    } [font-family:'Poppins',Helvetica] text-sm border`}
                >
                  <option value="">Sélectionner Catégorie</option>
                  <option value="1">Development</option>
                  <option value="2">Design</option>
                  <option value="3">Business</option>
                  <option value="4">Marketing</option>
                </select>
              </div>

              {/* Formateur */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'
                    }`}>
                    Formateur
                  </label>
                  <button
                    onClick={() => setTempTrainer('')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <select
                  value={tempTrainer}
                  onChange={(e) => setTempTrainer(e.target.value)}
                  className={`w-full h-10 px-4 rounded-[10px] ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-[#f5f5f5] border-[#e2e2ea] text-[#19294a]'
                    } [font-family:'Poppins',Helvetica] text-sm border`}
                >
                  <option value="">Sélectionner formateur</option>
                  <option value="trainer1">Formateur Nom</option>
                  <option value="trainer2">Autre Formateur</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-[#19294a]'
                    }`}>
                    Status
                  </label>
                  <button
                    onClick={() => setTempStatus('')}
                    className="[font-family:'Poppins',Helvetica] font-medium text-xs hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Reset
                  </button>
                </div>
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className={`w-full h-10 px-4 rounded-[10px] ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-[#f5f5f5] border-[#e2e2ea] text-[#19294a]'
                    } [font-family:'Poppins',Helvetica] text-sm border`}
                >
                  <option value="">Tous les statuts</option>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex justify-between gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(false)}
                className="rounded-[10px] [font-family:'Poppins',Helvetica]"
              >
                Annuler
              </Button>
              <Button
                onClick={applyFilters}
                className="rounded-[10px] flex-1 [font-family:'Poppins',Helvetica] font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
