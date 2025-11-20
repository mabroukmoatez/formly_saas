import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { studentsService } from '../../services/Students';
import { StudentCourse } from '../../services/Students.types';
import { useToast } from '../../components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Loader2, GraduationCap, X, Calendar, TrendingUp } from 'lucide-react';

interface StudentSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export const StudentSessionsModal: React.FC<StudentSessionsModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchCourses();
    }
  }, [isOpen, studentId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await studentsService.getStudentCourses(studentId);
      if (response.success && response.data) {
        const coursesArray = response.data.courses || [];
        setCourses(Array.isArray(coursesArray) ? coursesArray : []);
      } else {
        setCourses([]);
      }
    } catch (err: any) {
      console.error('Error fetching student courses:', err);
      showError(t('common.error'), 'Impossible de charger les formations');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#10b981'; // green
    if (progress >= 50) return '#3b82f6'; // blue
    if (progress >= 25) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-3xl max-h-[80vh] overflow-hidden flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              <span>Formations de {studentName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 w-8 animate-spin" style={{ color: '#007aff' }} />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucune formation assignée
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Cet apprenant n'a pas encore de formation assignée.
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
                      
                      {/* Progress Bar */}
                      {course.progress_percentage !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Progression
                            </span>
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {course.progress_percentage}%
                            </span>
                          </div>
                          <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${course.progress_percentage}%`,
                                backgroundColor: getProgressColor(course.progress_percentage)
                              }}
                            />
                          </div>
                        </div>
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
                        
                        {course.is_completed !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              course.is_completed
                                ? isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                : isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {course.is_completed ? 'Terminée' : 'En cours'}
                            </span>
                          </div>
                        )}
                        
                        {course.duration && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>{course.duration} heure{course.duration !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {course.total_sessions !== undefined && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>
                              {course.completed_sessions || 0}/{course.total_sessions} session{course.total_sessions !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        {course.start_date && course.end_date && (
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(course.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {new Date(course.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
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
