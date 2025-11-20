import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { studentDashboardService, StudentStatistics, CourseProgress } from '../../services/studentDashboard';
import {
  BarChart3,
  BookOpen,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export const StudentDashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [statistics, setStatistics] = useState<StudentStatistics>({
    active_courses: 0,
    completed_courses: 0,
    hours_learned: 0,
    average_score: 0,
  });
  const [recentCourses, setRecentCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics
        const statsResponse = await studentDashboardService.getStatistics();
        if (statsResponse.success) {
          setStatistics(statsResponse.data);
        }

        // Fetch recent courses
        const coursesResponse = await studentDashboardService.getRecentCourses({ per_page: 6 });
        if (coursesResponse.success) {
          setRecentCourses(coursesResponse.data.enrollments);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      id: 1,
      label: t('student.dashboard.activeCourses') || 'Cours actifs',
      value: statistics.active_courses.toString(),
      icon: BookOpen,
      color: 'blue',
    },
    {
      id: 2,
      label: t('student.dashboard.hoursLearned') || 'Heures d\'apprentissage',
      value: `${statistics.hours_learned}h`,
      icon: Clock,
      color: 'green',
    },
    {
      id: 3,
      label: t('student.dashboard.completedCourses') || 'Cours terminés',
      value: statistics.completed_courses.toString(),
      icon: TrendingUp,
      color: 'purple',
    },
    {
      id: 4,
      label: t('student.dashboard.averageScore') || 'Score moyen',
      value: `${statistics.average_score}%`,
      icon: BarChart3,
      color: 'orange',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600',
      green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600',
      purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600',
      orange: isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-full p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg p-6 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
            <p className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('student.dashboard.welcome') || 'Bienvenue'}, {user?.name || user?.first_name || 'Étudiant'}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('student.dashboard.subtitle') || 'Voici un aperçu de votre parcours d\'apprentissage'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className={`rounded-lg p-6 border transition-all duration-200 hover:shadow-lg ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* My Courses Section */}
        <div
          className={`rounded-lg p-6 border ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('student.dashboard.myCourses') || 'Mes Cours'}
          </h2>
          {recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {enrollment.course.image && (
                    <img
                      src={enrollment.course.image}
                      alt={enrollment.course.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {enrollment.course.title}
                  </h3>
                  <div className="mb-2">
                    <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('student.dashboard.progress') || 'Progression'}: {enrollment.progress}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('student.dashboard.noCoursesYet') || 'Aucun cours inscrit pour le moment'}
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('student.dashboard.exploreCatalogue') || 'Explorez le catalogue pour commencer votre apprentissage'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
