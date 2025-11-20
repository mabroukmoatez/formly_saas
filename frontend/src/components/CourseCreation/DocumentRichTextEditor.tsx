import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, Link, Palette, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, IndentDecrease, IndentIncrease, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { AVAILABLE_VARIABLES, VariableDefinition } from './VariableSelector';

interface DocumentRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onVariableInsert?: (variable: VariableDefinition) => void;
  className?: string;
  onFocus?: () => void;
}

export const DocumentRichTextEditor: React.FC<DocumentRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Entrez du texte...',
  onVariableInsert,
  className = '',
  onFocus
}) => {
  const { isDark } = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#212121');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateToolbarState();
    handleInput();
  };

  const updateToolbarState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    
    const color = document.queryCommandValue('foreColor');
    if (color && color !== 'rgb(0, 0, 0)') {
      setTextColor(color);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const handleColorChange = (color: string) => {
    execCommand('foreColor', color);
    setTextColor(color);
    setShowColorPicker(false);
  };

  const insertVariable = (variable: VariableDefinition) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      const badge = document.createElement('span');
      badge.className = 'variable-badge';
      badge.setAttribute('style', 'background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;');
      badge.textContent = variable.label;
      badge.setAttribute('contenteditable', 'false');
      badge.setAttribute('data-variable', variable.key);
      
      range?.deleteContents();
      range?.insertNode(badge);
      
      // Move cursor after badge
      range?.setStartAfter(badge);
      range?.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      handleInput();
      setShowVariableMenu(false);
      
      if (onVariableInsert) {
        onVariableInsert(variable);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Editor Content */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              onFocus={() => {
                updateToolbarState();
                if (onFocus) onFocus();
              }}
              className={`min-h-[120px] p-4 border border-gray-300 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900'
              }`}
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: value || '' }}
            />

      {/* Toolbar */}
      <div className={`h-10 bg-gray-50 border-t border-gray-300 rounded-b-md flex items-center gap-1 px-3 ${isDark ? 'bg-gray-800 border-gray-600' : ''}`}>
        {/* Groupe 1: Formatage de base */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isBold 
              ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isItalic 
              ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isUnderline 
              ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Souligné"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Groupe 2: Lien et couleur */}
        <button
          type="button"
          onClick={insertLink}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Insérer un lien"
        >
          <Link className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="Couleur du texte"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className={`absolute top-8 left-0 p-2 rounded shadow-lg z-50 ${isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Groupe 3: Alignement */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Aligner à droite"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Groupe 4: Listes */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Groupe 5: Indentation */}
        <button
          type="button"
          onClick={() => execCommand('outdent')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Diminuer l'indentation"
        >
          <IndentDecrease className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('indent')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Augmenter l'indentation"
        >
          <IndentIncrease className="w-4 h-4" />
        </button>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

        {/* Groupe 6: Actions spéciales */}
        <button
          type="button"
          onClick={insertImage}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Insérer une image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        
        {/* Bouton orange spécial pour variables */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVariableMenu(!showVariableMenu)}
            className="w-8 h-8 rounded bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-colors"
            title="Variables dynamiques"
          >
            <Type className="w-4 h-4" />
          </button>
          {showVariableMenu && (
            <div className={`absolute top-8 right-0 w-64 max-h-96 overflow-y-auto rounded shadow-lg z-50 ${isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
              <div className="p-2">
                <div className={`text-xs font-medium mb-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Variables disponibles
                </div>
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => insertVariable(variable)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{variable.label}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {variable.key}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

