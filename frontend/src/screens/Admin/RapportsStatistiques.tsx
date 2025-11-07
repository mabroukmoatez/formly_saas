import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Award, 
  Star, 
  Download,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';

// Composant pour les cartes de statistiques principales
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  isDark: boolean;
}> = ({ title, value, subtitle, icon, trend, color, isDark }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      trend: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      trend: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
      trend: 'text-orange-600'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      trend: 'text-purple-600'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      trend: 'text-red-600'
    }
  };

  return (
    <Card className={`border-2 rounded-[18px] hover:shadow-lg transition-all duration-300 ${
      isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-[#e2e2ea] bg-white hover:border-[#007aff]/20'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-[#6a90b9]'
            }`}>
              {title}
            </p>
            <p className={`[font-family:'Poppins',Helvetica] text-3xl font-bold mt-2 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {value}
            </p>
            {subtitle && (
              <p className={`[font-family:'Poppins',Helvetica] text-xs mt-1 ${
                isDark ? 'text-gray-500' : 'text-[#6a90b9]/70'
              }`}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 ${colorClasses[color].trend}`}>
                <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} />
                <span className="text-xs font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`h-14 w-14 rounded-full ${colorClasses[color].bg} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les métriques secondaires
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  progress?: number;
  color: string;
  isDark: boolean;
}> = ({ title, value, subtitle, icon, progress, color, isDark }) => {
  return (
    <Card className={`border-2 rounded-[18px] ${
      isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className={`[font-family:'Poppins',Helvetica] text-sm font-medium ${
            isDark ? 'text-gray-400' : 'text-[#6a90b9]'
          }`}>
            {title}
          </p>
          <div className="text-gray-500">
            {icon}
          </div>
        </div>
        <p className={`[font-family:'Poppins',Helvetica] text-2xl font-bold ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          {value}
        </p>
        {progress !== undefined && (
          <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {subtitle && (
          <p className={`[font-family:'Poppins',Helvetica] text-xs mt-2 ${
            isDark ? 'text-gray-500' : 'text-[#6a90b9]/70'
          }`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Composant pour les listes de classements
const RankingCard: React.FC<{
  title: string;
  items: Array<{
    id: string;
    name: string;
    value: string | number;
    subtitle?: string;
    rating?: number;
  }>;
  isDark: boolean;
}> = ({ title, items, isDark }) => {
  return (
    <Card className={`border-2 rounded-[18px] ${
      isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
    }`}>
      <CardHeader>
        <CardTitle className={`[font-family:'Poppins',Helvetica] font-semibold text-xl ${
          isDark ? 'text-white' : 'text-[#19294a]'
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-[12px] ${
                isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-[#f7f9fc] hover:bg-[#f0f4f8]'
              } transition-all duration-200 hover:shadow-md`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className={`[font-family:'Poppins',Helvetica] font-semibold ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  {item.name}
                </h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`[font-family:'Poppins',Helvetica] text-sm ${
                    isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                  }`}>
                    {item.value}
                  </span>
                  {item.subtitle && (
                    <span className={`[font-family:'Poppins',Helvetica] text-sm ${
                      isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                    }`}>
                      {item.subtitle}
                    </span>
                  )}
                  {item.rating && (
                    <span className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {item.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const RapportsStatistiques = (): JSX.Element => {
  const { stats, loading, error, refetch } = useAdminDashboard('month');
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period);
    refetch(period);
  };

  const handleExport = () => {
    console.log('Export report');
    // TODO: Implement export functionality
  };

  const handleRefresh = () => {
    refetch(selectedPeriod);
  };

  // Données mockées pour les tests
  const mockStats = {
    courses: {
      active: 24,
      total: 45,
      trend: 12
    },
    users: {
      active_students: 1247,
      new_students_this_period: 89,
      trend: 8
    },
    sessions: {
      ongoing: 12,
      upcoming: 8,
      trend: -5
    },
    revenue: {
      total: 45680,
      completed: 38240,
      trend: 15
    },
    connections: {
      connection_rate: 87,
      total: 15420
    },
    certificates: {
      issued: 234,
      completion_rate: 78
    },
    satisfaction: {
      average_rating: 4.6,
      total_reviews: 892
    },
    top_courses: [
      { id: '1', title: 'Formation React Avancé', enrollments: 156, revenue: 12400, satisfaction: 4.8 },
      { id: '2', title: 'JavaScript ES6+', enrollments: 134, revenue: 10800, satisfaction: 4.7 },
      { id: '3', title: 'TypeScript Fundamentals', enrollments: 98, revenue: 8900, satisfaction: 4.6 }
    ],
    top_instructors: [
      { id: '1', name: 'Marie Dubois', courses_count: 8, students_count: 456, average_rating: 4.9 },
      { id: '2', name: 'Jean Martin', courses_count: 6, students_count: 389, average_rating: 4.8 },
      { id: '3', name: 'Sophie Laurent', courses_count: 5, students_count: 312, average_rating: 4.7 }
    ]
  };

  const currentStats = stats || mockStats;

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 rounded-[18px] ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${
                isDark ? 'text-gray-400' : 'text-[#6a90b9]'
              }`}>
                Chargement des statistiques...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 rounded-[18px] ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className={`[font-family:'Poppins',Helvetica] text-red-500`}>
                Erreur: {error}
              </p>
              <Button onClick={handleRefresh} variant="outline" className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
      </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header avec sélecteurs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${organization?.primary_color || '#007aff'}15` }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: organization?.primary_color || '#007aff' }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Rapports & Statistiques
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Analyse des performances de {organization?.organization_name || 'votre organisation'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sélecteur de période */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('week')}
              className={`[font-family:'Poppins',Helvetica] ${
                selectedPeriod === 'week' 
                  ? 'bg-[#007aff] text-white hover:bg-[#007aff]/90' 
                  : ''
              }`}
            >
              Semaine
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('month')}
              className={`[font-family:'Poppins',Helvetica] ${
                selectedPeriod === 'month' 
                  ? 'bg-[#007aff] text-white hover:bg-[#007aff]/90' 
                  : ''
              }`}
            >
              Mois
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('year')}
              className={`[font-family:'Poppins',Helvetica] ${
                selectedPeriod === 'year' 
                  ? 'bg-[#007aff] text-white hover:bg-[#007aff]/90' 
                  : ''
              }`}
            >
              Année
            </Button>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Formations actives"
          value={currentStats.courses.active}
          subtitle={`sur ${currentStats.courses.total} total`}
          icon={<BookOpen className="h-6 w-6" />}
          trend={{ value: currentStats.courses.trend, isPositive: true }}
          color="blue"
          isDark={isDark}
        />
        
        <StatCard
          title="Apprenants actifs"
          value={currentStats.users.active_students.toLocaleString()}
          subtitle={`+${currentStats.users.new_students_this_period} cette période`}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: currentStats.users.trend, isPositive: true }}
          color="green"
          isDark={isDark}
        />
        
        <StatCard
          title="Sessions en cours"
          value={currentStats.sessions.ongoing}
          subtitle={`${currentStats.sessions.upcoming} à venir`}
          icon={<Clock className="h-6 w-6" />}
          trend={{ value: Math.abs(currentStats.sessions.trend), isPositive: false }}
          color="orange"
          isDark={isDark}
        />
        
        <StatCard
          title="CA généré"
          value={`${currentStats.revenue.total.toLocaleString()} €`}
          subtitle={`${currentStats.revenue.completed.toLocaleString()} € complété`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: currentStats.revenue.trend, isPositive: true }}
          color="purple"
          isDark={isDark}
        />
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Taux de connexion"
          value={`${currentStats.connections.connection_rate}%`}
          subtitle={`${currentStats.connections.total.toLocaleString()} connexions totales`}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          progress={currentStats.connections.connection_rate}
          color="from-green-400 to-green-600"
          isDark={isDark}
        />
        
        <MetricCard
          title="Certificats émis"
          value={currentStats.certificates.issued}
          subtitle={`Taux de complétion: ${currentStats.certificates.completion_rate}%`}
          icon={<Award className="h-4 w-4 text-yellow-600" />}
          color="from-yellow-400 to-yellow-600"
          isDark={isDark}
        />
        
        <MetricCard
          title="Satisfaction moyenne"
          value={`${currentStats.satisfaction.average_rating}/5`}
          subtitle={`${currentStats.satisfaction.total_reviews} avis`}
          icon={<Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />}
          progress={currentStats.satisfaction.average_rating * 20}
          color="from-yellow-400 to-yellow-600"
          isDark={isDark}
        />
      </div>

      {/* Classements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingCard
          title="Formations les plus populaires"
          items={currentStats.top_courses.map(course => ({
            id: course.id,
            name: course.title,
            value: `${course.enrollments} inscrits`,
            subtitle: `${course.revenue.toLocaleString()} €`,
            rating: course.satisfaction
          }))}
          isDark={isDark}
        />
        
        <RankingCard
          title="Formateurs les plus actifs"
          items={currentStats.top_instructors.map(instructor => ({
            id: instructor.id,
            name: instructor.name,
            value: `${instructor.courses_count} formations`,
            subtitle: `${instructor.students_count} apprenants`,
            rating: instructor.average_rating
          }))}
          isDark={isDark}
        />
      </div>
    </div>
  );
};
