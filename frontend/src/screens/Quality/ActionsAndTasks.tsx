import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Loader2, Plus, Edit, Trash2, MoreVertical, Search, ChevronDown, Paperclip, User, Copy, CheckSquare, Square, MessageSquare, Image, FileText, File, Download, Calendar, Clock } from 'lucide-react';
import { useQualityTaskCategories } from '../../hooks/useQualityTaskCategories';
import { useQualityTasks } from '../../hooks/useQualityTasks';
import { CreateTaskCategoryModal, RenameTaskCategoryModal, AddTaskModal } from '../../components/QualityDashboard';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { useToast } from '../../components/ui/toast';
import { deleteTaskCategory, QualityTaskCategory, QualityTask, deleteQualityTask, updateQualityTask, updateTaskPositions, createQualityTask } from '../../services/qualityManagement';
import { apiService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CheckSquare2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { formatDate } from '../../utils/dateFormatter';
import { Badge } from '../../components/ui/badge';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Column Component (Category as Trello List)
interface ColumnProps {
  category: QualityTaskCategory;
  tasks: QualityTask[];
  isDark: boolean;
  onAddTask: (categoryId: number) => void;
  onEditTask: (task: QualityTask) => void;
  onDeleteTask: (taskId: number) => void;
  onToggleStatus: (task: QualityTask) => void;
  onCopyTask: (task: QualityTask) => void;
  onViewTask: (task: QualityTask) => void;
  onRenameCategory: (category: QualityTaskCategory) => void;
  onDeleteCategory: (category: QualityTaskCategory) => void;
  deletingCategory: boolean;
  recentDragEnd: boolean;
}

const Column: React.FC<ColumnProps> = ({
  category,
  tasks,
  isDark,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  onCopyTask,
  onViewTask,
  onRenameCategory,
  onDeleteCategory,
  deletingCategory,
  recentDragEnd,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-red-500'; // Rouge selon documentation ligne 198
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-orange-500'; // Orange selon documentation ligne 175
      default:
        return 'bg-gray-400';
    }
  };

  // Fonction pour obtenir la couleur de fond - utilise la couleur de la catégorie si disponible
  const getCategoryBackgroundColor = (category: QualityTaskCategory): string => {
    // Priorité 1 : Utiliser la couleur définie dans la catégorie
    if (category.color && category.color.trim() !== '') {
      return category.color;
    }
    
    // Fallback : Couleur par défaut Trello
    return isDark ? '#1F2937' : '#EBECF0';
  };

  // Fonction pour obtenir la couleur du bouton selon le nom de la catégorie
  const getCategoryButtonColor = (categoryName: string): string => {
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('formation professionnelle')) {
      return 'text-blue-600 hover:text-blue-700'; // Bleu
    } else if (nameLower.includes('métiers') || nameLower.includes('emplois')) {
      return 'text-orange-600 hover:text-orange-700'; // Orange
    } else if (nameLower.includes('innovations') || nameLower.includes('pédagogiques')) {
      return 'text-green-600 hover:text-green-700'; // Vert
    } else if (nameLower.includes('handicap')) {
      return 'text-purple-600 hover:text-purple-700'; // Violet
    }
    return isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700';
  };

  const backgroundColor = getCategoryBackgroundColor(category);
  const buttonColor = getCategoryButtonColor(category.name);

  return (
    <div
      ref={setNodeRef}
      style={{ 
        ...style, 
        backgroundColor: isDark ? '#1F2937' : backgroundColor || '#EBECF0',
        minHeight: 'fit-content'
      }}
      className="flex-shrink-0 w-[272px] rounded-lg p-3"
    >
      {/* Column Header - Style Trello */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: category.color || '#3f5ea9' }}
          />
          <h3 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
            {category.name}
          </h3>
          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {tasks.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}>
            <DropdownMenuItem
              onClick={() => onRenameCategory(category)}
              className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            >
              <Edit className="mr-2 h-4 w-4" /> Renommer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteCategory(category)}
              disabled={deletingCategory}
              className={`text-red-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
            >
              {deletingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Container - Style Trello */}
      <SortableContext items={tasks.map(t => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[50px] transition-all duration-200">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDark={isDark}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleStatus={onToggleStatus}
              onCopy={onCopyTask}
              onView={onViewTask}
              getPriorityColor={getPriorityColor}
              recentDragEnd={recentDragEnd}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card Button - Style Trello */}
      <Button
        variant="ghost"
        className={`w-full mt-2 justify-start text-sm ${buttonColor} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/50'} transition-colors`}
        onClick={() => onAddTask(category.id)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une carte
      </Button>
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: QualityTask;
  isDark: boolean;
  onEdit: (task: QualityTask) => void;
  onDelete: (taskId: number) => void;
  onToggleStatus: (task: QualityTask) => void;
  onCopy: (task: QualityTask) => void;
  onView: (task: QualityTask) => void;
  getPriorityColor: (priority: string) => string;
  recentDragEnd?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDark,
  onEdit,
  onDelete,
  onToggleStatus,
  onCopy,
  onView,
  getPriorityColor,
  recentDragEnd = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform) + (isDragging ? ' scale(0.95)' : ''),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'High'; // Texte "High" selon documentation ligne 179
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Low'; // Texte "Low" selon documentation ligne 175
      default:
        return priority;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const assignedMembers = task.assigned_members || [];
  const attachments = task.attachments || [];
  const attachmentsCount = Array.isArray(attachments) ? attachments.length : 0;
  const comments = task.comments || [];
  const commentsCount = Array.isArray(comments) ? comments.length : 0;
  const checklist = task.checklist || [];
  const checklistCount = Array.isArray(checklist) ? checklist.length : 0;
  const completedChecklistItems = checklist.filter(item => item.completed).length;
  const checklistProgress = checklistCount > 0 ? Math.round((completedChecklistItems / checklistCount) * 100) : 0;

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileType?: string, fileName?: string) => {
    if (!fileType && !fileName) return File;
    
    const type = (fileType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return Image;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return FileText;
    }
    if (type.includes('word') || name.match(/\.(doc|docx)$/i)) {
      return FileText;
    }
    if (type.includes('excel') || name.match(/\.(xls|xlsx)$/i)) {
      return FileText;
    }
    return File;
  };

  // Fonction pour vérifier si un fichier est une image
  const isImageFile = (fileType?: string, fileName?: string) => {
    const type = (fileType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    return type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  };

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`group relative p-3 rounded-md ${
        isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
      } shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 ${
        isDragging ? 'shadow-lg scale-95' : ''
      }`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Ne pas ouvrir la modal si on clique sur le menu ou les boutons
        if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
          return;
        }
        // Ne pas ouvrir si on vient de faire un drag
        if (recentDragEnd || isDragging) {
          return;
        }
        // Ouvrir la modal seulement si c'est un vrai clic
        onView(task);
      }}
    >
      {/* Menu contextuel Trello-style */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-30" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            >
              <Edit className="mr-2 h-4 w-4" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopy(task);
              }}
              className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            >
              <Copy className="mr-2 h-4 w-4" /> Copier la carte
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(task);
              }}
              className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            >
              {task.status === 'done' ? (
                <>
                  <Square className="mr-2 h-4 w-4" /> Marquer comme non terminée
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" /> Marquer comme terminée
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className={`text-red-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatars des membres assignés À GAUCHE (style Trello) */}
      {assignedMembers.length > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap relative z-20">
          {assignedMembers.slice(0, 5).map((member, index) => (
            <div
              key={member.id}
              className="flex items-center relative z-10"
              title={member.name}
              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:z-20 transition-transform hover:scale-110"
                  style={{ zIndex: 10 + index }}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-md hover:z-20 transition-transform hover:scale-110 ${
                  isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}
                style={{ zIndex: 10 + index }}>
                  {getInitials(member.name)}
                </div>
              )}
            </div>
          ))}
          {assignedMembers.length > 5 && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-md relative z-10 ${
              isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'
            }`}
            style={{ marginLeft: '-8px' }}>
              +{assignedMembers.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Badge de priorité (style Trello) */}
      {task.priority && (
        <div className="flex items-center gap-1.5 mb-2 relative z-20">
          <div className={`w-3 h-3 rounded-sm ${getPriorityColor(task.priority)}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} [font-family:'Inter',Helvetica]`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      )}

      {/* Titre de la carte */}
      <h4 className={`font-semibold text-sm mb-1.5 leading-snug relative z-20 ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className={`text-xs mb-2 line-clamp-3 leading-relaxed relative z-20 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Inter',Helvetica]`}>
          {task.description}
        </p>
      )}

      {/* Checklist avec progression (style Trello) */}
      {checklistCount > 0 && (
        <div className="mb-2 relative z-20">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className={`h-3.5 w-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Inter',Helvetica]`}>
              {completedChecklistItems}/{checklistCount}
            </span>
          </div>
          {/* Barre de progression */}
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-full transition-all ${checklistProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Aperçu des fichiers téléchargés (style Trello) */}
      {attachmentsCount > 0 && (
        <div className="mb-2 relative z-20">
          <div className="grid grid-cols-2 gap-1.5">
            {attachments.slice(0, 4).map((attachment, index) => {
              const fileUrl = attachment.url || attachment.file_url || '';
              const fileName = attachment.name || '';
              const fileType = attachment.type || '';
              const isImage = isImageFile(fileType, fileName);
              
              return (
                <div
                  key={attachment.id || index}
                  className={`relative rounded overflow-hidden ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  } group`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fileUrl) {
                      window.open(fileUrl, '_blank');
                    }
                  }}
                >
                  {isImage && fileUrl ? (
                    <div className="aspect-video relative">
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                        {React.createElement(getFileIcon(fileType, fileName), { className: "h-4 w-4" })}
                      </div>
                    </div>
                  ) : (
                    <div className={`aspect-video flex flex-col items-center justify-center p-2 cursor-pointer hover:opacity-80 transition-opacity ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className={`mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {React.createElement(getFileIcon(fileType, fileName), { className: "h-4 w-4" })}
                      </div>
                      <span className={`text-[10px] text-center line-clamp-2 px-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {fileName}
                      </span>
                      {attachment.size && (
                        <span className={`text-[9px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatFileSize(attachment.size)}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Overlay au survol pour télécharger */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
          {attachmentsCount > 4 && (
            <div className={`mt-1.5 text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              +{attachmentsCount - 4} autre(s) fichier(s)
            </div>
          )}
        </div>
      )}

      {/* Badge de statut si terminée */}
      {task.status === 'done' && (
        <div className="mb-2 relative z-20">
          <Badge className={`text-xs ${isDark ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'}`}>
            ✓ Terminée
          </Badge>
        </div>
      )}

      {/* Dates (début, fin, échéance) */}
      {(task.start_date || task.end_date || task.dueDate || task.due_date) && (
        <div className="mb-2 flex flex-col gap-1 relative z-20">
          {task.start_date && (
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock className="h-3 w-3" />
              <span>Début: {formatDate(task.start_date)}</span>
            </div>
          )}
          {task.end_date && (
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock className="h-3 w-3" />
              <span>Fin: {formatDate(task.end_date)}</span>
            </div>
          )}
          {(task.dueDate || task.due_date) && (
            <div className={`flex items-center gap-1.5 text-xs ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            } font-medium`}>
              <Calendar className="h-3 w-3" />
              <span>Échéance: {formatDate(task.dueDate || task.due_date)}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer avec métadonnées (style Trello) */}
      <div className="flex items-center justify-between mt-2 gap-2 pt-2 border-t border-gray-100 relative z-20">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Pièces jointes */}
          {attachmentsCount > 0 && (
            <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} title={`${attachmentsCount} fichier(s) attaché(s)`}>
              <Paperclip className="h-3.5 w-3.5" />
              <span className="text-xs">{attachmentsCount}</span>
            </div>
          )}
          {/* Commentaires */}
          {commentsCount > 0 && (
            <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} title={`${commentsCount} commentaire(s)`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">{commentsCount}</span>
            </div>
          )}
        </div>
        {/* Date d'échéance compacte si pas déjà affichée */}
        {(task.dueDate || task.due_date) && !task.start_date && !task.end_date && (
          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate || task.due_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ActionsAndTasks = (): JSX.Element => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useQualityTaskCategories();
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQualityTasks();

  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QualityTaskCategory | null>(null);
  const [editingTask, setEditingTask] = useState<QualityTask | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<QualityTask | null>(null);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<QualityTaskCategory | null>(null);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distance minimale avant d'activer le drag (comme Trello)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger les membres de l'organisation
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const response = await apiService.getOrganizationUsers({ per_page: 50 });
        if (response.success && response.data?.users?.data) {
          const membersData = response.data.users.data.map((u: any) => ({
            id: u.id,
            name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            avatar_url: u.avatar_url || u.avatar,
            role: u.role?.name || u.role_name,
          }));
          setOrganizationMembers(membersData);
        }
      } catch (err) {
        console.error('Error loading members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    
    loadMembers();
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCreateCategorySuccess = () => {
    refetchCategories();
    setShowCreateCategoryModal(false);
    success('Famille créée avec succès');
  };

  const handleRenameCategorySuccess = () => {
    refetchCategories();
    setShowRenameCategoryModal(false);
    setSelectedCategory(null);
    success('Famille renommée avec succès');
  };

  const handleDeleteCategory = (category: QualityTaskCategory) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setDeletingCategory(true);
    try {
      const response = await deleteTaskCategory(categoryToDelete.id);
      // Gérer différentes structures de réponse
      if (response && (response.success === true || response.success === undefined)) {
        success('Famille supprimée avec succès');
        refetchCategories();
        refetchTasks();
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
      } else if (response && response.success === false) {
        showError('Erreur', response.error?.message || response.message || 'Une erreur est survenue');
      } else {
        // Si la réponse est vide ou différente, considérer comme succès si pas d'erreur
        success('Famille supprimée avec succès');
        refetchCategories();
        refetchTasks();
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleAddTask = (categoryId?: number) => {
    setEditingTask(null);
    setSelectedCategory(categoryId ? categories.find(c => c.id === categoryId) || null : null);
    setShowAddTaskModal(true);
  };

  const handleEditTask = (task: QualityTask) => {
    setEditingTask(task);
    const taskCategoryId = task.category?.id || (task as any).category_id;
    setSelectedCategory(categories.find(c => c.id === taskCategoryId) || null);
    setShowAddTaskModal(true);
  };

  const handleTaskSuccess = () => {
    refetchTasks();
    setShowAddTaskModal(false);
    setEditingTask(null);
    setSelectedCategory(null);
    success(editingTask ? 'Tâche modifiée avec succès' : 'Tâche créée avec succès');
  };

  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
    setShowDeleteTaskModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setDeletingTask(true);
    try {
      const response = await deleteQualityTask(taskToDelete);
      if (response.success) {
        success('Tâche supprimée avec succès');
        refetchTasks();
        setShowDeleteTaskModal(false);
        setTaskToDelete(null);
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeletingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: QualityTask) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const response = await updateQualityTask(task.id, { status: newStatus });
      if (response.success) {
        refetchTasks();
        success(`Tâche marquée comme ${newStatus === 'done' ? 'terminée' : 'à faire'}`);
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);
      showError('Erreur', err.message || 'Une erreur est survenue');
    }
  };

  const handleCopyTask = async (task: QualityTask) => {
    try {
      const taskCategoryId = task.category?.id || (task as any).category_id;
      const newTaskData: any = {
        category_id: taskCategoryId,
        title: `${task.title} (Copie)`,
        description: task.description || '',
        status: 'todo',
        priority: task.priority || 'medium',
      };
      
      if (task.dueDate || task.due_date) {
        newTaskData.due_date = task.dueDate || task.due_date;
      }

      if (task.assigned_members && task.assigned_members.length > 0) {
        newTaskData.assigned_member_ids = task.assigned_members.map((m: any) => m.id);
      }

      const response = await createQualityTask(newTaskData);
      if (response.success) {
        success('Carte copiée avec succès');
        refetchTasks();
      } else {
        showError('Erreur', response.error?.message || 'Impossible de copier la carte');
      }
    } catch (err: any) {
      console.error('Error copying task:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la copie');
    }
  };

  const handleViewTask = (task: QualityTask) => {
    setViewingTask(task);
    setShowTaskViewModal(true);
  };

  const getCategoryTasks = (categoryId: number) => {
    return tasks.filter(task => {
      const taskCategoryId = task.category?.id || (task as any).category_id;
      return taskCategoryId === categoryId;
    })
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  // Filter tasks based on search term
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    const search = searchTerm.toLowerCase();
    return tasks.filter(task => {
      const title = (task.title || '').toLowerCase();
      const description = (task.description || '').toLowerCase();
      return title.includes(search) || description.includes(search);
    });
  }, [tasks, searchTerm]);

  // Filter categories based on selected filter
  const displayedCategories = useMemo(() => {
    if (!selectedCategoryFilter) return categories;
    return categories.filter(cat => cat.id === selectedCategoryFilter);
  }, [categories, selectedCategoryFilter]);

  // Get filtered tasks for each category
  const getFilteredCategoryTasks = (categoryId: number) => {
    const categoryTasks = getCategoryTasks(categoryId);
    if (!searchTerm) return categoryTasks;
    return categoryTasks.filter(task => filteredTasks.some(ft => ft.id === task.id));
  };

  const [recentDragEnd, setRecentDragEnd] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setRecentDragEnd(false);
    // Empêcher le scroll pendant le drag
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setRecentDragEnd(true);
    // Réactiver le scroll
    document.body.style.overflow = '';

    // Réinitialiser après un court délai
    setTimeout(() => {
      setRecentDragEnd(false);
    }, 300);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a task
    if (activeId.startsWith('task-')) {
      const taskId = parseInt(activeId.replace('task-', ''));
      
      // Check if dropping on another task
      if (overId.startsWith('task-')) {
        const overTaskId = parseInt(overId.replace('task-', ''));
        const activeTask = tasks.find(t => t.id === taskId);
        const overTask = tasks.find(t => t.id === overTaskId);
        
        if (activeTask && overTask) {
          const activeCategoryId = activeTask.category?.id || (activeTask as any).category_id;
          const overCategoryId = overTask.category?.id || (overTask as any).category_id;
          
          // Same category - reorder
          if (activeCategoryId === overCategoryId) {
            const categoryTasks = getCategoryTasks(activeCategoryId);
            const oldIndex = categoryTasks.findIndex(t => t.id === taskId);
            const newIndex = categoryTasks.findIndex(t => t.id === overTaskId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              const newPositions = arrayMove(categoryTasks, oldIndex, newIndex).map((task, index) => ({
                id: task.id,
                position: index,
              }));
              
              try {
                await updateTaskPositions(newPositions);
                refetchTasks();
              } catch (err) {
                console.error('Error updating positions:', err);
                showError('Erreur', 'Impossible de réorganiser les tâches');
              }
            }
          } else {
            // Different category - move task
            try {
              await updateQualityTask(taskId, { category_id: overCategoryId });
              refetchTasks();
            } catch (err) {
              console.error('Error moving task:', err);
              showError('Erreur', 'Impossible de déplacer la tâche');
            }
          }
        }
      } else if (overId.startsWith('column-')) {
        // Dropping on a column
        const categoryId = parseInt(overId.replace('column-', ''));
        const activeTask = tasks.find(t => t.id === taskId);
        
        if (activeTask) {
          try {
            await updateQualityTask(taskId, { category_id: categoryId });
            refetchTasks();
          } catch (err) {
            console.error('Error moving task:', err);
            showError('Erreur', 'Impossible de déplacer la tâche');
          }
        }
      }
    }
  };

  if (categoriesLoading || tasksLoading) {
    return (
      <div className="px-[27px] py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
      </div>
    );
  }

  if (categoriesError || tasksError) {
    return (
      <div className="px-[27px] py-8 text-red-500">
        <p>Erreur lors du chargement des données</p>
        {categoriesError && <p>Categories: {categoriesError}</p>}
        {tasksError && <p>Tâches: {tasksError}</p>}
      </div>
    );
  }

  const activeTask = activeId?.startsWith('task-') ? tasks.find(t => `task-${t.id}` === activeId) : null;

  return (
    <div className={`px-[27px] py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Page Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-[#ecf1fd]'}`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <CheckSquare2 className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Les Actions & Tâches
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez vos actions d'amélioration continue comme un tableau Trello
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className={`border-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} rounded-[18px] mb-6`}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Première ligne : Recherche et Filtres */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  placeholder="Recherche"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              {/* Category Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {selectedCategoryFilter 
                      ? categories.find(c => c.id === selectedCategoryFilter)?.name || 'Toutes les familles'
                      : 'Toutes les familles'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={isDark ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}
                  >
                    Toutes les familles
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategoryFilter(category.id)}
                      className={isDark ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: category.color || '#3f5ea9' }}
                        />
                        {category.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Create Family Button */}
              <Button
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
                onClick={() => setShowCreateCategoryModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une famille
              </Button>
            </div>

            {/* Deuxième ligne : Membres de l'organisation (style Trello) */}
            {organizationMembers.length > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} [font-family:'Poppins',Helvetica]`}>
                  Membres :
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {organizationMembers.slice(0, 10).map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center relative"
                      title={`${member.name}${member.role ? ` - ${member.role}` : ''}`}
                      style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-9 h-9 rounded-full border-2 border-white shadow-md hover:z-20 transition-transform hover:scale-110 cursor-pointer"
                          style={{ zIndex: 10 + index }}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-md hover:z-20 transition-transform hover:scale-110 cursor-pointer ${
                          isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        }`}
                        style={{ zIndex: 10 + index }}>
                          {getInitials(member.name)}
                        </div>
                      )}
                    </div>
                  ))}
                  {organizationMembers.length > 10 && (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-md relative z-10 ${
                      isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'
                    }`}
                    style={{ marginLeft: '-8px' }}>
                      +{organizationMembers.length - 10}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Trello-like Board - Style Trello */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ 
          minHeight: 'calc(100vh - 200px)',
          backgroundColor: isDark ? '#1F2937' : '#F4F5F7',
          padding: '8px'
        }}>
          {displayedCategories.map((category) => {
            const categoryTasks = getFilteredCategoryTasks(category.id);
            return (
              <Column
                key={category.id}
                category={category}
                tasks={categoryTasks}
                isDark={isDark}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleStatus={handleToggleTaskStatus}
                onCopyTask={handleCopyTask}
                onViewTask={handleViewTask}
                onRenameCategory={(cat) => {
                  setSelectedCategory(cat);
                  setShowRenameCategoryModal(true);
                }}
                onDeleteCategory={handleDeleteCategory}
                deletingCategory={deletingCategory}
                recentDragEnd={recentDragEnd}
              />
            );
          })}

          {/* Add Column Button */}
          {!selectedCategoryFilter && (
            <div className="flex-shrink-0 w-[272px]">
              <Button
                variant="outline"
                className={`w-full h-12 ${isDark ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setShowCreateCategoryModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une colonne
              </Button>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (() => {
            const dragTaskMembers = activeTask.assigned_members || [];
            const dragTaskAttachments = activeTask.attachments || [];
            const dragTaskAttachmentsCount = Array.isArray(dragTaskAttachments) ? dragTaskAttachments.length : 0;
            const dragTaskComments = activeTask.comments || [];
            const dragTaskCommentsCount = Array.isArray(dragTaskComments) ? dragTaskComments.length : 0;
            const dragTaskChecklist = activeTask.checklist || [];
            const dragTaskChecklistCount = Array.isArray(dragTaskChecklist) ? dragTaskChecklist.length : 0;
            const dragTaskCompletedChecklist = dragTaskChecklist.filter(item => item.completed).length;
            
            const getInitialsDrag = (name: string) => {
              return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            };

            return (
              <div 
                className={`p-3 rounded-md w-[272px] ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-2xl border-2 ${isDark ? 'border-blue-500' : 'border-blue-400'}`}
                style={{
                  transform: 'rotate(2deg) scale(1.05)',
                  opacity: 0.95,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Avatars */}
                {dragTaskMembers.length > 0 && (
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {dragTaskMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center"
                        style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ zIndex: 10 + index }}
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-white shadow-md ${
                            isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          }`}
                          style={{ zIndex: 10 + index }}>
                            {getInitialsDrag(member.name)}
                          </div>
                        )}
                      </div>
                    ))}
                    {dragTaskMembers.length > 3 && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-white shadow-md ${
                        isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'
                      }`}
                      style={{ marginLeft: '-8px' }}>
                        +{dragTaskMembers.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Titre */}
                <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica]`}>
                  {activeTask.title}
                </h4>

                {/* Description */}
                {activeTask.description && (
                  <p className={`text-xs mb-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} [font-family:'Inter',Helvetica]`}>
                    {activeTask.description}
                  </p>
                )}

                {/* Checklist */}
                {dragTaskChecklistCount > 0 && (
                  <div className="mb-2 flex items-center gap-1">
                    <CheckSquare className={`h-3 w-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {dragTaskCompletedChecklist}/{dragTaskChecklistCount}
                    </span>
                  </div>
                )}

                {/* Aperçu des fichiers (première image seulement) */}
                {dragTaskAttachmentsCount > 0 && dragTaskAttachments[0] && (() => {
                  const firstAttachment = dragTaskAttachments[0];
                  const fileUrl = firstAttachment.url || firstAttachment.file_url || '';
                  const fileName = firstAttachment.name || '';
                  const fileType = firstAttachment.type || '';
                  const isImage = fileType.toLowerCase().startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                  
                  if (isImage && fileUrl) {
                    return (
                      <div className="mb-2 rounded overflow-hidden">
                        <img
                          src={fileUrl}
                          alt={fileName}
                          className="w-full h-20 object-cover"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Footer avec métadonnées */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  {dragTaskAttachmentsCount > 0 && (
                    <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Paperclip className="h-3 w-3" />
                      <span className="text-[10px]">{dragTaskAttachmentsCount}</span>
                    </div>
                  )}
                  {dragTaskCommentsCount > 0 && (
                    <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-[10px]">{dragTaskCommentsCount}</span>
                    </div>
                  )}
                  {(activeTask.dueDate || activeTask.due_date) && (
                    <div className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(activeTask.dueDate || activeTask.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <CreateTaskCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onSuccess={handleCreateCategorySuccess}
      />
      <RenameTaskCategoryModal
        isOpen={showRenameCategoryModal}
        onClose={() => {
          setShowRenameCategoryModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={handleRenameCategorySuccess}
      />
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setEditingTask(null);
          setSelectedCategory(null);
        }}
        task={editingTask}
        categoryId={selectedCategory?.id}
        onSuccess={handleTaskSuccess}
      />

      {/* Confirmation Modal pour suppression de colonne */}
      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
        title={`Voulez-vous vraiment supprimer la famille "${categoryToDelete?.name}" ?`}
        message="Cette action est irréversible. Toutes les tâches associées seront également supprimées."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deletingCategory}
      />

      {/* Confirmation Modal pour suppression de carte */}
      <ConfirmationModal
        isOpen={showDeleteTaskModal}
        onClose={() => {
          setShowDeleteTaskModal(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
        title="Voulez-vous vraiment supprimer cette tâche ?"
        message="Cette action est irréversible. La tâche sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deletingTask}
      />

      {/* Task View Modal - Style Trello */}
      {viewingTask && (
        <AddTaskModal
          isOpen={showTaskViewModal}
          onClose={() => {
            setShowTaskViewModal(false);
            setViewingTask(null);
          }}
          task={viewingTask}
          categoryId={viewingTask.category?.id || (viewingTask as any).category_id}
          onSuccess={() => {
            refetchTasks();
            setShowTaskViewModal(false);
            setViewingTask(null);
          }}
        />
      )}
    </div>
  );
};
