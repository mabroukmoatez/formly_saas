import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useNewsActions, useNewsCategories } from '../../hooks/useNews';
import { useToast } from '../../components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Upload,
  Calendar,
  Tag,
  FileText,
  Bold,
  Italic,
  Underline,
  List as ListIcon,
  ListOrdered,
  ChevronLeft,
  Save,
  Eye,
  Loader2,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image as ImageIcon,
  Quote,
  Code,
  Table,
  Undo,
  Redo
} from 'lucide-react';

// Rich Text Editor Component
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateToolbarState();
  };

  const updateToolbarState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertTable = () => {
    const table = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px;">Cellule 1</td>
          <td style="padding: 8px;">Cellule 2</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Cellule 3</td>
          <td style="padding: 8px;">Cellule 4</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', table);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className={isBold ? 'bg-gray-200' : ''}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className={isItalic ? 'bg-gray-200' : ''}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className={isUnderline ? 'bg-gray-200' : ''}
        >
          <Underline className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h1')}
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h2')}
        >
          H2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h3')}
        >
          H3
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
        >
          <ListIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyFull')}
        >
          <AlignJustify className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Insert */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertLink}
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertImage}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'pre')}
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
        >
          <Table className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('undo')}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export const ActualitesCreate = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { createNews, loading, error } = useNewsActions();
  const { categories, loading: categoriesLoading } = useNewsCategories();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    short_description: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    tags: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showError('Erreur', 'L\'image doit faire moins de 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Erreur', 'Veuillez sélectionner un fichier image');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires selon l'API
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est obligatoire';
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'La description courte est obligatoire';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est obligatoire';
    }

    // Validation des longueurs
    if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (formData.title.length > 200) {
      newErrors.title = 'Le titre ne peut pas dépasser 200 caractères';
    }

    if (formData.short_description.length < 10) {
      newErrors.short_description = 'La description courte doit contenir au moins 10 caractères';
    }

    if (formData.short_description.length > 500) {
      newErrors.short_description = 'La description courte ne peut pas dépasser 500 caractères';
    }

    if (formData.content.length < 50) {
      newErrors.content = 'Le contenu doit contenir au moins 50 caractères';
    }

    if (formData.content.length > 50000) {
      newErrors.content = 'Le contenu ne peut pas dépasser 50,000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const result = await createNews({
        title: formData.title,
        category: formData.category,
        short_description: formData.short_description,
        content: formData.content,
        status: formData.status,
        featured: formData.featured,
        tags: tagsArray,
        image: fileInputRef.current?.files?.[0] || undefined,
      });

      if (result) {
        success('Succès', 'Actualité créée avec succès');
        setTimeout(() => {
          navigateToRoute('/actualites');
        }, 1000);
      } else {
        showError('Erreur', 'Impossible de créer l\'actualité');
      }
    } catch (error) {
      console.error('Creation error:', error);
      showError('Erreur', 'Une erreur est survenue lors de la création');
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-8 py-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigateToRoute('/actualites')}
              className="h-auto p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[24px] mb-2`}>
                Créer une actualité
              </h1>
              <p className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-400' : 'text-[#5c677e]'} text-[15px]`}>
                Rédigez et publiez une nouvelle actualité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigateToRoute('/actualites')}
              className="rounded-[13px] px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-[13px] px-4 py-2 gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[16px]">
                {loading ? 'Création...' : 'Créer l\'actualité'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
                <CardContent className="p-6 space-y-6">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations de base
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Titre *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Entrez le titre de l'actualité"
                        className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Catégorie *
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className={`mt-1 w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="short_description" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description courte *
                      </Label>
                      <Textarea
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) => handleInputChange('short_description', e.target.value)}
                        placeholder="Résumé de l'actualité en quelques lignes"
                        rows={3}
                        className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                      {errors.short_description && (
                        <p className="mt-1 text-sm text-red-600">{errors.short_description}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tags" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tags
                      </Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="tag1, tag2, tag3 (séparés par des virgules)"
                        className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
                <CardContent className="p-6 space-y-6">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Contenu
                  </h2>

                  <div>
                    <Label htmlFor="content" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contenu de l'actualité *
                    </Label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={formData.content}
                        onChange={(value) => handleInputChange('content', value)}
                        placeholder="Rédigez le contenu de votre actualité..."
                      />
                    </div>
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Image Upload */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
                <CardContent className="p-6 space-y-4">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Image de l'actualité
                  </h3>

                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImagePreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Cliquez pour ajouter une image
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, PNG, WebP (max 2MB)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
                <CardContent className="p-6 space-y-4">
                  <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Paramètres
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Statut
                      </Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                        className={`mt-1 w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="draft">Brouillon</option>
                        <option value="published">Publié</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="featured" className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Mettre en avant
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActualitesCreate;
