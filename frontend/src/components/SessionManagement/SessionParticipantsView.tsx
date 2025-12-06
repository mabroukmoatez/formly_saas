/**
 * SessionParticipantsView Component
 * Displays participants and trainers with toggle switch and actions
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
  Trash2,
  Award,
  AlertTriangle
} from 'lucide-react';
import type { SessionParticipant, SessionTrainer, SessionData, ParticipantStats } from './types';

interface SessionParticipantsViewProps {
  session: SessionData;
  participants: SessionParticipant[];
  trainers: SessionTrainer[];
  onViewParticipant?: (uuid: string) => void;
  onDeleteParticipant?: (uuid: string) => void;
  onSendCertificate?: (uuids: string[]) => void;
  onMarkFailed?: (uuids: string[]) => void;
}

export const SessionParticipantsView: React.FC<SessionParticipantsViewProps> = ({
  session,
  participants,
  trainers,
  onViewParticipant,
  onDeleteParticipant,
  onSendCertificate,
  onMarkFailed
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  const [viewType, setViewType] = useState<'apprenant' | 'formateur'>('apprenant');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock stats for header
  const stats: ParticipantStats = {
    evaluationsRepondus: 25,
    tauxRecommandation: 50,
    tauxRpanseQuestion: 76,
    tauxReussite: 0,
    tauxSatisfaction: 70,
    dureeMoyenneConnexion: '178min',
    tauxAssiduite: 60
  };

  const handleSelectAll = () => {
    if (viewType === 'apprenant') {
      if (selectedItems.length === participants.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(participants.map(p => p.uuid));
      }
    } else {
      if (selectedItems.length === trainers.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(trainers.map(t => t.uuid));
      }
    }
  };

  const handleSelectItem = (uuid: string) => {
    setSelectedItems(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid)
        : [...prev, uuid]
    );
  };

  const getSuccessStatusBadge = (status: SessionParticipant['successStatus']) => {
    if (!status || status === 'en_cours') return <span className="text-gray-400">-</span>;
    if (status === 'réussi') return <Badge className="bg-green-100 text-green-600 border-0">Réussi</Badge>;
    if (status === 'échoué') return <Badge className="bg-red-100 text-red-600 border-0">Échoué</Badge>;
    return <span className="text-gray-400">-</span>;
  };

  const filteredParticipants = participants.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query)) ||
      (p.company && p.company.toLowerCase().includes(query)) ||
      (p.companyName && p.companyName.toLowerCase().includes(query))
    );
  });

  const filteredTrainers = trainers.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(query)) ||
      (t.email && t.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      {/* Header with Stats */}
      <div className="text-center py-6 px-6">
        {/* Session title - shows override if set */}
        <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
          {session.title}
        </h1>
        
        {/* Show course title if different (session has custom title) */}
        {session.title !== session.courseTitle && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Cours : {session.courseTitle}
            </span>
            <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
              Titre personnalisé
            </Badge>
          </div>
        )}
        
        {/* Reference code if available */}
        {session.referenceCode && (
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Réf: {session.referenceCode}
          </p>
        )}
        
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Session :</span>
          <Badge className={`border-0 rounded-full px-3 ${
            session.status === 'terminée' ? 'bg-gray-100 text-gray-600' :
            session.status === 'en_cours' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
            'bg-blue-100 text-blue-600'
          }`}>
            {session.status === 'terminée' ? 'Terminée' : 
             session.status === 'en_cours' ? 'En-cours' : 'À venir'}
          </Badge>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📅 {session.startDate} - 📅 {session.endDate}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Modalités :</span>
          <Badge className="bg-[#e8f5e9] text-[#2e7d32] border-0 rounded-full px-3">🌐 {session.mode}</Badge>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Stats cards similar to dashboard but simplified */}
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600">👥</span>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Nombres D'apprenants</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: primaryColor }}>{stats.evaluationsRepondus}</div>
          </div>
          
          {/* More stat cards... */}
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600">⭐</span>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Taux De Recommandation</span>
            </div>
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="#fff3e0" strokeWidth="8" fill="none" />
                  <circle 
                    cx="40" cy="40" r="36" 
                    stroke="#ff9800" strokeWidth="8" fill="none"
                    strokeDasharray={`${stats.tauxRecommandation * 2.26} 226`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-orange-500">
                  {stats.tauxRecommandation}%
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600">⏱️</span>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Durée Moyenne De Connexion</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{stats.dureeMoyenneConnexion}</div>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600">👍</span>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Taux D'assiduité</span>
            </div>
            <div className="text-3xl font-bold text-center" style={{ color: primaryColor }}>{stats.tauxAssiduite}%</div>
          </div>
        </div>

        {/* Search, Filters, Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Recherche Apprenants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 h-10 rounded-xl w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-10 gap-2 rounded-xl"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="w-4 h-4" />
              Filtre
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Action buttons for selected items */}
            {selectedItems.length > 0 && viewType === 'apprenant' && (
              <>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => onMarkFailed?.(selectedItems)}
                >
                  Échoué
                </Button>
                <Button
                  className="h-10 gap-2 rounded-xl"
                  style={{ backgroundColor: '#22c55e' }}
                  onClick={() => onSendCertificate?.(selectedItems)}
                >
                  <Award className="w-4 h-4" />
                  Envoyer Certificate De Réussi
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => {/* bulk delete */}}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </>
            )}
            
            {/* Toggle Switch */}
            <div className={`flex items-center gap-2 rounded-full p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <span className={`text-sm px-3 ${viewType === 'apprenant' ? 'font-medium' : 'text-gray-500'}`}>
                Apprenant
              </span>
              <button
                onClick={() => setViewType(viewType === 'apprenant' ? 'formateur' : 'apprenant')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  viewType === 'formateur' ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    viewType === 'formateur' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm px-3 ${viewType === 'formateur' ? 'font-medium' : 'text-gray-500'}`}>
                Formateur
              </span>
            </div>

            <Button variant="outline" className="h-10 gap-2 rounded-xl">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                <th className="px-4 py-3 text-left w-10">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={viewType === 'apprenant' 
                      ? selectedItems.length === participants.length && participants.length > 0
                      : selectedItems.length === trainers.length && trainers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Nom & Prénom
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Email
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Téléphone
                </th>
                {viewType === 'apprenant' ? (
                  <>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {viewType === 'apprenant' ? 'Formations Attribuées' : 'Tarif De La Formation'}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Entreprise Affiliée
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Statut De Réussite
                    </th>
                  </>
                ) : (
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Tarif De La Formation
                  </th>
                )}
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date D'inscription <ChevronDown className="w-4 h-4 inline ml-1" />
                </th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {viewType === 'apprenant' ? (
                filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
                  <tr key={participant.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedItems.includes(participant.uuid)}
                        onChange={() => handleSelectItem(participant.uuid)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {participant.name.charAt(0)}
                          </div>
                        )}
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {participant.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-500 text-sm">{participant.email}</td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {participant.phone || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-100 text-green-600 border-0">
                        {participant.price ? `${participant.price} €` : '1000 €'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {participant.company || participant.companyName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getSuccessStatusBadge(participant.successStatus)}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {participant.enrollmentDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => onViewParticipant?.(participant.uuid)}
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => onDeleteParticipant?.(participant.uuid)}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={viewType === 'apprenant' ? 9 : 6} className="p-8 text-center text-gray-500">
                      {searchQuery ? `Aucun résultat pour "${searchQuery}"` : `Aucun ${viewType === 'apprenant' ? 'participant' : 'formateur'} inscrit`}
                    </td>
                  </tr>
                )
              ) : (
                filteredTrainers.length > 0 ? (
                  filteredTrainers.map((trainer) => (
                  <tr key={trainer.uuid} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedItems.includes(trainer.uuid)}
                        onChange={() => handleSelectItem(trainer.uuid)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {trainer.avatar ? (
                          <img src={trainer.avatar} alt={trainer.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {trainer.name.charAt(0)}
                          </div>
                        )}
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {trainer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-500 text-sm">{trainer.email}</td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {trainer.phone || '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {trainer.date || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => onViewParticipant?.(trainer.uuid)}
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun formateur assigné'}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionParticipantsView;

