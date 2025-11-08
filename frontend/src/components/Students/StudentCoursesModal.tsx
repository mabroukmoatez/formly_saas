import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { studentsService } from '../../services/Students';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export const StudentCoursesModal: React.FC<StudentCoursesModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen, studentId]);

  const loadCourses = async () => {
    try {
      const response = await studentsService.getCourses(studentId);
      setCourses(response.data.courses || []);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className={`w-[800px] max-h-[80vh] overflow-hidden rounded-xl ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {t('students.trainings.viewTrainings')} {studentName}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {courses.length === 0 ? (
            <p className="text-center text-gray-500">{t('students.trainings.noTrainings')}</p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.uuid} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {course.start_date} - {course.end_date}
                        </span>
                        <span>
                          {t('students.trainings.sessions')}: {course.completed_sessions}/{course.total_sessions}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{t('students.trainings.progress')}</span>
                          <span className="text-sm font-semibold">
                            {course.progress_percentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${course.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {course.is_completed ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            {t('students.trainings.completed')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                            {t('students.trainings.inProgress')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};