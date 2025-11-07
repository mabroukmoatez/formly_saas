import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { DashboardLayout } from '../../components/CommercialDashboard';

export const GestionDesQuizz: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <DashboardLayout>
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestion Des Quizz
          </h1>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Créer un Quiz
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Quiz Python - Bases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Questions:</strong> 15</p>
                <p><strong>Durée:</strong> 30 minutes</p>
                <p><strong>Difficulté:</strong> Débutant</p>
                <p><strong>Participants:</strong> 45</p>
                <p><strong>Score Moyen:</strong> 78%</p>
                <p><strong>Statut:</strong> <span className="text-green-500">Actif</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Quiz React - Hooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Questions:</strong> 20</p>
                <p><strong>Durée:</strong> 45 minutes</p>
                <p><strong>Difficulté:</strong> Intermédiaire</p>
                <p><strong>Participants:</strong> 32</p>
                <p><strong>Score Moyen:</strong> 65%</p>
                <p><strong>Statut:</strong> <span className="text-blue-500">En cours</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Quiz JavaScript - ES6+
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Questions:</strong> 25</p>
                <p><strong>Durée:</strong> 60 minutes</p>
                <p><strong>Difficulté:</strong> Avancé</p>
                <p><strong>Participants:</strong> 28</p>
                <p><strong>Score Moyen:</strong> 72%</p>
                <p><strong>Statut:</strong> <span className="text-orange-500">Brouillon</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};
