import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

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

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Check formatting state - only when editor is focused
  useEffect(() => {
    const checkFormatting = () => {
      if (editorRef.current && document.activeElement === editorRef.current) {
        // Only check formatting if editor is already focused
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));
      }
    };

    // Check formatting less frequently and only when focused
    const interval = setInterval(checkFormatting, 500);
    return () => clearInterval(interval);
  }, []);

  const execCommand = (command: string, value?: string) => {
    // Only focus if editor is not already focused or if we need to execute a command
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      // Update state only if editor is focused
      if (document.activeElement === editorRef.current) {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));
      }
    }
  };

  const setAlignmentCommand = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!editorRef.current) return;
    
    // Only focus if not already focused
    if (document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    
    // Use execCommand for alignment (more reliable)
    const commands: Record<string, string> = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    };
    
    execCommand(commands[align]);
    setAlignment(align);
    
    // Also update the editor's style for consistency
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let blockElement: HTMLElement | null = null;
      
      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        blockElement = range.commonAncestorContainer.parentElement;
      } else {
        blockElement = range.commonAncestorContainer as HTMLElement;
      }
      
      const block = blockElement?.closest('p, div, h1, h2, h3, h4, h5, h6');
      if (block && block instanceof HTMLElement) {
        block.style.textAlign = align;
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <div 
      className="w-full"
      onClick={(e) => {
        // Stop propagation for the entire editor container
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Stop propagation on mousedown as well
        e.stopPropagation();
      }}
      data-interactive="true"
      data-rich-text-editor="true"
    >
      {/* Toolbar */}
      <div 
        className={`flex items-center gap-2 p-2 border-b ${isDark ? 'border-[#E2E8F0] bg-gray-800' : 'border-[#E2E8F0] bg-white'} rounded-t-md`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Formatting buttons */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('bold')}
          className={`px-3 py-1.5 rounded transition-colors ${
            isBold
              ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
          }`}
          title="Gras"
        >
          <strong className="font-bold">B</strong>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('italic')}
          className={`px-3 py-1.5 rounded transition-colors ${
            isItalic
              ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
          }`}
          title="Italique"
        >
          <em className="italic">I</em>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('underline')}
          className={`px-3 py-1.5 rounded transition-colors ${
            isUnderline
              ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
          }`}
          title="Souligné"
        >
          <u className="underline">U</u>
        </button>
        
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-[#E2E8F0]'}`}></div>
        
        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent losing focus
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            execCommand('insertUnorderedList');
          }}
          className={`px-3 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
          }`}
          title="Liste à puces"
        >
          <span className="text-[14px]">• Liste</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent losing focus
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            execCommand('insertOrderedList');
          }}
          className={`px-3 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
          }`}
          title="Liste numérotée"
        >
          <span className="text-[14px]">1. Numérotée</span>
        </button>
        
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-[#E2E8F0]'}`}></div>
        
        {/* Alignment */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAlignmentCommand('left')}
            className={`px-2 py-1.5 rounded transition-colors ${
              alignment === 'left'
                ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
            }`}
            title="Alignement gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAlignmentCommand('center')}
            className={`px-2 py-1.5 rounded transition-colors ${
              alignment === 'center'
                ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
            }`}
            title="Alignement centre"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAlignmentCommand('right')}
            className={`px-2 py-1.5 rounded transition-colors ${
              alignment === 'right'
                ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
            }`}
            title="Alignement droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAlignmentCommand('justify')}
            className={`px-2 py-1.5 rounded transition-colors ${
              alignment === 'justify'
                ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-[#2D3748]'
                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-[#718096]'
            }`}
            title="Justifier"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={(e) => {
          // Stop propagation to prevent triggering parent click handlers
          e.stopPropagation();
          // Only focus if clicking directly on the editor (not from outside)
          if (e.target === editorRef.current || editorRef.current?.contains(e.target as Node)) {
            // Allow normal focus behavior
            return;
          }
        }}
        onMouseDown={(e) => {
          // Stop propagation on mousedown as well
          e.stopPropagation();
        }}
        onFocus={(e) => {
          // Stop propagation when editor gets focus
          e.stopPropagation();
        }}
        className={`w-full p-4 border-0 rounded-b-md outline-none ${
          isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-[#2D3748]'
        } ${className}`}
        style={{ 
          minHeight,
          fontFamily: 'Poppins, Helvetica',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        data-interactive="true"
        tabIndex={0}
      />

      <style>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isDark ? '#718096' : '#718096'};
          font-style: italic;
          font-size: 14px;
        }
        [contentEditable]:focus {
          outline: 2px solid #0066FF;
          outline-offset: -2px;
          border-radius: 4px;
        }
        [contentEditable] ul, [contentEditable] ol {
          margin-left: 20px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        [contentEditable] li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};
