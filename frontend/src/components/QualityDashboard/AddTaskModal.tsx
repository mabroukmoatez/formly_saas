import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { 
  createQualityTask, 
  updateQualityTask, 
  QualityTask, 
  QualityTaskCategory,
  uploadTaskAttachment,
  addTaskComment
} from '../../services/qualityManagement';
import { Loader2, Calendar as CalendarIcon, Search, Plus, X, Upload, Paperclip, User, MessageSquare } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { formatDate, formatDateISO } from '../../utils/dateFormatter';
import { useQualityTaskCategories } from '../../hooks/useQualityTaskCategories';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { InfoTooltip } from '../ui/info-tooltip';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: QualityTask | null;
  categoryId?: number;
  onSuccess?: () => void;
}

interface OrganizationMember {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  categoryId,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const { categories, loading: loadingCategories } = useQualityTaskCategories();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low');
  const [loading, setLoading] = useState(false);
  
  // Members assignment
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<OrganizationMember[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  
  // File attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Comments
  const [comment, setComment] = useState('');

  // Load organization members
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await apiService.getOrganizationUsers({ per_page: 100 });
      console.log('✅ AddTaskModal loadMembers response:', response);
      
      // Handle different response structures
      let usersArray: any[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { users: { data: [...] } } }
          // OR: { success: true, data: { users: [...] } }
          // OR: { success: true, data: [...] }
          usersArray = response.data?.users?.data || 
                       response.data?.users || 
                       response.data?.data || 
                       (Array.isArray(response.data) ? response.data : []);
        } else if (response.users && Array.isArray(response.users)) {
          // Structure: { users: [...] }
          usersArray = response.users;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          usersArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          usersArray = response.data;
        }
      }
      
      const membersData = usersArray.map((u: any) => ({
        id: u.id,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Utilisateur sans nom',
        email: u.email || '',
        avatar_url: u.avatar_url || u.avatar || '',
        role: u.role?.name || u.role_name || '',
      }));
      
      setMembers(membersData);
    } catch (err) {
      console.error('Error loading members:', err);
      showError('Erreur', 'Impossible de charger les membres de l\'organisation');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        const taskCategoryId = task.category?.id || task.category_id;
        setSelectedCategoryId(String(taskCategoryId || ''));
        const dueDateValue = task.dueDate || task.due_date;
        if (dueDateValue) {
          try {
            const date = new Date(dueDateValue);
            if (!isNaN(date.getTime())) {
              setDueDate(date);
            } else {
              setDueDate(undefined);
            }
          } catch {
            setDueDate(undefined);
          }
        } else {
          setDueDate(undefined);
        }
        const startDateValue = task.start_date;
        if (startDateValue) {
          try {
            const date = new Date(startDateValue);
            if (!isNaN(date.getTime())) {
              setStartDate(date);
            } else {
              setStartDate(undefined);
            }
          } catch {
            setStartDate(undefined);
          }
        } else {
          setStartDate(undefined);
        }
        const endDateValue = task.end_date;
        if (endDateValue) {
          try {
            const date = new Date(endDateValue);
            if (!isNaN(date.getTime())) {
              setEndDate(date);
            } else {
              setEndDate(undefined);
            }
          } catch {
            setEndDate(undefined);
          }
        } else {
          setEndDate(undefined);
        }
        setStatus(task.status === 'archived' ? 'done' : task.status);
        setPriority(task.priority || 'low');
        setSelectedMembers(task.assigned_members || []);
        setAttachments([]); // Files will be loaded from task.attachments when needed
      } else {
        setTitle('');
        setDescription('');
        setSelectedCategoryId(categoryId ? String(categoryId) : '');
        setDueDate(undefined);
        setStartDate(undefined);
        setEndDate(undefined);
        setStatus('todo');
        setPriority('low');
        setSelectedMembers([]);
        setAttachments([]);
        setComment('');
      }
    }
  }, [isOpen, task, categoryId]);

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId && !task) {
      setSelectedCategoryId(String(categoryId || categories[0].id));
    }
  }, [categories, categoryId, selectedCategoryId, task]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAddMember = (member: OrganizationMember) => {
    if (!selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers([...selectedMembers, member]);
    }
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const handleRemoveMember = (memberId: number) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Erreur', 'Le titre de la tâche est requis');
      return;
    }

    if (!selectedCategoryId) {
      showError('Erreur', 'Veuillez sélectionner une famille');
      return;
    }

    setLoading(true);
    try {
      const taskData: any = {
        category_id: Number(selectedCategoryId),
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate ? formatDateISO(dueDate) : undefined,
        start_date: startDate ? formatDateISO(startDate) : undefined,
        end_date: endDate ? formatDateISO(endDate) : undefined,
        assigned_member_ids: selectedMembers.map(m => m.id),
      };

      let response;
      let createdTaskId: number | undefined;
      
      if (task?.id) {
        response = await updateQualityTask(task.id, taskData);
        createdTaskId = task.id;
      } else {
        response = await createQualityTask(taskData);
        if (response.success && response.data?.id) {
          createdTaskId = response.data.id;
        }
      }

      if (response.success && createdTaskId) {
        // Upload attachments
        if (attachments.length > 0) {
          setUploadingFiles(true);
          try {
            for (const file of attachments) {
              await uploadTaskAttachment(createdTaskId, file);
            }
          } catch (err) {
            console.error('Error uploading attachments:', err);
            // Don't fail the whole operation if file upload fails
          } finally {
            setUploadingFiles(false);
          }
        }

        // Add comment if provided
        if (comment.trim() && user?.id) {
          try {
            await addTaskComment(createdTaskId, comment.trim());
          } catch (err) {
            console.error('Error adding comment:', err);
            // Don't fail the whole operation if comment fails
          }
        }

        success(task?.id ? 'Tâche modifiée avec succès' : 'Tâche créée avec succès');
        onSuccess?.();
        onClose();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error saving task:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            {task?.id ? 'Modifier la Tâche' : 'Ajouter une Tâche'}
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            {task?.id ? 'Modifiez les informations de la tâche' : 'Créez une nouvelle tâche pour organiser vos actions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Famille <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="Sélectionner une famille" />
                </SelectTrigger>
                <SelectContent className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                  {loadingCategories ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Chargement...</div>
                  ) : categories && categories.length > 0 ? (
                    categories.map((category: QualityTaskCategory) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucune famille disponible</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="priority" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Priorité
              </Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setPriority(value)}>
                <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned Members */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Membres assignés
              </Label>
            </div>
            
            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'}`}>
                        {getInitials(member.name)}
                      </div>
                    )}
                    <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {member.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className={`hover:bg-opacity-80 rounded p-0.5 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Member Button and Search */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                className={`w-full justify-start ${isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300'}`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              
              {showMemberDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-md border shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className={`absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <Input
                        placeholder="Recherche"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className={`pl-8 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {loadingMembers ? (
                      <div className="p-4 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </div>
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers
                        .filter(m => !selectedMembers.find(sm => sm.id === m.id))
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => handleAddMember(member)}
                            className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'}`}>
                                {getInitials(member.name)}
                              </div>
                            )}
                            <div className="flex-1 text-left">
                              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {member.name}
                              </div>
                              {member.email && (
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {member.email}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                    ) : (
                      <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aucun membre trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Period */}
          <div className="flex flex-col gap-2">
            <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Période de réalisation
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !startDate && (isDark ? 'text-gray-400' : 'text-gray-500')
                    } ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate) : "Date de début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={isDark ? 'text-white' : ''}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !endDate && (isDark ? 'text-gray-400' : 'text-gray-500')
                    } ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDate(endDate) : "Date de fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={isDark ? 'text-white' : ''}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="description" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Description
              </Label>
              <InfoTooltip text="Résumez en quelques lignes le contenu de la tâche" />
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche (optionnel)"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              rows={4}
            />
          </div>

          {/* File Attachments */}
          <div className="flex flex-col gap-2">
            <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Fichiers liés
            </Label>
            
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {file.name}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className={`hover:bg-opacity-80 rounded p-0.5 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300'}`}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer Un Fichier
            </Button>
          </div>

          {/* Due Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Date d'échéance
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !dueDate && (isDark ? 'text-gray-400' : 'text-gray-500')
                    } ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? formatDate(dueDate) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={isDark ? 'text-white' : ''}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Statut
              </Label>
              <Select value={status} onValueChange={(value: 'todo' | 'in_progress' | 'done') => setStatus(value)}>
                <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Commentaires
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Écrire un commentaire"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || uploadingFiles}
              className={isDark ? 'border-gray-600' : ''}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingFiles}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90"
            >
              {loading || uploadingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {task?.id ? 'Modification...' : 'Création...'}
                </>
              ) : (
                'Valider'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
