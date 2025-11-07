import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Entrez du texte...',
  className = '',
  minHeight = '120px'
}) => {
  const { isDark } = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if not focused to avoid cursor jump
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className={`flex items-center gap-1 p-2 border-b ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} rounded-t-md`}>
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'}`}
          title="Gras"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'}`}
          title="Italique"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'}`}
          title="Souligné"
        >
          <u>U</u>
        </button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'}`}
          title="Liste"
        >
          • Liste
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'}`}
          title="Liste numérotée"
        >
          1. Numérotée
        </button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className={`px-2 py-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'} text-xs`}
          title="Effacer le formatage"
        >
          Effacer format
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={`w-full p-3 border rounded-b-md outline-none ${
          isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-800'
        } ${className}`}
        style={{ minHeight }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />

      <style>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isDark ? '#6B7280' : '#9CA3AF'};
          font-style: italic;
        }
        [contentEditable]:focus {
          outline: 2px solid #007aff;
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
};
