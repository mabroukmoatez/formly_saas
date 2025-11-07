import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FileText, 
  Download, 
  Eye, 
  GraduationCap,
  Filter,
  FileSpreadsheet,
  Trash2,
  MoreVertical,
  ArrowLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { DashboardLayout } from '../../components/CommercialDashboard/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { CreateFolderModal } from '../../components/SupportsPedagogiques/CreateFolderModal';
import { documentHubService } from '../../services/documentHub';
import { courseCreation } from '../../services/courseCreation';

export const SupportsPedagogiques: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { navigateToRoute, buildRoute } = useSubdomainNavigation();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  const [courses, setCourses] = useState<any[]>([]);
  const [customFolders, setCustomFolders] = useState<any[]>([]);
  const [allFolders, setAllFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'formations' | 'custom'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [folderDocuments, setFolderDocuments] = useState<{[key: string]: any}>({});
  const [recentFolders, setRecentFolders] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<Array<{id: string, name: string, type: string}>>([]);

  useEffect(() => {
    loadHub();
  }, [filterType, searchQuery]);

  useEffect(() => {
    if (courses.length > 0) {
      loadStatistics();
    }
  }, [courses]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFilterDropdown(false);
    };
    
    if (showFilterDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFilterDropdown]);

  const loadHub = async () => {
    try {
      setLoading(true);
      
      // Charger les formations (dossiers automatiques)
      const coursesResponse = await courseCreation.getCourses({
        search: searchQuery || undefined
      });
      
      console.log('📚 Courses loaded for hub:', coursesResponse);
      
      let coursesArray = [];
      if (coursesResponse.success) {
        if (coursesResponse.data?.courses?.data) {
          coursesArray = coursesResponse.data.courses.data;
        } else if (coursesResponse.data?.data) {
          coursesArray = coursesResponse.data.data;
        } else if (Array.isArray(coursesResponse.data)) {
          coursesArray = coursesResponse.data;
        }
        console.log('📚 Courses extracted:', coursesArray);
        setCourses(coursesArray);
      }
      
      // Charger les dossiers personnalisés (via documentHub)
      const foldersResponse = await documentHubService.getHub({
        search: searchQuery || undefined
      });
      
      console.log('📁 Custom folders loaded:', foldersResponse);
      
      let customFoldersArray = [];
      if (foldersResponse.success && foldersResponse.data?.folders) {
        customFoldersArray = foldersResponse.data.folders;
        console.log('📁 Custom folders extracted:', customFoldersArray);
        setCustomFolders(customFoldersArray);
      }
      
      // Fusionner et filtrer selon le type
      let combined = [];
      if (filterType === 'all') {
        // Formations en tant que dossiers
        const coursesFolders = coursesArray.map((course: any) => ({
          ...course,
          is_system: true,
          type: 'formation'
        }));
        // Dossiers personnalisés
        const customFoldersFormatted = customFoldersArray.map((folder: any) => ({
          ...folder,
          type: 'custom'
        }));
        combined = [...coursesFolders, ...customFoldersFormatted];
      } else if (filterType === 'formations') {
        combined = coursesArray.map((course: any) => ({
          ...course,
          is_system: true,
          type: 'formation'
        }));
      } else {
        combined = customFoldersArray.map((folder: any) => ({
          ...folder,
          type: 'custom'
        }));
      }
      
      console.log('📦 Combined folders:', combined);
      setAllFolders(combined);
      
      // Get recent folders (last 6, sorted by created_at)
      const sorted = [...combined].sort((a, b) => {
        const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
        const dateB = new Date(b.created_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      });
      setRecentFolders(sorted.slice(0, 6));
      
    } catch (err) {
      console.error('Error loading hub:', err);
      showError(t('common.error'), 'Impossible de charger les dossiers');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // Calculer les statistiques depuis toutes les sources
      const totalDocuments = courses.reduce((sum, course) => sum + (course.total_documents || 0), 0) + 
                            customFolders.reduce((sum, folder) => sum + (folder.total_documents || 0), 0);
      const totalSize = customFolders.reduce((sum, folder) => sum + (folder.total_size || 0), 0);
      
      setStatistics({
        total_folders: courses.length + customFolders.length,
        total_documents: totalDocuments,
        total_questionnaires: courses.reduce((sum, course) => sum + (course.total_questionnaires || 0), 0) +
                              customFolders.reduce((sum, folder) => sum + (folder.total_questionnaires || 0), 0),
        total_size: totalSize,
        storage_used_percentage: Math.min(Math.round((totalSize / (34 * 1024 * 1024 * 1024)) * 100), 100),
        storage_limit: 34 * 1024 * 1024 * 1024 // 34 GB
      });
    } catch (err) {
      console.error('Error calculating statistics:', err);
    }
  };


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const navigateToFolder = async (folderId: string, folderName: string, folderType: string) => {
    setCurrentFolder(folderId);
    setNavigationPath(prev => [...prev, { id: folderId, name: folderName, type: folderType }]);
    
    // Load folder documents if not already loaded
    if (!folderDocuments[folderId]) {
      try {
        const docsResponse = await courseCreation.getDocumentsEnhanced(folderId, { 
          exclude_questionnaires: true 
        });
        
        const questsResponse = await courseCreation.getDocumentsEnhanced(folderId, { 
          questionnaires_only: true 
        });
        
        setFolderDocuments(prev => ({
          ...prev,
          [folderId]: {
            documents: docsResponse.success && docsResponse.data ? docsResponse.data : [],
            questionnaires: questsResponse.success && questsResponse.data ? questsResponse.data : []
          }
        }));
      } catch (err) {
        console.error('Error loading folder documents:', err);
        showError(t('common.error'), 'Impossible de charger les documents');
      }
    }
  };

  const navigateToPath = (index: number) => {
    if (index === -1) {
      // Navigate to root
      setCurrentFolder(null);
      setNavigationPath([]);
    } else {
      // Navigate to specific path item
      const newPath = navigationPath.slice(0, index + 1);
      const targetFolder = newPath[newPath.length - 1];
      setCurrentFolder(targetFolder.id);
      setNavigationPath(newPath);
    }
  };

  const goBack = () => {
    if (navigationPath.length > 1) {
      const newPath = navigationPath.slice(0, -1);
      const parentFolder = newPath[newPath.length - 1];
      setCurrentFolder(parentFolder?.id || null);
      setNavigationPath(newPath);
    } else {
      navigateToPath(-1);
    }
  };

  const getCurrentFolderContent = () => {
    if (!currentFolder) {
      return allFolders;
    }
    
    const folder = allFolders.find(f => (f.uuid || f.id) === currentFolder);
    if (!folder) return [];
    
    const content = folderDocuments[currentFolder];
    if (!content) return [];
    
    // Combine documents and questionnaires
    const items = [
      ...(content.documents || []).map((doc: any) => ({
        ...doc,
        type: 'document',
        isFile: true
      })),
      ...(content.questionnaires || []).map((quest: any) => ({
        ...quest,
        type: 'questionnaire',
        isFile: true
      }))
    ];
    
    return items;
  };

  return (
    <DashboardLayout>
      <div className={`px-[27px] py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Folder className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Supports Pédagogiques
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Gérez tous vos documents de formation
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateFolderModal(true)}
            className="gap-2 px-6 py-3 rounded-[10px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span className="[font-family:'Poppins',Helvetica] font-medium">Nouveau Dossier</span>
          </Button>
        </div>

        {/* Recently Added Section and Storage Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recently Added Section */}
          <div className="lg:col-span-2">
            <h2 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Récemment Ajouté
            </h2>
            {recentFolders.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {recentFolders.map((folder) => (
                  <Card 
                    key={folder.uuid || folder.id}
                    className={`rounded-[13px] cursor-pointer transition-all hover:shadow-md ${
                      isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-white'
                    }`}
                    onClick={() => {
                      if (folder.type === 'formation') {
                        navigateToFolder(folder.uuid, folder.type === 'formation' ? folder.title : folder.name, folder.type);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Folder className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-sm flex-1 truncate ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {folder.type === 'formation' ? folder.title : folder.name}
                        </span>
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span>{folder.total_documents || 0} Files</span>
                        </div>
                        <div>
                          {new Date(folder.created_at || folder.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg border border-dashed py-12 text-center ${
                isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <p className="text-sm">Aucun dossier récent</p>
              </div>
            )}
          </div>

          {/* Storage Usage Widget - Fixed Right */}
          {statistics && (
            <div className="flex justify-end">
              <Card className={`rounded-[13px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardContent className="p-5 flex flex-col items-center">
                  <div className="relative w-[200px] h-[120px] mb-4">
                    <svg className="w-full h-full" viewBox="0 0 200 120">
                      {/* Background semi-circle */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                        strokeWidth="16"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Progress semi-circle with gradient */}
                      <defs>
                        <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffa366" />
                          <stop offset="100%" stopColor="#ff7700" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        stroke="url(#storageGradient)"
                        strokeWidth="16"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.PI * 80}`}
                        strokeDashoffset={`${Math.PI * 80 * (1 - (statistics.storage_used_percentage / 100))}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '20px' }}>
                      <span className={`[font-family:'Poppins',Helvetica] font-bold text-[48px] ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {statistics.storage_used_percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`[font-family:'Urbanist',Helvetica] font-medium text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {formatBytes(statistics.total_size)} of {formatBytes(statistics.storage_limit)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <Input
              placeholder="Recherche Une Formation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#ecf1fd]'}`}
            />
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowFilterDropdown(!showFilterDropdown); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#e8f0f7] border-gray-300'}`}
            >
              <Filter className="w-4 h-4" style={{ color: secondaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]" style={{ color: secondaryColor }}>
                Filtre
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: secondaryColor }} />
            </button>
            {showFilterDropdown && (
              <div className={`absolute top-full mt-2 w-48 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-50`}
                   onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setFilterType('all'); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''} first:rounded-t-lg`}
                >
                  Tous
                </button>
                <button
                  onClick={() => { setFilterType('formations'); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''}`}
                >
                  Formations uniquement
                </button>
                <button
                  onClick={() => { setFilterType('custom'); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-white' : ''} last:rounded-b-lg`}
                >
                  Dossiers personnalisés
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="gap-2 px-4 py-2.5 rounded-[10px] border-dashed"
            style={{ borderColor: secondaryColor, color: secondaryColor }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">Export Excel</span>
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        {(currentFolder || navigationPath.length > 0) && (
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToPath(-1)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Supports Pédagogiques
              </button>
              {navigationPath.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToPath(index)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Folders List / File Explorer */}
        <Card className={`rounded-[18px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className={`flex items-center justify-between px-[27px] py-4 border-b ${isDark ? 'border-gray-700' : 'border-[#d2d2e7]'}`}>
              <div className="flex items-center gap-2 min-w-[250px]">
                <Checkbox />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                  {currentFolder ? 'Nom De Fichier' : 'Nom De Formation'}
                </span>
                <ChevronDown className="w-4 h-4" style={{ color: secondaryColor }} />
              </div>

              <div className="flex items-center justify-center min-w-[120px]">
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                  Taille
                </span>
                <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
              </div>

              <div className="flex items-center justify-center min-w-[120px]">
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                  Date
                </span>
                <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
              </div>

              {!currentFolder && (
                <>
                  <div className="flex items-center justify-center min-w-[150px]">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      Formateur
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
                  </div>

                  <div className="flex items-center justify-center min-w-[140px]">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      Nombre De Fichier
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
                  </div>
                </>
              )}

              {currentFolder && (
                <>
                  <div className="flex items-center justify-center min-w-[150px]">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      Type
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
                  </div>

                  <div className="flex items-center justify-center min-w-[140px]">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                      Nombre De Fichier
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1" style={{ color: secondaryColor }} />
                  </div>
                </>
              )}

              <div className="w-10"></div>
            </div>

            {/* Folders / Files */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                     style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
              </div>
            ) : currentFolder ? (
              // Show folder content (files)
              <div>
                {getCurrentFolderContent().length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: primaryColor }} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Ce dossier est vide
                    </p>
                  </div>
                ) : (
                  getCurrentFolderContent().map((item: any) => (
                    <div
                      key={item.uuid || item.id}
                      className={`flex items-center justify-between px-[27px] py-3 border-b cursor-pointer transition-colors ${
                        isDark ? 'border-gray-700 hover:bg-gray-750' : 'border-[#d2d2e7] hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (item.type === 'formation') {
                          window.open(buildRoute(`/course/${currentFolder}/document/${item.id}`), '_blank');
                        } else {
                          window.open(item.file_url, '_blank');
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-[250px]">
                        <Checkbox onClick={(e) => e.stopPropagation()} />
                        <FileText className="w-5 h-5" style={{ color: item.type === 'questionnaire' ? '#8c2ffe' : primaryColor }} />
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px] ${
                          isDark ? 'text-white' : 'text-[#19294a]'
                        }`}>
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[120px]">
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px] ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.file_size ? formatBytes(item.file_size) : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[120px]">
                        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px] ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(item.created_at || item.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[150px]">
                        <Badge 
                          className="px-3 py-0.5 rounded-[20px]"
                          style={{ 
                            backgroundColor: item.type === 'questionnaire' ? '#eee0ff' : '#e5f3ff', 
                            color: item.type === 'questionnaire' ? '#8c2ffe' : secondaryColor 
                          }}
                        >
                          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[15px]">
                            {item.type === 'questionnaire' ? 'Questionnaire' : 'Document'}
                          </span>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-center min-w-[140px]">
                        <Badge 
                          className="px-3 py-1 rounded-[35px]"
                          style={{ backgroundColor: '#eee0ff', color: '#8c2ffe' }}
                        >
                          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[15px]">
                            1 Fichier
                          </span>
                        </Badge>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === 'formation') {
                            window.open(buildRoute(`/course/${currentFolder}/document/${item.id}`), '_blank');
                          } else {
                            window.open(item.file_url, '_blank');
                          }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <Eye className="w-5 h-5" style={{ color: secondaryColor }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : allFolders.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: primaryColor }} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aucun dossier trouvé
                </p>
              </div>
            ) : (
              // Show root folders
              <div>
                {allFolders.map((folder) => {
                  const isFormation = folder.type === 'formation';
                  const folderId = folder.uuid;
                  
                  return (
                  <div key={folderId}>
                    {/* Folder Row */}
                    <div 
                      className={`flex items-center justify-between px-[27px] py-3 border-b cursor-pointer transition-colors ${
                        isDark ? 'border-gray-700 hover:bg-gray-750' : 'border-[#d2d2e7] hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        navigateToFolder(folderId, isFormation ? folder.title : folder.name, folder.type);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-[250px]">
                        <Checkbox onClick={(e) => e.stopPropagation()} />
                        <Folder className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                          {isFormation ? folder.title : folder.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[120px]">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#9CA3AF' : '#19294a' }}>
                          {folder.total_size ? formatBytes(folder.total_size) : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[120px]">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[11.7px] tracking-[0.93px]" style={{ color: isDark ? '#9CA3AF' : '#19294a' }}>
                          {new Date(folder.created_at || folder.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-center min-w-[150px]">
                        {isFormation && folder.trainers && folder.trainers.length > 1 ? (
                          <div className="flex items-center gap-2">
                            <Badge 
                              className="px-3 py-0.5 rounded-[20px]"
                              style={{ backgroundColor: '#e5f3ff', color: secondaryColor }}
                            >
                              <span className="[font-family:'Urbanist',Helvetica] font-medium text-[15px]">
                                {folder.trainers[0]?.name || 'Nom De Formateur'}
                              </span>
                            </Badge>
                            <Badge 
                              className="px-2 py-0.5 rounded-[20px]"
                              style={{ backgroundColor: '#e5f3ff', color: secondaryColor }}
                            >
                              <span className="[font-family:'Urbanist',Helvetica] font-medium text-[13px]">
                                +{folder.trainers.length - 1}
                              </span>
                            </Badge>
                          </div>
                        ) : (
                          <Badge 
                            className="px-3 py-0.5 rounded-[20px]"
                            style={{ backgroundColor: '#e5f3ff', color: secondaryColor }}
                          >
                            <span className="[font-family:'Urbanist',Helvetica] font-medium text-[15px]">
                              {isFormation 
                                ? (folder.trainers?.[0]?.name || 'Nom De Formateur')
                                : (folder.creator?.name || 'Utilisateur')
                              }
                            </span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-center min-w-[140px]">
                        <Badge 
                          className="px-3 py-1 rounded-[35px]"
                          style={{ backgroundColor: '#eee0ff', color: '#8c2ffe' }}
                        >
                          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[15px]">
                            {folder.total_documents || 0} Fichiers
                          </span>
                        </Badge>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToFolder(folderId, isFormation ? folder.title : folder.name, folder.type);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <Eye className="w-5 h-5" style={{ color: secondaryColor }} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onFolderCreated={() => {
            loadHub();
            loadStatistics();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

