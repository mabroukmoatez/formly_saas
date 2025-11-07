import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GripVertical, Trash2, Video, FileText, Image } from 'lucide-react';

interface ContentItem {
  id: string;
  type: 'video' | 'text' | 'image';
  title: string | null;
  content: string | null;
  file: string | File | null;
  order: number;
}

interface ContentItemProps {
  contentItem: ContentItem;
  chapterId: string;
  subChapterId: string;
  isDragging?: boolean;
  isDragOver?: boolean;
  onTitleChange: (chapterId: string, subChapterId: string, contentId: string, title: string) => void;
  onDeleteContent: (chapterId: string, subChapterId: string, contentId: string) => void;
  onDragStart: (e: React.DragEvent, item: any) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

export const ContentItemComponent: React.FC<ContentItemProps> = ({
  contentItem,
  chapterId,
  subChapterId,
  isDragging = false,
  isDragOver = false,
  onTitleChange,
  onDeleteContent,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const getIcon = () => {
    switch (contentItem.type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (contentItem.type) {
      case 'video':
        return t('courseSteps.step2.sections.content.video');
      case 'text':
        return t('courseSteps.step2.sections.content.text');
      case 'image':
        return t('courseSteps.step2.sections.content.image');
      default:
        return t('courseSteps.step2.sections.content.content');
    }
  };

  return (
    <div className="ml-12 space-y-2">
      <Card 
        className={`rounded-[15px] border transition-all ${
          isDark ? 'bg-gray-500 border-gray-400' : 'bg-gray-100 border-gray-200'
        } ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDragOver ? 'ring-2 ring-blue-500' : ''
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, { id: contentItem.id, type: 'content', chapterId, subChapterId })}
        onDragOver={(e) => onDragOver(e, contentItem.id)}
        onDragEnd={onDragEnd}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <GripVertical className="w-3 h-3 text-gray-400 cursor-move" />
            
            <div className="flex items-center gap-2">
              <div 
                className={`w-[15px] h-[15px] rounded-[7.5px] border-2 border-solid flex items-center justify-center transition-colors ${
                  contentItem.title && contentItem.title.trim().length > 0
                    ? 'bg-green-500 border-green-500' 
                    : isDark 
                      ? 'bg-gray-400 border-gray-300' 
                      : 'bg-gray-200 border-gray-300'
                }`}
              />
              <div className="flex items-center gap-1">
                {getIcon()}
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  {getTypeLabel()}:
                </span>
              </div>
            </div>
            
            <Input
              value={contentItem.title || ''}
              onChange={(e) => onTitleChange(chapterId, subChapterId, contentItem.id, e.target.value)}
              placeholder={t('courseSteps.step2.sections.content.titlePlaceholder')}
              className={`flex-1 border-none shadow-none text-[15px] font-medium ${
                isDark 
                  ? 'text-white placeholder:text-gray-400 bg-transparent' 
                  : 'text-[#6a90b9] placeholder:text-[#6a90b9]'
              }`}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteContent(chapterId, subChapterId, contentItem.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
