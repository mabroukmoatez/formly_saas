import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List, 
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  Palette,
  Type,
  Minus
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './button';

interface RichTextEditorAdvancedProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditorAdvanced: React.FC<RichTextEditorAdvancedProps> = ({
  value,
  onChange,
  placeholder = 'Entrez du texte...',
  className = '',
  minHeight = '200px'
}) => {
  const { isDark } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
        setShowHeadingMenu(false);
      }
    };

    if (showColorPicker || showHeadingMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, showHeadingMenu]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none ${
          isDark ? 'prose-invert' : ''
        }`,
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  ];

  const headingLevels = [
    { level: 1, label: 'Titre 1' },
    { level: 2, label: 'Titre 2' },
    { level: 3, label: 'Titre 3' },
  ];

  return (
    <div className={`w-full border rounded-lg overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'} ${className}`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-1 p-2 border-b flex-wrap ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
        {/* Undo/Redo */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={`h-8 w-8 p-0 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Annuler"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={`h-8 w-8 p-0 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Refaire"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Headings */}
        <div className="relative" ref={headingMenuRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className={`h-8 px-2 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
            title="Titres"
          >
            <Type className="w-4 h-4 mr-1" />
            <span className="text-xs">
              {editor.isActive('heading', { level: 1 }) && 'H1'}
              {editor.isActive('heading', { level: 2 }) && 'H2'}
              {editor.isActive('heading', { level: 3 }) && 'H3'}
              {!editor.isActive('heading') && 'Texte'}
            </span>
          </Button>
          {showHeadingMenu && (
            <div className={`absolute top-full left-0 mt-1 rounded-md shadow-lg z-10 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
              >
                Paragraphe
              </button>
              {headingLevels.map(({ level, label }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level }).run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Souligné"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Barré"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Text Color */}
        <div className="relative" ref={colorPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`h-8 w-8 p-0 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
            title="Couleur du texte"
          >
            <Palette className="w-4 h-4" />
          </Button>
          {showColorPicker && (
            <div className={`absolute top-full left-0 mt-1 p-2 rounded-md shadow-lg z-10 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run();
                  setShowColorPicker(false);
                }}
                className="w-full mt-2 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          )}
        </div>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Aligner à droite"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Justifier"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-blue-100 text-blue-700' : ''} ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Lien"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        {/* Horizontal Rule */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`h-8 w-8 p-0 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
          title="Ligne horizontale"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ minHeight }}>
        <EditorContent 
          editor={editor} 
          className={`prose prose-sm max-w-none p-4 ${isDark ? 'prose-invert' : ''}`}
        />
        <style>{`
          .ProseMirror {
            outline: none;
            min-height: ${minHeight};
            padding: 1rem;
            ${isDark ? 'color: #E5E7EB;' : 'color: #111827;'}
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: ${isDark ? '#6B7280' : '#9CA3AF'};
            pointer-events: none;
            height: 0;
            font-style: italic;
          }
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            font-weight: bold;
          }
          .ProseMirror h1 {
            font-size: 1.875rem;
          }
          .ProseMirror h2 {
            font-size: 1.5rem;
          }
          .ProseMirror h3 {
            font-size: 1.25rem;
          }
          .ProseMirror p {
            margin: 0.5rem 0;
          }
          .ProseMirror a {
            color: #3B82F6;
            text-decoration: underline;
          }
          .ProseMirror a:hover {
            color: #2563EB;
          }
          .ProseMirror hr {
            border: none;
            border-top: 1px solid ${isDark ? '#4B5563' : '#D1D5DB'};
            margin: 1rem 0;
          }
          .ProseMirror strong {
            font-weight: bold;
          }
          .ProseMirror em {
            font-style: italic;
          }
          .ProseMirror u {
            text-decoration: underline;
          }
          .ProseMirror s {
            text-decoration: line-through;
          }
        `}</style>
      </div>
    </div>
  );
};

