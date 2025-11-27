import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GripVertical, Trash2, ChevronDown, ChevronRight, Edit } from 'lucide-react';

interface SubChapter {
  id: string;
  title: string;
  content: any[];
  evaluations: any[];
  supportFiles: any[];
  isExpanded: boolean;
  order: number;
}

interface SubChapterItemProps {
  subChapter: SubChapter;
  chapterId: string;
  isDragging?: boolean;
  isDragOver?: boolean;
  onTitleChange: (chapterId: string, subChapterId: string, title: string) => void;
  onToggleExpanded: (chapterId: string, subChapterId: string) => void;
  onDeleteSubChapter: (chapterId: string, subChapterId: string) => void;
  onDragStart: (e: React.DragEvent, item: any) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  children?: React.ReactNode;
}

export const SubChapterItem: React.FC<SubChapterItemProps> = ({
  subChapter,
  chapterId,
  isDragging = false,
  isDragOver = false,
  onTitleChange,
  onToggleExpanded,
  onDeleteSubChapter,
  onDragStart,
  onDragOver,
  onDragEnd,
  children,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="ml-6 space-y-2">
      {/* SubChapter Header */}
      <div 
        className={`group flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid transition-all ${
          isDark ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-300'
        } ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDragOver ? 'ring-2 ring-blue-500' : ''
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, { id: subChapter.id, type: 'subchapter', chapterId })}
        onDragOver={(e) => onDragOver(e, subChapter.id)}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          
          <div className="flex items-center gap-2">
            <div 
              className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center transition-colors ${
                subChapter.title.trim().length > 0
                  ? 'bg-green-500 border-green-500' 
                  : isDark 
                    ? 'bg-gray-500 border-gray-400' 
                    : 'bg-gray-200 border-gray-300'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[16px] ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`} style={{
              color: isDark ? '#E9D5FF' : '#9333EA' // Violet/Rose selon la documentation
            }}>
              {t('courseSteps.step2.sections.chapters.subChapter')} {subChapter.order}:
            </span>
          </div>
          
          <Input
            value={subChapter.title}
            onChange={(e) => onTitleChange(chapterId, subChapter.id, e.target.value)}
            placeholder={t('courseSteps.step2.sections.chapters.subChapterTitlePlaceholder')}
            className={`flex-1 border-none shadow-none text-[16px] font-medium ${
              isDark 
                ? 'text-white placeholder:text-gray-400 bg-transparent' 
                : 'text-[#6a90b9] placeholder:text-[#6a90b9]'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(chapterId, subChapter.id)}
            className="p-1"
          >
            {subChapter.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to Phase 3: Édition (expand the subchapter to show content)
              onToggleExpanded(chapterId, subChapter.id);
            }}
            className="p-1 text-blue-500 hover:text-blue-700"
            title="Éditer"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteSubChapter(chapterId, subChapter.id)}
            className="p-1 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* SubChapter Content */}
      {subChapter.isExpanded && children}
    </div>
  );
};
