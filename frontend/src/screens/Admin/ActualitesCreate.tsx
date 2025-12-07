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
      <div className="border-b bg-gray-50 p-1.5 flex flex-wrap gap-0.5">
        {/* Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className={`h-7 w-7 p-0 ${isBold ? 'bg-gray-200' : ''}`}
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className={`h-7 w-7 p-0 ${isItalic ? 'bg-gray-200' : ''}`}
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className={`h-7 w-7 p-0 ${isUnderline ? 'bg-gray-200' : ''}`}
        >
          <Underline className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h1')}
          className="h-7 px-2 text-xs"
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h2')}
          className="h-7 px-2 text-xs"
        >
          H2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h3')}
          className="h-7 px-2 text-xs"
        >
          H3
        </Button>

        <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-7 w-7 p-0"
        >
          <ListIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-7 w-7 p-0"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          className="h-7 w-7 p-0"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          className="h-7 w-7 p-0"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          className="h-7 w-7 p-0"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyFull')}
          className="h-7 w-7 p-0"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

        {/* Insert */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-7 w-7 p-0"
        >
          <Link className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertImage}
          className="h-7 w-7 p-0"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="h-7 w-7 p-0"
        >
          <Quote className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'pre')}
          className="h-7 w-7 p-0"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-7 w-7 p-0"
        >
          <Table className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

        {/* History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('undo')}
          className="h-7 w-7 p-0"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
          className="h-7 w-7 p-0"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[250px] p-3 focus:outline-none text-sm"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        style={{ minHeight: '250px' }}
      />
    </div>
  );
};

// SVG paths for icons
const svgPaths = {
  circle: "M12.5 12.5C12.5 13.1944 13.1944 17 8.5 17C3.80558 17 0 13.1944 0 8.5C0 3.80558 3.80558 0 8.5 0C13.1944 0 17 3.80558 17 8.5Z",
  checkmark: "M8 13L10.915 15.3934C11.3283 15.7327 11.9355 15.6869 12.2931 15.2892L17.5 9.5",
  arrow: "M5.66618 7.14108L6.8458 13.0284C7.0685 14.1399 8.58933 14.3611 9.13058 13.3607L14.8612 2.76808C15.0829 2.35828 15.0366 1.90537 14.8149 1.56054",
  info: "M17 8.5C17 13.1944 13.1944 17 8.5 17C3.80558 17 0 13.1944 0 8.5C0 3.80558 3.80558 0 8.5 0C13.1944 0 17 3.80558 17 8.5ZM11.9258 5.92422C12.1747 6.17318 12.1747 6.57682 11.9258 6.82576L7.67576 11.0758C7.42679 11.3247 7.02321 11.3247 6.77422 11.0758L5.07422 9.37576C4.82526 9.12679 4.82526 8.72321 5.07422 8.47425C5.32318 8.22528 5.72682 8.22528 5.97578 8.47425L7.225 9.7234L9.12458 7.82383L11.0242 5.92422C11.2732 5.67526 11.6768 5.67526 11.9258 5.92422Z",
  dropdown: "M9.4097 3.21257e-07C9.93455 3.40375e-07 10.1974 0.567797 9.82627 0.899872L5.41657 4.84561C5.1865 5.05146 4.8135 5.05146 4.58343 4.84561L0.173729 0.899871C-0.197393 0.567796 0.0654508 -1.91181e-08 0.590298 0L9.4097 3.21257e-07Z",
  helpCircle: "M7.9725 8.625C8.80583 7.79167 9.63917 7.46217 9.63917 6.54167C9.63917 5.62119 8.893 4.875 7.9725 4.875C7.19592 4.875 6.54333 5.40616 6.35833 6.125M7.9725 11.125H7.98083M15.5 8C15.5 12.1422 12.1422 15.5 8 15.5C3.85787 15.5 0.5 12.1422 0.5 8C0.5 3.85787 3.85787 0.5 8 0.5C12.1422 0.5 15.5 3.85787 15.5 8Z"
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

  const handleSubmit = async (statusToSave: 'draft' | 'published') => {
    // For draft, we don't need to validate
    if (statusToSave === 'published' && !validateForm()) {
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
        status: statusToSave,
        featured: formData.featured,
        tags: tagsArray,
        image: fileInputRef.current?.files?.[0] || undefined,
      });

      if (result) {
        success('Succès', `Actualité ${statusToSave === 'published' ? 'publiée' : 'sauvegardée en brouillon'} avec succès`);
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

  // Check if all required fields are filled
  const isFormValid = () => {
    return formData.title.trim() !== '' &&
           formData.category.trim() !== '' &&
           formData.short_description.trim() !== '' &&
           formData.content.trim() !== '';
  };

  return (
    <div className="relative bg-white size-full">
      {/* Status Buttons - Positioned absolutely at top right */}
      <div className="absolute flex gap-[10px] items-center right-[40px] top-[90px] z-10">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
          className="flex gap-[6px] items-center justify-center px-[24px] py-[8px] rounded-[32px] bg-[#ff9500] hover:bg-[#ff9500]/90 disabled:opacity-50 transition-all"
        >
          <div className="relative shrink-0 size-[18px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
              <circle cx="12.5" cy="12.5" r="11.5" stroke="white" strokeWidth="2" />
              <path d={svgPaths.checkmark} stroke="white" strokeLinecap="round" strokeWidth="3" />
            </svg>
          </div>
          <p className="capitalize font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[14px] text-nowrap text-right text-white whitespace-pre">
            brouillon
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={!isFormValid() || loading}
          className={`flex gap-[6px] items-center justify-center px-[15px] py-[8px] rounded-[32px] transition-all ${
            isFormValid() && !loading
              ? 'bg-[#007aff] hover:bg-[#007aff]/90'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <div className="h-[11px] relative shrink-0 w-[12px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
              <path d={svgPaths.arrow} stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <p className="capitalize font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[14px] text-nowrap text-right text-white whitespace-pre">
            Publier
          </p>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="absolute bg-[rgba(232,240,247,0.27)] flex flex-col gap-[20px] items-start left-[30px] p-[16px] rounded-[14px] top-[150px] w-[calc(100%-60px)] border border-[#d3d3e8]">
        {/* Section Header */}
        <div className="flex items-center w-full">
          <p className="font-['Poppins',Helvetica] font-semibold leading-[normal] not-italic text-[#19294a] text-[14px]">
            Ajouter une actualité
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-[24px] w-full">
          {/* Title Field */}
          <div className="flex flex-col gap-[6px]">
            <div className="bg-white flex h-[50px] items-center justify-between px-[14px] py-[10px] rounded-[14px] w-full border-2 border-[#e2e2ea]">
              <div className="flex gap-[10px] items-center w-full">
                <div className="flex gap-[6px] items-center">
                  <div className="relative shrink-0 size-[14px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                      {formData.title.trim() ? (
                        <path clipRule="evenodd" d={svgPaths.info} fill="#19294A" fillRule="evenodd" />
                      ) : (
                        <circle cx="8.5" cy="8.5" r="7.5" stroke="#E2E2EA" strokeWidth="2" />
                      )}
                    </svg>
                  </div>
                  <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#19294a] text-[13px] text-nowrap whitespace-pre">
                    Titre de l'actualité
                  </p>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Saisissez le titre de l'actualité"
                  className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#6a90ba] text-[13px] outline-none flex-1 bg-transparent"
                />
              </div>
            </div>
            <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#6a90ba] text-[12px]">
              * Ce champ est obligatoire
            </p>
            {errors.title && (
              <p className="font-['Poppins',Helvetica] font-medium text-red-600 text-[12px]">{errors.title}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="bg-white relative rounded-[14px] w-full border border-[#dbd9d9] shadow-[0px_0px_50px_0px_rgba(25,41,74,0.06)]">
            <div className="flex flex-col gap-[16px] items-start p-[16px] w-full">
              <div className="flex gap-[6px] items-center relative">
                <div className="relative shrink-0 size-[14px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    {formData.category.trim() ? (
                      <path clipRule="evenodd" d={svgPaths.info} fill="#19294A" fillRule="evenodd" />
                    ) : (
                      <circle cx="8.5" cy="8.5" r="7.5" stroke="#E2E2EA" strokeWidth="2" />
                    )}
                  </svg>
                </div>
                <p className="capitalize font-['Poppins',Helvetica] font-semibold leading-[normal] not-italic text-[#19294a] text-[13px] text-nowrap whitespace-pre">
                  catégorie
                </p>
                <div className="relative shrink-0 size-[12px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <path d={svgPaths.helpCircle} stroke="#6A90BA" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e2ea] rounded-md font-['Poppins',Helvetica] font-medium text-[#19294a] text-[13px] outline-none bg-white"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="font-['Poppins',Helvetica] font-medium text-red-600 text-[12px]">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-[6px]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {imagePreview ? (
              <div className="bg-white relative rounded-[14px] border-2 border-[#e2e2ea] overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-[120px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-white h-[120px] rounded-[14px] border-2 border-[#e2e2ea] flex flex-col items-center justify-center px-[14px] py-[10px] cursor-pointer hover:border-[#6a90ba] transition-colors"
              >
                <div className="bg-neutral-100 relative rounded-[20px] size-[32px] border-[4px] border-neutral-50 flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4 text-[#181D27]" />
                </div>
                <div className="flex gap-[4px] items-center justify-center">
                  <p className="font-['Inter',sans-serif] font-semibold leading-[18px] text-[12px] text-nowrap text-gray-700">Cliquer pour ajouter</p>
                  <p className="font-['Inter',sans-serif] font-normal leading-[18px] text-[#535862] text-[12px]">ou glisser-déposer</p>
                </div>
                <p className="font-['Inter',sans-serif] font-normal leading-[16px] text-[#535862] text-[11px] text-center mt-1">
                  SVG, PNG, JPG ou GIF (max. 800x400px)
                </p>
              </div>
            )}
            <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#6a90ba] text-[12px]">
              Formats acceptés : JPG, PNG. Taille recommandée : 1200x600 px
            </p>
          </div>

          {/* Short Description */}
          <div className="bg-white flex flex-col gap-[14px] items-start pb-[18px] pt-[10px] px-[14px] rounded-[14px] w-full border-2 border-[#e2e2ea]">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-[6px] items-center">
                <div className="relative shrink-0 size-[14px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    {formData.short_description.trim() ? (
                      <path clipRule="evenodd" d={svgPaths.info} fill="#19294A" fillRule="evenodd" />
                    ) : (
                      <circle cx="8.5" cy="8.5" r="7.5" stroke="#E2E2EA" strokeWidth="2" />
                    )}
                  </svg>
                </div>
                <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#19294a] text-[13px] text-nowrap whitespace-pre">
                  Description Courte
                </p>
              </div>
              <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#19294a] text-[13px]">
                {formData.short_description.length}
              </p>
            </div>
            <div className="bg-white h-[90px] rounded-[14px] w-full border-2 border-[#e2e2ea]">
              <textarea
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                placeholder="Résumez en quelques lignes le contenu de l'actualité"
                className="w-full h-full px-[14px] py-[10px] font-['Poppins',Helvetica] font-medium text-[#6a90ba] text-[13px] outline-none resize-none bg-transparent"
              />
            </div>
            {errors.short_description && (
              <p className="font-['Poppins',Helvetica] font-medium text-red-600 text-[12px]">{errors.short_description}</p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white flex flex-col gap-[14px] items-start pb-[18px] pt-[10px] px-[14px] rounded-[14px] w-full border-2 border-[#e2e2ea]">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-[10px] items-center">
                <div className="flex gap-[6px] items-center">
                  <div className="relative shrink-0 size-[14px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                      {formData.content.trim() ? (
                        <path clipRule="evenodd" d={svgPaths.info} fill="#19294A" fillRule="evenodd" />
                      ) : (
                        <circle cx="8.5" cy="8.5" r="7.5" stroke="#E2E2EA" strokeWidth="2" />
                      )}
                    </svg>
                  </div>
                  <p className="font-['Poppins',Helvetica] font-medium leading-[normal] not-italic text-[#19294a] text-[13px] text-nowrap whitespace-pre">
                    Contenu
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full">
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="Rédigez le contenu de votre actualité..."
              />
            </div>
            {errors.content && (
              <p className="font-['Poppins',Helvetica] font-medium text-red-600 text-[12px]">{errors.content}</p>
            )}
          </div>

          {/* Hidden Featured Checkbox - Keeping functionality */}
          <input
            type="hidden"
            checked={formData.featured}
            onChange={(e) => handleInputChange('featured', e.target.checked)}
          />
        </form>
      </div>
    </div>
  );
};

export default ActualitesCreate;
