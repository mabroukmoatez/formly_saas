/**
 * SessionListView Component
 * Table view for sessions with selection and actions
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  Download,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  List
} from 'lucide-react';
import type { SessionData, SessionFilters } from './types';

interface SessionListViewProps {
  sessions: SessionData[];
  loading?: boolean;
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  onView: (uuid: string) => void;
  onEdit: (uuid: string) => void;
  onDelete: (uuids: string[]) => void;
  onCreateSession: () => void;
  onViewModeChange: (mode: 'table' | 'calendar') => void;
  viewMode: 'table' | 'calendar';
}

export const SessionListView: React.FC<SessionListViewProps> = ({
  sessions,
  loading,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  onCreateSession,
  onViewModeChange,
  viewMode
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(s => s.uuid));
    }
  };

  const handleSelectSession = (uuid: string) => {
    setSelectedSessions(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid)
        : [...prev, uuid]
    );
  };

  const getStatusBadge = (status: SessionData['status']) => {
    switch (status) {
      case 'à_venir':
        return <Badge className="bg-yellow-100 text-yellow-600 border-0">à venir</Badge>;
      case 'en_cours':
        return <Badge className="bg-green-100 text-green-600 border-0">en cours</Badge>;
      case 'terminée':
        return <Badge className="bg-blue-100 text-blue-600 border-0">terminée</Badge>;
    }
  };

  const getModeDot = (mode: SessionData['mode']) => {
    const colors: Record<string, string> = {
      'présentiel': '#22c55e',
      'distanciel': '#3b82f6',
      'e-learning': '#22c55e',
      'hybride': '#f97316'
    };
    return <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: colors[mode] || '#9ca3af' }} />;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Session
        </h1>
        <Button 
          className="h-10 gap-2 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={onCreateSession}
        >
          <Plus className="w-4 h-4" />
          Créer Une Nouvelle Session
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Recherche Une Formation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 h-10 rounded-xl w-80 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
          
          <div className="relative">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="w-4 h-4" />
              Filtre
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className={`absolute left-0 mt-2 w-72 rounded-xl shadow-lg border z-20 p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {/* Formation Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Formation</label>
                    <button className="text-xs text-blue-500">Reset</button>
                  </div>
                  <select className={`w-full h-9 rounded-lg border px-3 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option>Selectionner</option>
                  </select>
                </div>

                {/* Formateur Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Formateur</label>
                    <button className="text-xs text-blue-500">Reset</button>
                  </div>
                  <select className={`w-full h-9 rounded-lg border px-3 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option>Selectionner</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status</label>
                    <button className="text-xs text-blue-500">Reset</button>
                  </div>
                  <select 
                    className={`w-full h-9 rounded-lg border px-3 mb-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                    value={filters.status}
                    onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
                  >
                    <option value="all">ALL</option>
                    <option value="à venir">à venir</option>
                    <option value="en cours">en cours</option>
                    <option value="terminée">terminée</option>
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {['à venir', 'en cours', 'terminée'].map(status => (
                      <Badge 
                        key={status}
                        className={`cursor-pointer ${
                          filters.status === status 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        } border-0`}
                        onClick={() => onFiltersChange({ ...filters, status: status as any })}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Date Range */}
                  <div className="flex items-center gap-2 mt-3">
                    <Input 
                      type="date" 
                      className={`h-9 flex-1 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                      value={filters.startDate || ''}
                      onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                    />
                    <span className="text-gray-400">À</span>
                    <Input 
                      type="date" 
                      className={`h-9 flex-1 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                      value={filters.endDate || ''}
                      onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Type de Session Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Type De La Session</label>
                    <button className="text-xs text-blue-500">Reset</button>
                  </div>
                  <select 
                    className={`w-full h-9 rounded-lg border px-3 mb-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                    value={filters.type}
                    onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as any })}
                  >
                    <option value="all">Selectionner</option>
                    <option value="présentiel">Présentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="e-learning">E-Learning</option>
                    <option value="hybride">Hybride</option>
                  </select>
                  <div className="space-y-1">
                    {[
                      { value: 'distanciel', color: '#3b82f6', label: 'Distanciel' },
                      { value: 'présentiel', color: '#22c55e', label: 'Présentiel' },
                      { value: 'e-learning', color: '#eab308', label: 'E-Learning' },
                      { value: 'hybride', color: '#f97316', label: 'Hybride' }
                    ].map(type => (
                      <div key={type.value} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setShowFilterDropdown(false)}
                >
                  Appliquer les filtres
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedSessions.length > 0 && (
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => {
                onDelete(selectedSessions);
                setSelectedSessions([]);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </Button>
          )}
          
          <Button variant="outline" className="h-10 gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            className="h-10 gap-2 rounded-xl"
            onClick={() => onViewModeChange('calendar')}
            style={viewMode === 'calendar' ? { backgroundColor: primaryColor } : {}}
          >
            <Calendar className="w-4 h-4" />
            Vue Calendrier
          </Button>
          
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            className="h-10 gap-2 rounded-xl"
            onClick={() => onViewModeChange('table')}
            style={viewMode === 'table' ? { backgroundColor: primaryColor } : {}}
          >
            <List className="w-4 h-4" />
            Vue Liste
          </Button>
        </div>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: primaryColor }} />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Chargement des sessions...
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Calendar className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {searchQuery ? 'Aucune session trouvée' : 'Aucune session'}
          </h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchQuery 
              ? `Aucune session ne correspond à "${searchQuery}"`
              : 'Créez votre première session de formation pour commencer.'
            }
          </p>
          {!searchQuery && (
            <Button 
              className="h-10 gap-2 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={onCreateSession}
            >
              <Plus className="w-4 h-4" />
              Créer Une Nouvelle Session
            </Button>
          )}
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                <th className="px-4 py-3 text-left w-10">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={selectedSessions.length === sessions.length && sessions.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  intitulé de la Formation
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Type de session <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Status <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Fomateur <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date de début <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date de fin <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Nombre De Participants <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedSessions.includes(session.uuid)}
                      onChange={() => handleSelectSession(session.uuid)}
                    />
                  </td>
                  <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {session.title || session.courseTitle}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center">
                      {getModeDot(session.mode)}
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {session.trainers?.map(t => t.name).join(', ') || 'Formateur Nom'}
                    {session.trainers && session.trainers.length > 1 && (
                      <span className="text-blue-500 ml-1">+{session.trainers.length - 1}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {session.startDate}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {session.endDate}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {session.currentParticipants}/{session.maxParticipants}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8"
                        onClick={() => onView(session.uuid)}
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8"
                        onClick={() => onEdit(session.uuid)}
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8"
                        onClick={() => onDelete([session.uuid])}
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SessionListView;

