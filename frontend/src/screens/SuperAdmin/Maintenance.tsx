import React, { useState } from 'react';
import { Wrench, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService } from '../../services/superAdmin';

export const Maintenance: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [executing, setExecuting] = useState<string | null>(null);

  const maintenanceTasks = [
    { id: 'cache-clear', label: 'Clear Cache', description: 'Clear all system cache' },
    { id: 'config-cache', label: 'Cache Configuration', description: 'Cache configuration files' },
    { id: 'route-cache', label: 'Cache Routes', description: 'Cache application routes' },
    { id: 'view-cache', label: 'Cache Views', description: 'Cache view templates' },
    { id: 'backup', label: 'Create Backup', description: 'Create system backup' },
    { id: 'health', label: 'Health Check', description: 'Run system health check' },
  ];

  const handleExecuteTask = async (taskId: string) => {
    setExecuting(taskId);
    try {
      if (taskId === 'health') {
        const response = await superAdminService.getSystemHealth();
        if (response.success) {
          success('Succès', 'Health check completed successfully');
        }
      } else {
        const response = await superAdminService.executeMaintenanceTask(taskId);
        if (response.success) {
          success('Succès', response.message || 'Task executed successfully');
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Failed to execute task');
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-orange-500/10">
          <Wrench className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            System Maintenance
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            System utilities and maintenance tools
          </p>
        </div>
      </div>

      {/* Maintenance Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maintenanceTasks.map((task) => (
          <Card
            key={task.id}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <CardContent className="p-6">
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {task.label}
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleExecuteTask(task.id)}
                disabled={executing === task.id}
              >
                {executing === task.id ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Execute'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

