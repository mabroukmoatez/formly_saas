import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { trainersService } from '../../services/trainers';
import { TrainerCourse } from '../../services/trainers.types';
import { useToast } from '../../components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Loader2, BookOpen, X, Calendar, Users } from 'lucide-react';

interface TrainerCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerId: string;
  trainerName: string;
}

export const TrainerCoursesModal: React.FC<TrainerCoursesModalProps> = ({
  isOpen,
  onClose,
  trainerId,
  trainerName,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && trainerId) {
      fetchCourses();
    }
  }, [isOpen, trainerId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await trainersService.getTrainerCourses(trainerId);
      if (response.success && response.data) {
        // La réponse a la structure: { success: true, data: { courses: [...], total_courses: 1 } }
        const coursesArray = response.data.courses || [];
        setCourses(Array.isArray(coursesArray) ? coursesArray : []);
      } else {
        setCourses([]);
      }
    } catch (err: any) {
      console.error('Error fetching trainer courses:', err);
      showError(t('common.error'), 'Impossible de charger les cours');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-3xl max-h-[80vh] overflow-hidden flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Formations de {trainerName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#007aff' }} />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucune formation associée
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Ce formateur n'a pas encore de formation assignée.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.uuid}
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <div className="flex items-start gap-4">
                    {course.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={course.image_url}
                          alt={course.title}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            // En cas d'erreur de chargement, masquer l'image
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {course.title}
                      </h3>
                      {course.description && (
                        <p 
                          className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}
                          dangerouslySetInnerHTML={{ 
                            __html: course.description.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')
                          }}
                        />
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        {course.category && (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              isDark ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {course.category}
                            </span>
                          </div>
                        )}
                        {course.status !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              (course.status === 1 || course.status === 'published' || course.status === 'active')
                                ? isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {course.status === 1 ? 'Publié' : course.status === 0 ? 'Brouillon' : String(course.status)}
                            </span>
                          </div>
                        )}
                        {course.duration && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>{course.duration} heure{course.duration !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {course.price && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="font-medium">{course.price === '0.00' ? 'Gratuit' : `${course.price} €`}</span>
                          </div>
                        )}
                        {course.total_sessions !== undefined && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>{course.total_sessions} session{course.total_sessions !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {course.total_students !== undefined && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Users className="w-4 h-4" />
                            <span>{course.total_students} apprenant{course.total_students !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className={isDark ? 'border-gray-600 hover:bg-gray-700' : ''}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

