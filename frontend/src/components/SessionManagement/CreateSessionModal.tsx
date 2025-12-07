import React, { useState, useEffect } from 'react';
import { X, BookOpen, Search, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { courseCreation } from '../../services/courseCreation';
import { useNavigate } from 'react-router-dom';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
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
    price?: number | string;
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

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
    isOpen,
    onClose,
    onCreate,
}) => {
    const { isDark } = useTheme();
    const { organization } = useOrganization();
    const { navigateToRoute } = useSubdomainNavigation();
    const primaryColor = organization?.primary_color || '#007aff';
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Load courses when modal opens
    useEffect(() => {
        const loadCourses = async () => {
            if (!isOpen) return;
            
            try {
                setIsLoading(true);
                const response = await courseCreation.getCourses({ per_page: 100 });
                
                if (response.success && response.data) {
                    let courseList: Course[] = [];
                    
                    if (response.data.courses?.data) {
                        courseList = response.data.courses.data;
                    } else if (Array.isArray(response.data.courses)) {
                        courseList = response.data.courses;
                    } else if (Array.isArray(response.data.data)) {
                        courseList = response.data.data;
                    } else if (Array.isArray(response.data)) {
                        courseList = response.data;
                    }
                    
                    setCourses(courseList);
                    setFilteredCourses(courseList);
                }
            } catch (error) {
                console.error('Error loading courses:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCourses();
    }, [isOpen]);

    // Filter courses by search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCourses(courses);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredCourses(courses.filter(course =>
                course.title?.toLowerCase().includes(query) ||
                course.category?.name?.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, courses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedCourse) {
            alert('Veuillez sélectionner une formation');
            return;
        }
        
        if (!startDate || !endDate) {
            alert('Veuillez entrer les dates de début et de fin');
            return;
        }

        // Navigate to session creation with course and dates
        const params = new URLSearchParams({
            courseUuid: selectedCourse.uuid,
            startDate: startDate,
            endDate: endDate
        });
        
        navigateToRoute(`/session-creation?${params.toString()}`);
        onClose();
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
            <DialogContent className={`sm:max-w-[500px] p-0 overflow-hidden border-0 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Créer Une Nouvelle Session
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Course Selection */}
                        <div>
                            <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Sélectionner une formation *
                            </Label>
                            
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                <Input
                                    placeholder="Rechercher une formation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                                />
                            </div>

                            {/* Course List */}
                            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                                    </div>
                                ) : filteredCourses.length === 0 ? (
                                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>Aucune formation trouvée</p>
                                    </div>
                                ) : (
                                    filteredCourses.map((course) => {
                                        const isSelected = selectedCourse?.uuid === course.uuid;
                                        const imageUrl = course.image_url || course.intro_image_url || (course.image ? `http://localhost:8000/storage/${course.image}` : null);
                                        
                                        return (
                                            <div
                                                key={course.uuid}
                                                onClick={() => setSelectedCourse(course)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50/50'
                                                        : isDark
                                                            ? 'border-transparent bg-gray-700/50 hover:bg-gray-700'
                                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                {/* Course Image */}
                                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                                    {imageUrl ? (
                                                        <img
                                                            src={fixImageUrl(imageUrl)}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                                            <BookOpen className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Course Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-medium text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {course.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {course.duration_days && (
                                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {course.duration_days} jour{course.duration_days > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {course.category && (
                                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                • {course.category.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1">
                                                        {getStatusBadge(course)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Date Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <Label className="text-blue-500 font-medium mb-2 block flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Date Debut *
                                </Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="border-0 bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0"
                                />
                            </div>

                            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <Label className="text-blue-500 font-medium mb-2 block flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Date Fin *
                                </Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                    min={startDate}
                                    className="border-0 bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Precedent
                            </Button>
                            <Button
                                type="submit"
                                disabled={!selectedCourse || !startDate || !endDate}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Creer La Session
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
