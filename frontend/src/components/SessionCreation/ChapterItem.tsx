import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  content: any[];
  subChapters: any[];
  supportFiles: any[];
  isExpanded: boolean;
  order: number;
}

interface ChapterItemProps {
  chapter: Chapter;
  isDragging?: boolean;
  isDragOver?: boolean;
  onTitleChange: (id: string, title: string) => void;
  onToggleExpanded: (id: string) => void;
  onDeleteChapter: (id: string) => void;
  onDragStart: (e: React.DragEvent, item: any) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onAddQuiz?: (chapterId: string) => void;
  onAddDevoir?: (chapterId: string) => void;
  onAddExamin?: (chapterId: string) => void;
  children?: React.ReactNode;
}

export const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  isDragging = false,
  isDragOver = false,
  onTitleChange,
  onToggleExpanded,
  onAddSubChapter,
  onDeleteChapter,
  onDragStart,
  onDragOver,
  onDragEnd,
  children,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  return (
    <div className="space-y-2">
      {/* Chapter Header */}
      <div 
        className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid transition-all ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
        } ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDragOver ? 'ring-2 ring-blue-500' : ''
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, { id: chapter.id, type: 'chapter' })}
        onDragOver={(e) => onDragOver(e, chapter.id)}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          
          <div className="flex items-center gap-2">
            <div 
              className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center transition-colors ${
                chapter.title.trim().length > 0
                  ? 'bg-green-500 border-green-500' 
                  : isDark 
                    ? 'bg-gray-600 border-gray-500' 
                    : 'bg-gray-200 border-[#e2e2ea]'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              {t('courseSteps.step2.sections.chapters.chapter')} {chapter.order}:
            </span>
          </div>
          
          <Input
            value={chapter.title}
            onChange={(e) => onTitleChange(chapter.id, e.target.value)}
            placeholder={t('courseSteps.step2.sections.chapters.chapterTitlePlaceholder')}
            className={`flex-1 border-none shadow-none text-[17px] font-medium ${
              isDark 
                ? 'text-white placeholder:text-gray-400 bg-transparent' 
                : 'text-[#6a90b9] placeholder:text-[#6a90b9]'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubChapter(chapter.id)}
            className="flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {t('courseSteps.step2.sections.chapters.addSubChapter')}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(chapter.id)}
            className="p-1"
          >
            {chapter.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteChapter(chapter.id)}
            className="p-1 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chapter Content */}
      {chapter.isExpanded && children}
    </div>
  );
};
