import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  FolderOpen,
  Check,
  X
} from 'lucide-react';

interface Section {
  id: number;
  title: string;
  description?: string;
  order: number;
  is_published: boolean;
  isExpanded?: boolean;
  chapters?: any[];
}

interface SectionManagerProps {
  sections: Section[];
  onCreateSection: (data: { title: string; description?: string; order: number; is_published: boolean }) => Promise<void>;
  onUpdateSection: (sectionId: number, data: Partial<Section>) => Promise<void>;
  onDeleteSection: (sectionId: number) => Promise<void>;
  onToggleSection: (sectionId: number) => void;
  renderChapters: (sectionId: number) => React.ReactNode;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  onToggleSection,
  renderChapters
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [isCreating, setIsCreating] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      await onCreateSection({
        title: newSectionTitle.trim(),
        description: newSectionDesc.trim() || undefined,
        order: sections.length,
        is_published: true
      });
      setNewSectionTitle('');
      setNewSectionDesc('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleStartEdit = (section: Section) => {
    setEditingSection(section.id);
    setEditTitle(section.title);
    setEditDesc(section.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || editingSection === null) return;

    try {
      await onUpdateSection(editingSection, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined
      });
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditTitle('');
    setEditDesc('');
  };

  const handleTogglePublished = async (section: Section) => {
    try {
      await onUpdateSection(section.id, {
        is_published: !section.is_published
      });
    } catch (error) {
      console.error('Error toggling published:', error);
    }
  };

  const handleDelete = async (sectionId: number) => {
    if (!confirm('Supprimer ce block et tous ses chapitres ?')) return;
    
    try {
      await onDeleteSection(sectionId);
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Sections */}
      {sections.map((section, index) => (
        <Card key={section.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-0">
            {/* Section Header */}
            <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Drag Handle */}
              <GripVertical className={`w-5 h-5 cursor-grab ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />

              {/* Expand/Collapse */}
              <button
                onClick={() => onToggleSection(section.id)}
                className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
              >
                {section.isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <FolderOpen className="w-5 h-5" style={{ color: primaryColor }} />
              </div>

              {/* Title & Description */}
              {editingSection === section.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre du block"
                    className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    autoFocus
                  />
                  <Input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optionnel)"
                    className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Block {index + 1}: {section.title}
                  </h3>
                  {section.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {section.description}
                    </p>
                  )}
                </div>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={isDark ? 'text-gray-300 border-gray-600' : ''}>
                  {section.chapters?.length || 0} chapitre{(section.chapters?.length || 0) !== 1 ? 's' : ''}
                </Badge>
                <Badge 
                  className={section.is_published 
                    ? (isDark ? 'bg-green-900/20 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-300')
                    : (isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300')
                  }
                >
                  {section.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {editingSection === section.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-8 w-8">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8">
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublished(section)}
                      className="h-8 w-8"
                      title={section.is_published ? 'Dépublier' : 'Publier'}
                    >
                      {section.is_published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(section)}
                      className="h-8 w-8"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(section.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Section Content (Chapters) */}
            {section.isExpanded && (
              <div className={`p-4 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                {renderChapters(section.id)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Create New Section */}
      {isCreating ? (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2 border-dashed`}>
          <CardContent className="p-4 space-y-3">
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Titre de la section"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              autoFocus
            />
            <Input
              value={newSectionDesc}
              onChange={(e) => setNewSectionDesc(e.target.value)}
              placeholder="Description (optionnel)"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateSection}
                disabled={!newSectionTitle.trim()}
                style={{ backgroundColor: primaryColor }}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Créer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewSectionTitle('');
                  setNewSectionDesc('');
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsCreating(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un Block
        </Button>
      )}
    </div>
  );
};

